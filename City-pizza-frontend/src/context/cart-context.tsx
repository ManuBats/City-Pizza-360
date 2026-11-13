import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePromociones } from "@/hooks/use-promociones";
import { usePizzas } from "@/hooks/use-pizzas";
import { resolverProducto } from "@/lib/pizzas";

export type CartItem = {
  key: string;
  productoId?: number;
  promocionId?: number;
  nombre: string;
  tamano?: "Personal" | "Mediana" | "Familiar";
  precio: number;
  qty: number;
  nota?: string;
  extraQueso?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  setNota: (key: string, nota: string) => void;
  setExtraQueso: (key: string, extra: boolean) => void;
  remove: (key: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "citypizza360-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [guardados, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { productos } = usePizzas();
  const { promociones } = usePromociones();
  const items = guardados.map((item) => {
    if (item.promocionId != null) {
      const promo = promociones.find((p) => p.id === item.promocionId && p.pedidoOnline);
      return promo ? { ...item, nombre: promo.nombre, precio: promo.precioPromo } : item;
    }
    const producto = item.productoId == null ? undefined : resolverProducto(productos, item.productoId);
    if (!producto) return item;
    const base = item.tamano === "Personal" ? producto.precioPersonal :
      item.tamano === "Mediana" ? producto.precioMediana : producto.precioFamiliar;
    const precio = promociones.reduce((mejor, promo) =>
      promo.pizzaId === producto.id && promo.tamano === item.tamano
        ? Math.min(mejor, promo.precioPromo) : mejor, base);
    return { ...item, precio: precio + (item.extraQueso ? 3 : 0) };
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guardados));
    } catch {
      /* ignore */
    }
  }, [guardados, hydrated]);

  const add = useCallback((item: Omit<CartItem, "key" | "qty">, qty = 1) => {
    const key = item.promocionId != null ? `promo-${item.promocionId}` : `${item.productoId}-${item.tamano}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...item, key, qty }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, qty } : i)),
    );
  }, []);

  const setNota = useCallback((key: string, nota: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, nota } : i)));
  }, []);

  const setExtraQueso = useCallback((key: string, extra: boolean) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key && i.promocionId == null && Boolean(i.extraQueso) !== extra
          ? { ...i, extraQueso: extra, precio: i.precio + (extra ? 3 : -3) }
          : i,
      ),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.precio * i.qty, 0),
    [items],
  );
  const count = useMemo(() => items.reduce((acc, i) => acc + i.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, add, setQty, setNota, setExtraQueso, remove, clear, subtotal, count }),
    [items, add, setQty, setNota, setExtraQueso, remove, clear, subtotal, count],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
