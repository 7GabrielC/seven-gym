import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { sesionesCaja, movimientosCaja } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { FormAbrirCaja } from "./form-abrir";
import { FormAjuste } from "./form-movimiento";
import { FormCerrarCaja } from "./form-cerrar";
import Link from "next/link";

function pesos(centavos: number, decimales = 2): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: decimales,
  });
}

function hora(fecha: Date): string {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CajaPage() {
  const session = await requerirSesion();

  const [cajaAbierta] = await db
    .select()
    .from(sesionesCaja)
    .where(
      and(
        eq(sesionesCaja.usuarioId, session.user.id),
        isNull(sesionesCaja.cerradaEn),
      ),
    );

  if (!cajaAbierta) {
    return (
      <div className="max-w-md px-8 py-7">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Caja</h1>
        <p className="text-sm text-muted-foreground mb-6">
          No tenés una caja abierta. Contá el efectivo del cajón y abrí tu
          turno.
        </p>
        <div className="rounded-lg border border-border bg-card p-5">
          <FormAbrirCaja />
        </div>
        <div className="mt-4">
          <Link
            href="/caja/historial"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver historial de cajas →
          </Link>
        </div>
      </div>
    );
  }

  const movimientos = await db
    .select()
    .from(movimientosCaja)
    .where(eq(movimientosCaja.sesionCajaId, cajaAbierta.id))
    .orderBy(desc(movimientosCaja.creadoEn));

  let totalEsperado = cajaAbierta.montoApertura;
  let ingresos = 0;
  let egresos = 0;
  for (const mov of movimientos) {
    if (mov.tipo === "ingreso") {
      totalEsperado += mov.montoCentavos;
      ingresos += mov.montoCentavos;
    } else {
      totalEsperado -= mov.montoCentavos;
      egresos += mov.montoCentavos;
    }
  }

  return (
    <div className="max-w-5xl px-8 py-7">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Caja</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Turno abierto a las {hora(cajaAbierta.abiertaEn)}
          </p>
        </div>
        <Link
          href="/caja/historial"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Historial
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Esperado */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
              EFECTIVO ESPERADO EN EL CAJÓN
            </div>
            <div className="text-3xl font-semibold tracking-tight tabular">
              {pesos(totalEsperado, 0)}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground">Apertura </span>
                <span className="tabular">
                  {pesos(cajaAbierta.montoApertura, 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Entró </span>
                <span className="tabular text-success">
                  +{pesos(ingresos, 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Salió </span>
                <span className="tabular text-danger">
                  −{pesos(egresos, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Movimientos */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-[11px] tracking-wider text-muted-foreground/70">
                MOVIMIENTOS DEL TURNO
              </span>
              <span className="text-[11px] text-muted-foreground tabular">
                {movimientos.length}
              </span>
            </div>
            {movimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 p-6 text-center">
                Todavía no hubo movimientos en este turno.
              </p>
            ) : (
              <ul>
                {movimientos.map((mov) => (
                  <li
                    key={mov.id}
                    className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`size-1.5 rounded-full shrink-0 ${
                          mov.tipo === "ingreso" ? "bg-success" : "bg-danger"
                        }`}
                      />
                      <span className="text-sm truncate">{mov.concepto}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted-foreground/50 tabular">
                        {hora(mov.creadoEn)}
                      </span>
                      <span
                        className={`text-sm font-medium tabular ${
                          mov.tipo === "ingreso"
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {mov.tipo === "ingreso" ? "+" : "−"}
                        {pesos(mov.montoCentavos)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FormAjuste />
        </div>

        {/* Cierre */}
        <div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-medium mb-1">Cerrar turno</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Contá el efectivo del cajón y declaralo.
            </p>
            <FormCerrarCaja esperado={totalEsperado} />
          </div>
        </div>
      </div>
    </div>
  );
}
