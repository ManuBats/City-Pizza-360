import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WorkerAccessLink } from "@/components/worker/WorkerAccessLink";
import { LOCAL } from "@/lib/pizzas";

/** Footer de marca: el mismo del homepage, en todas las secciones de cliente. */
export function FooterMarca() {
  return (
    <footer className="bg-brand-black py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">
            CityPizza<span className="text-secondary">360</span>
          </p>
          <p className="mt-2 text-sm text-white/70">{LOCAL.nombre}</p>
        </div>
        <div className="text-sm text-white/70">
          <p className="font-semibold text-white">Encuéntranos</p>
          <p className="mt-1">{LOCAL.direccion}</p>
        </div>
        <div className="text-sm text-white/70">
          <p className="font-semibold text-white">Horario</p>
          <p className="mt-1">{LOCAL.horario}</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <WorkerAccessLink />
      </div>
    </footer>
  );
}

/** Marco de páginas cliente (equivale al grupo (public)/ de CCA). */
export function TiendaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {children}
      <FooterMarca />
    </div>
  );
}
