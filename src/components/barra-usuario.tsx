"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BarraUsuario({ nombre, rol }: { nombre: string; rol: string }) {
  const router = useRouter();

  async function cerrarSesion() {
    await authClient.signOut();
    router.push("/login");
  }

  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="size-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
        {iniciales}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate leading-tight">
          {nombre}
        </div>
        <div className="text-[11px] text-muted-foreground capitalize leading-tight">
          {rol}
        </div>
      </div>
      <button
        onClick={cerrarSesion}
        title="Cerrar sesión"
        className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors shrink-0"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>
    </div>
  );
}
