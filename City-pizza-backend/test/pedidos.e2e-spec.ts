import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma/prisma.service';

describe('Pedidos con PostgreSQL aislado', () => {
  let app: INestApplication;
  let db: PrismaService;
  let insumo: number;
  let pizzas: number[] = [];
  let pedidos: number[] = [];
  let clave: string;
  const trabajadores: number[] = [];
  const archivos: string[] = [];

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    db = app.get(PrismaService);
    const sufijo = randomUUID();
    insumo = (await db.insumo.create({ data: { nombre: sufijo, stock: 0.2 } }))
      .id;
    for (const nombre of ['A', 'B']) {
      const pizza = await db.pizza.create({
        data: {
          nombre: `${nombre}-${sufijo}`,
          precioPersonal: 10,
          precioMediana: 15,
          insumos: { create: { insumoId: insumo, cantidad: 0.15 } },
        },
      });
      pizzas.push(pizza.id);
    }
  });

  afterAll(async () => {
    if (!db) return;
    try {
      await db.detallePedido.deleteMany({ where: { pizzaId: { in: pizzas } } });
      await db.pedido.deleteMany({ where: { id: { in: pedidos } } });
      await db.trabajador.deleteMany({ where: { id: { in: trabajadores } } });
      await Promise.all(
        archivos.map((archivo) =>
          rm(join(process.cwd(), 'uploads-private', 'comprobantes', archivo), {
            force: true,
          }),
        ),
      );
      await db.pizza.deleteMany({ where: { id: { in: pizzas } } });
      if (insumo) await db.insumo.delete({ where: { id: insumo } });
    } finally {
      await app.close();
    }
  });

  const body = () => ({
    nombres: 'Prueba',
    apellidos: 'Integración',
    celular: '900000001',
    tipoEntrega: 'Recojo',
    items: [{ pizzaId: pizzas[0], cantidad: 1, tamano: 'Personal' }],
  });
  const stock = async () =>
    (await db.insumo.findUniqueOrThrow({ where: { id: insumo } })).stock;

  it('rechaza el consumo acumulado sin descontar stock y protege el alta de salón', async () => {
    await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        ...body(),
        items: [
          ...body().items,
          { pizzaId: pizzas[1], cantidad: 1, tamano: 'Mediana' },
        ],
      })
      .expect(400);
    expect(await stock()).toBe(0.2);
    await request(app.getHttpServer())
      .post('/pedidos')
      .send({ ...body(), tipoEntrega: 'Mesa' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/pedidos/mesa')
      .send({ ...body(), mesa: 2 })
      .expect(401);
  });

  it('solo confirma una compra concurrente y devuelve la misma compra al reintentar', async () => {
    const http = request(app.getHttpServer());
    const claves = [randomUUID(), randomUUID()];
    const resultados = await Promise.all(
      claves.map((claveSolicitud) =>
        http.post('/pedidos').send({ ...body(), claveSolicitud }),
      ),
    );
    for (const r of resultados) if (r.status === 201) pedidos.push(r.body.id);
    expect(resultados.map((r) => r.status).sort()).toEqual([201, 400]);
    const ganador = resultados.findIndex((r) => r.status === 201);
    clave = claves[ganador];
    const repetido = await http
      .post('/pedidos')
      .send({ ...body(), claveSolicitud: clave })
      .expect(201);
    expect(repetido.body.id).toBe(resultados[ganador].body.id);
    expect(await stock()).toBeCloseTo(0.05);
  });

  it('acepta dos tamaños y deduplica solicitudes simultáneas con la misma clave', async () => {
    await db.insumo.update({ where: { id: insumo }, data: { stock: 0.3 } });
    const claveSolicitud = randomUUID();
    const payload = {
      ...body(),
      claveSolicitud,
      items: [
        ...body().items,
        { pizzaId: pizzas[0], cantidad: 1, tamano: 'Mediana' },
      ],
    };
    const resultados = await Promise.all(
      Array.from({ length: 2 }, () =>
        request(app.getHttpServer()).post('/pedidos').send(payload),
      ),
    );
    for (const r of resultados) if (r.status === 201) pedidos.push(r.body.id);
    expect(resultados.map((r) => r.status)).toEqual([201, 201]);
    expect(resultados[0].body.id).toBe(resultados[1].body.id);
    expect(resultados[0].body.total).toBe(25);
    expect(await stock()).toBeCloseTo(0);
  });

  it('protege la entrega, revoca cuentas y permite reemplazar y aprobar Yape', async () => {
    async function trabajador(rol: 'Cajero' | 'Cocinero' | 'Repartidor') {
      const cuenta = await db.trabajador.create({
        data: { rol, usuario: randomUUID(), nombre: rol, passHash: 'ficticio' },
      });
      trabajadores.push(cuenta.id);
      const token = app
        .get(JwtService)
        .sign({ sub: cuenta.id }, { secret: process.env.JWT_SECRET });
      return { id: cuenta.id, auth: `Bearer ${token}` };
    }
    const caja = await trabajador('Cajero');
    const cocina = await trabajador('Cocinero');
    const repartidor = await trabajador('Repartidor');
    const http = request(app.getHttpServer());
    await db.insumo.update({ where: { id: insumo }, data: { stock: 1 } });
    const pedido = await http
      .post('/pedidos')
      .send({
        ...body(),
        tipoEntrega: 'Delivery',
        direccion: 'Dirección ficticia',
        metodoPago: 'Yape',
      })
      .expect(201);
    const { id, codigo } = pedido.body;
    pedidos.push(id);
    const comprobante = `/pedidos/${id}/comprobante`;
    const estado = (valor: string, auth: string) =>
      http
        .patch(`/pedidos/${id}/estado`)
        .set('Authorization', auth)
        .send({ estado: valor });
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1sAAAAASUVORK5CYII=',
      'base64',
    );
    const subir = (token?: string) =>
      http
        .post(comprobante)
        .set('X-Comprobante-Token', token ?? '')
        .attach('comprobante', png, 'prueba.png');
    await estado('Preparacion', repartidor.auth).expect(403);
    await estado('Preparacion', cocina.auth).expect(400);
    await subir().expect(403);
    await http.get(comprobante).expect(401);
    await http
      .get(comprobante)
      .set('Authorization', repartidor.auth)
      .expect(403);
    const seguimiento = await http
      .get('/pedidos/tracking')
      .query({ codigo, celular: body().celular })
      .expect(200);
    await subir(seguimiento.body.comprobanteToken).expect(201);
    const primero = (await db.pedido.findUniqueOrThrow({ where: { id } }))
      .comprobanteUrl!;
    archivos.push(primero);
    await http
      .get(comprobante)
      .set('Authorization', caja.auth)
      .expect(200)
      .expect('Content-Type', /image\/png/);
    await http
      .patch(`/pedidos/${id}/pago`)
      .set('Authorization', caja.auth)
      .send({ estadoPago: 'Rechazado' })
      .expect(200);
    await subir(seguimiento.body.comprobanteToken).expect(201);
    archivos.push(
      (await db.pedido.findUniqueOrThrow({ where: { id } })).comprobanteUrl!,
    );
    await http
      .patch(`/pedidos/${id}/pago`)
      .set('Authorization', caja.auth)
      .send({ estadoPago: 'Verificado' })
      .expect(200);
    await estado('Preparacion', cocina.auth).expect(200);
    await estado('Listo', cocina.auth).expect(200);
    await http
      .patch(`/pedidos/${id}/asignar`)
      .set('Authorization', cocina.auth)
      .send({ repartidorId: repartidor.id })
      .expect(200);
    await estado('EnCamino', repartidor.auth).expect(200);
    await estado('Entregado', repartidor.auth).expect(200);
    await db.trabajador.update({
      where: { id: caja.id },
      data: { activo: false },
    });
    await http.get('/pedidos').set('Authorization', caja.auth).expect(401);
  });
});
