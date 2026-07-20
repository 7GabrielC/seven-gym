import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { sesionesCaja, movimientosCaja, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

function hora(fecha: Date): string {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DetalleCajaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requerirSesion();
  const soyDueno = session.user.rol === "dueño";
  const { id } = await params;
  const cajaId = Number(id);

  const [caja] = await db
    .select({
      id: sesionesCaja.id,
      apertura: sesionesCaja.montoApertura,
      cierreDeclarado: sesionesCaja.montoCierreDeclarado,
      abiertaEn: sesionesCaja.abiertaEn,
      cerradaEn: sesionesCaja.cerradaEn,
      usuarioId: sesionesCaja.usuarioId,
      nombreUsuario: user.name,
    })
    .from(sesionesCaja)
    .innerJoin(user, eq(sesionesCaja.usuarioId, user.id))
    .where(eq(sesionesCaja.id, cajaId));

  if (!caja) notFound();

  // El recepcionista solo puede ver sus propias cajas
  if (!soyDueno && caja.usuarioId !== session.user.id) notFound();

  const movimientos = await db
    .select()
    .from(movimientosCaja)
    .where(eq(movimientosCaja.sesionCajaId, cajaId))
    .orderBy(movimientosCaja.creadoEn);

  let acumulado = caja.apertura;
  const conAcumulado = movimientos.map((mov) => {
    acumulado +=
      mov.tipo === "ingreso" ? mov.montoCentavos : -mov.montoCentavos;
    return { ...mov, acumulado };
  });

  const esperado = acumulado;
  const declarado = caja.cierreDeclarado ?? 0;
  const diferencia = declarado - esperado;

  return (
    <div className="max-w-4xl px-8 py-7">
      <Link
        href="/caja/historial"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Historial de cajas
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Caja del {new Date(caja.cerradaEn!).toLocaleDateString("es-AR")}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {caja.nombreUsuario} · {hora(caja.abiertaEn)} a {hora(caja.cerradaEn!)}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            APERTURA
          </div>
          <div className="text-lg font-semibold tabular">
            {pesos(caja.apertura)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            ESPERADO
          </div>
          <div className="text-lg font-semibold tabular">{pesos(esperado)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            DECLARADO
          </div>
          <div className="text-lg font-semibold tabular">
            {pesos(declarado)}
          </div>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            diferencia === 0 ? "border-border" : "border-danger/25"
          }`}
        >
          <div
            className={`text-[11px] tracking-wider mb-1.5 ${
              diferencia === 0 ? "text-muted-foreground/70" : "text-danger"
            }`}
          >
            DIFERENCIA
          </div>
          <div
            className={`text-lg font-semibold tabular ${
              diferencia !== 0 ? "text-danger" : ""
            }`}
          >
            {diferencia === 0
              ? "OK"
              : `${diferencia < 0 ? "Faltan" : "Sobran"} ${pesos(Math.abs(diferencia))}`}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <span className="text-[11px] tracking-wider text-muted-foreground/70">
            MOVIMIENTOS DEL TURNO ({movimientos.length})
          </span>
        </div>
        {movimientos.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 p-6 text-center">
            No hubo movimientos en este turno.
          </p>
        ) : (
          <ul>
            {conAcumulado.map((mov) => (
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
                    className={`text-sm font-medium tabular w-28 text-right ${
                      mov.tipo === "ingreso" ? "text-success" : "text-danger"
                    }`}
                  >
                    {mov.tipo === "ingreso" ? "+" : "−"}
                    {pesos(mov.montoCentavos)}
                  </span>
                  <span className="text-xs text-muted-foreground/60 tabular w-28 text-right">
                    {pesos(mov.acumulado)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
