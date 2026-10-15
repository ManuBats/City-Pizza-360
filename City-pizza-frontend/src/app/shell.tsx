import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { CartProvider } from "@/context/cart-context";
import { SessionProvider } from "@/context/session-context";

/** Shell global (equivale a app/layout.tsx de CCA): providers + Toaster. */
export function AppShell() {
  return (
    <CartProvider>
      <SessionProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </SessionProvider>
    </CartProvider>
  );
}
