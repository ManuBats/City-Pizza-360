import { test } from "node:test";
import assert from "node:assert/strict";
import { promocionVigente, fechaPromocion } from "../src/lib/promociones.ts";

const ahora = Date.parse("2026-11-12T20:00:00Z");
const promo = {
  id: 1, nombre: "Oferta de prueba", descripcion: null, precioPromo: 45,
  tipo: "Permanente", activa: true, inicio: "2026-11-12T19:00:00Z", fin: null,
};

test("publica activas sin fin y activas antes de su vencimiento", () => {
  assert.equal(promocionVigente(promo, ahora), true);
  assert.equal(promocionVigente({ ...promo, fin: "2026-11-12T21:00:00Z" }, ahora), true);
});

test("oculta pausadas y promociones que todavía no empiezan", () => {
  assert.equal(promocionVigente({ ...promo, activa: false }, ahora), false);
  assert.equal(promocionVigente({ ...promo, inicio: "2026-11-12T21:00:00Z" }, ahora), false);
});

test("retira la misma oferta al llegar a su fin sin una nueva respuesta de red", () => {
  const flash = { ...promo, tipo: "Flash", fin: "2026-11-12T20:00:01Z" };
  assert.equal(promocionVigente(flash, ahora), true);
  assert.equal(promocionVigente(flash, ahora + 1000), false);
  assert.equal(promocionVigente(flash, ahora + 60_000), false);
});

test("no publica fechas inválidas ni promociones ya vencidas", () => {
  assert.equal(promocionVigente({ ...promo, inicio: "inválida" }, ahora), false);
  assert.equal(promocionVigente({ ...promo, fin: "inválida" }, ahora), false);
  assert.equal(promocionVigente({ ...promo, fin: "2026-11-12T19:59:59Z" }, ahora), false);
});

test("presenta la fecha en Lima incluso si UTC ya está en el día siguiente", () => {
  const texto = fechaPromocion("2026-11-13T02:30:00Z");
  assert.match(texto, /12 de noviembre de 2026/);
  assert.match(texto, /(?:21|09):30/);
});
