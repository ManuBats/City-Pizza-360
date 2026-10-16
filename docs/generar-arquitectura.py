# Genera docs/arquitectura-citypizza360.png con Pillow (sin dependencias externas).
# Uso: python docs/generar-arquitectura.py
from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "arquitectura-citypizza360.png")

W, H = 1600, 1120
BG = (22, 22, 22)
PANEL = (30, 30, 30)
BORDER = (70, 70, 70)
RED = (192, 57, 43)
YELLOW = (241, 196, 15)
WHITE = (245, 245, 245)
GRAY = (170, 170, 170)
GREEN = (46, 204, 113)

def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(os.path.join("C:\\Windows\\Fonts", name), size)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def box(x, y, w, h, title, lines, accent=YELLOW, tsize=24, lsize=19):
    h = 14 + tsize + 14 + len(lines) * (lsize + 7) + 18
    d.rounded_rectangle([x, y, x + w, y + h], 14, fill=PANEL, outline=BORDER, width=2)
    d.rectangle([x + 18, y, x + 150, y + 5], fill=accent)
    d.text((x + 18, y + 14), title, font=font(tsize, True), fill=WHITE)
    yy = y + 14 + tsize + 14
    for line in lines:
        if line.startswith("  "):
            d.text((x + 34, yy), line.strip(), font=font(lsize), fill=GRAY)
        elif line.startswith("#"):
            d.text((x + 18, yy), line[1:], font=font(lsize, True), fill=YELLOW)
        else:
            d.text((x + 18, yy), line, font=font(lsize), fill=WHITE)
        yy += lsize + 7
    return y + h

def arrow(x, y1, y2, label):
    d.line([x, y1, x, y2], fill=RED, width=4)
    d.polygon([(x - 10, y2 - 16), (x + 10, y2 - 16), (x, y2)], fill=RED)
    tw = d.textbbox((0, 0), label, font=font(18, True))
    d.text((x + 16, (y1 + y2) // 2 - 12), label, font=font(18, True), fill=YELLOW)

# Título
d.text((40, 26), "CityPizza360 — Arquitectura del sistema", font=font(34, True), fill=WHITE)
d.text((40, 68), "Monolito Modular + Cliente-Servidor + MVC  ·  NestJS 10 + Vite/React + PostgreSQL 18", font=font(20), fill=GRAY)

y = 118
y = box(40, y, 1520, 300, "CLIENTE · Vista (navegador :5173) — Vite 8 + React 19 + TanStack + Tailwind",
    [    "routes/ (11: /, menu, checkout, tracking, login, cocina, delivery, cajero, mesa, admin, admin/usuarios)",
     "app/ (11 páginas: (tienda) landing/menu/checkout/tracking · (interno) resto + layouts + shell)",
     "components/ (menu, cocina, delivery, cart, worker, admin, ui) + hooks/ (checkout, cola 3s, tracking 10s, sesión…)",
     "services/ — ÚNICA que toca red (apiFetch + JWT) · types/ (espejo BD) · context/ (sesión, carrito) · lib/ (RBAC)"],
    accent=YELLOW) + 22
arrow(800, y, y + 44, "HTTPS JSON · API :3000")
y += 58
y = box(40, y, 1520, 330, "SERVIDOR · Controlador + Modelo-lógico (NestJS 10) — Monolito Modular",
    ["#api/ (9 módulos: auth, catálogo, pedidos, cocina, inventario, reportes, trabajadores, promociones)",
     "  controllers/ → rutas + DTO + guards  ·  services/ → reglas + Prisma  ·  dto/ → validación",
     "#middlewares/ → JWT 12h + @Roles (RBAC: Admin, Cajero, Cocinero, Repartidor, Mesero)",
     "#utils/ → precios, serializar  ·  constants/ → queso+3, delivery+5, flash48h  ·  config/prisma → 1 instancia",
     "POST /pedidos (invitado) · GET /pizzas · tracking · /cocina/cola · mis-entregas · uploads Yape"],
    accent=RED) + 22
arrow(800, y, y + 44, "Prisma 6")
y += 58
y = box(40, y, 1520, 218, "MODELO · PostgreSQL 18 (puerto 5432, DB citypizza360)",
    [    "Pedido (código CP360-XXXX, 3 tamaños, nota, extraQueso, Efectivo/Yape, comprobante, repartidor, mesa)",
     "Pizza (precios P/M/F, descripcion, imagenUrl, destacada) · Insumo + stock · Promocion (Permanente/Flash)",
     "Reglas: $transaction todo-o-nada · sin queso no hay Hawaiana · estados Recibido→…→Entregado (400 si inválida)"],
    accent=GREEN) + 22
# Fila inferior: roles + patrones
box(40, y, 740, 252, "FLUJOS POR ROL",
    ["Invitado → menú → checkout → tracking (código+celular)",
     "Cocina → cola 3s → avanzar → asignar repartidor",
     "Delivery → solo mis-entregas → EnCamino → Entregado",
     "Cajero → pedidos + agotados + flash · Mesero → mesa → cocina",
     "Admin → todo + CRUD + inventario + usuarios + reportes"],
    accent=YELLOW, tsize=22, lsize=18)
box(820, y, 740, 252, "PATRONES (dónde vive cada uno)",
    ["MVC → controllers / routes+components / services+Prisma",
     "Singleton → config/prisma · DTO+ValidationPipe → dto/",
     "Unit of Work → $transaction · State → SIGUIENTE_ESTADO",
     "Observer → polling 3s/10s · Strategy-tabla · Facade → services"],
    accent=RED, tsize=22, lsize=18)

img.save(OUT)
print("OK:", OUT)
