import type { ReactNode } from "react";
import { LogoutButton } from "@/components/worker/worker-auth";
import { useSessionContext } from "@/context/session-context";

interface StaffLayoutProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  /** dark: página completa oscura (KDS); light: solo header oscuro (default). */
  tone?: "dark" | "light";
  children: ReactNode;
}

/** Marco de páginas staff (equivale al área con guard de CCA). */
export function StaffLayout({ icon, title, subtitle, badge, tone = "light", children }: StaffLayoutProps) {
  const { session } = useSessionContext();
  return (
    <div className={tone === "dark" ? "flex min-h-screen flex-col bg-brand-black text-white" : "flex min-h-screen flex-col bg-background"}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary">
              {icon}
            </span>
            <div>
              <p className="text-lg font-extrabold leading-tight">{title}</p>
              <p className="text-xs text-white/60">
                {session ? `${session.nombre} · ${subtitle}` : subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {badge}
            <LogoutButton dark />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
