import { requerirDueno } from "@/lib/session";
import { db } from "@/db";
import { user } from "@/db/schema";
import { FormUsuario } from "./form-usuario";

export default async function UsuariosPage() {
  await requerirDueno();

  const usuarios = await db.select().from(user);
  const duenos = usuarios.filter((u) => u.rol === "dueño").length;

  return (
    <div className="max-w-4xl px-8 py-7">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Usuarios del sistema
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {usuarios.length} en total · {duenos} {duenos === 1 ? "dueño" : "dueños"}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-[11px] tracking-wider text-muted-foreground/70">
              CUENTAS
            </span>
          </div>
          <ul>
            {usuarios.map((u) => {
              const iniciales = u.name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0] ?? "")
                .join("")
                .toUpperCase();
              const esDueno = u.rol === "dueño";

              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                      {iniciales}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${
                      esDueno
                        ? "bg-primary/10 text-primary border border-primary/25"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {esDueno ? "Dueño" : "Recepcionista"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 h-fit">
          <h2 className="text-sm font-medium mb-4">Crear usuario</h2>
          <FormUsuario />
        </div>
      </div>
    </div>
  );
}