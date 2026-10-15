import type { Categoria } from "@/lib/pizzas";
import { MenuPage } from "@/app/(tienda)/menu/page";

export type MenuSearch = { categoria?: Categoria | undefined };

export default MenuPage;
