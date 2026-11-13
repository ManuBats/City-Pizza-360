require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const { join, extname } = require('node:path');

const prisma = new PrismaClient();
const paquete = join(__dirname, 'catalogo');
const fotos = join(paquete, 'fotos');
const manifiesto = join(paquete, 'catalogo.json');
const subidas = join(__dirname, '..', 'uploads', 'productos');
const prefijo = '/uploads/productos/';
const nombreFoto = /^[a-f0-9]{64}\.(?:png|jpe?g|webp)$/;
const hash = (contenido) => createHash('sha256').update(contenido).digest('hex');

async function guardarImagen(url) {
  if (!url) return null;
  const nombre = url.slice(prefijo.length);
  const extension = extname(nombre).toLowerCase();
  if (!url.startsWith(prefijo) || !/^[\w.-]+$/.test(nombre) || !/^\.(png|jpe?g|webp)$/.test(extension)) {
    throw new Error(`Imagen de catálogo no exportable: ${url}`);
  }
  const contenido = await readFile(join(subidas, nombre));
  const archivo = hash(contenido) + extension;
  await writeFile(join(fotos, archivo), contenido);
  return archivo;
}

async function exportar() {
  const [productos, promociones] = await prisma.$transaction([
    prisma.pizza.findMany({ orderBy: { nombre: 'asc' }, include: {
      insumos: { orderBy: { insumoId: 'asc' }, include: { insumo: true } },
    } }),
    prisma.promocion.findMany({ orderBy: { id: 'asc' }, include: {
      pizza: { select: { nombre: true } },
    } }),
  ], { isolationLevel: 'RepeatableRead' });
  await mkdir(fotos, { recursive: true });
  const insumos = new Map();
  const carta = [];
  for (const { id, imagenUrl, insumos: receta, ...producto } of productos) {
    for (const { insumo: { id, stock, ...insumo } } of receta) {
      insumos.set(insumo.nombre, insumo);
    }
    carta.push({
      ...producto,
      foto: await guardarImagen(imagenUrl),
      receta: receta.map(({ cantidad, insumo }) => ({ insumo: insumo.nombre, cantidad })),
    });
  }
  const ofertas = [];
  for (const { id, pizzaId, pizza, imagenUrl, ...promocion } of promociones) {
    ofertas.push({ ...promocion, producto: pizza?.nombre ?? null, foto: await guardarImagen(imagenUrl) });
  }
  const datos = { version: 1, productos: carta, promociones: ofertas, insumos: [...insumos.values()] };
  await writeFile(manifiesto, JSON.stringify(datos, null, 2) + '\n');
  console.log(`Exportados ${carta.length} productos, ${ofertas.length} promociones y ${insumos.size} insumos vinculados.`);
}

async function importar() {
  const datos = JSON.parse(await readFile(manifiesto, 'utf8'));
  if (datos.version !== 1) throw new Error('Versión de catálogo incompatible.');
  const imagenes = new Map();
  for (const { foto } of [...datos.productos, ...datos.promociones]) {
    if (foto === null || imagenes.has(foto)) continue;
    if (!nombreFoto.test(foto)) throw new Error('Nombre de imagen inválido en el catálogo.');
    const contenido = await readFile(join(fotos, foto));
    if (hash(contenido) !== foto.split('.')[0]) throw new Error(`Imagen dañada: ${foto}`);
    imagenes.set(foto, contenido);
  }
  await mkdir(subidas, { recursive: true });
  for (const [foto, contenido] of imagenes) {
    await writeFile(join(subidas, foto), contenido);
  }
  await prisma.$transaction(async (tx) => {
    const insumos = new Map();
    for (const insumo of datos.insumos) {
      const guardado = await tx.insumo.upsert({
        where: { nombre: insumo.nombre }, create: insumo, update: {},
      });
      insumos.set(insumo.nombre, guardado.id);
    }
    const productos = new Map();
    for (const { foto, receta, ...producto } of datos.productos) {
      const imagenUrl = foto ? prefijo + foto : null;
      const guardado = await tx.pizza.upsert({
        where: { nombre: producto.nombre },
        create: { ...producto, imagenUrl },
        update: { ...producto, ...(imagenUrl ? { imagenUrl } : {}) },
      });
      productos.set(producto.nombre, guardado.id);
      for (const { insumo, cantidad } of receta) {
        const clave = { pizzaId: guardado.id, insumoId: insumos.get(insumo) };
        await tx.pizzaInsumo.upsert({
          where: { pizzaId_insumoId: clave }, create: { ...clave, cantidad }, update: { cantidad },
        });
      }
    }
    for (const { foto, producto, ...promocion } of datos.promociones) {
      const pizzaId = producto ? productos.get(producto) : null;
      const inicio = new Date(promocion.inicio);
      const data = { ...promocion, pizzaId, inicio, fin: promocion.fin ? new Date(promocion.fin) : null };
      const existente = await tx.promocion.findFirst({
        where: { nombre: promocion.nombre, tipo: promocion.tipo, inicio, pizzaId, tamano: promocion.tamano },
      });
      const imagenUrl = foto ? prefijo + foto : null;
      if (existente) {
        await tx.promocion.update({ where: { id: existente.id }, data: { ...data, ...(imagenUrl ? { imagenUrl } : {}) } });
      } else {
        await tx.promocion.create({ data: { ...data, imagenUrl } });
      }
    }
  }, { timeout: 30_000 });
  console.log(`Importados ${datos.productos.length} productos, ${datos.promociones.length} promociones y ${imagenes.size} imágenes.`);
}

const comando = process.argv[2];
const ejecutar = { exportar, importar }[comando];
Promise.resolve()
  .then(() => {
    if (comando !== 'exportar' && comando !== 'importar') throw new Error('Usa exportar o importar.');
    return ejecutar();
  })
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
