import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CampoProps {
  titulo: string;
  children: ReactNode;
  className?: string;
}

/** Etiqueta + campo (formularios admin/cajero más intuitivos). */
export function Campo({ titulo, children, className }: CampoProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{titulo}</span>
      {children}
    </label>
  );
}
