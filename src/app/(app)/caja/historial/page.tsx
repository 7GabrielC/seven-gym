import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { sesionesCaja, movimientosCaja, user } from "@/db/schema";
import { eq, and, isNotNull, desc, inArray } from "drizzle-orm";
import Link from "next/link";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export default async function HistorialCajaPage() {
  const session = await requerirSesion();
  const soyDueno = session.user.rol === "dueño";

  const condiciones = soyDueno
    ? isNotNull(sesionesCaja.cerradaEn)
    : and(
        isNotNull(sesionesCaja.cerradaEn),
        eq(sesionesCaja.usuarioId, session.user.id),
      );

  const cajas = await db
    .select({
      id: sesionesCaja.id,
      apertura: sesionesCaja.montoApertura,
      cierreDeclarado: sesionesCaja.montoCierreDeclarado,
      abiertaEn: sesionesCaja.abiertaEn,
      cerradaEn: sesionesCaja.cerradaEn,
      nombreUsuario: user.name,
    })
    .from(sesionesCaja)
    .innerJoin(user, eq(sesionesCaja.usuarioId, user.id))
    .where(condiciones)
    .orderBy(desc(sesionesCaja.cerradaEn));

  const idsCajas = cajas.map((c) => c.id);
  const movs =
    idsCajas.length > 0
      ? await db
          .select({
            sesionCajaId: movimientosCaja.sesionCajaId,
            tipo: movimientosCaja.tipo,
            monto: movimientosCaja.montoCentavos,
          })
          .from(movimientosCaja)
          .where(inArray(movimientosCaja.sesionCajaId, idsCajas))
      : [];

  const saldoPorCaja = new Map<number, number>();
  for (const m of movs) {
    const actual = saldoPorCaja.get(m.sesionCajaId) ?? 0;
    saldoPorCaja.set(
      m.sesionCajaId,
      m.tipo === "ingreso" ? actual + m.monto : actual - m.monto,
    );
  }

  const cajasConDatos = cajas.map((caja) => {
    const esperado = caja.apertura + (saldoPorCaja.get(caja.id) ?? 0);
    const declarado = caja.cierreDeclarado ?? 0;
    return { ...caja, esperado, declarado, diferencia: declarado - esperado };
  });

  const conDiferencia = cajasConDatos.filter((c) => c.diferencia !== 0).length;

  return (
    <div className="max-w-4xl px-8 py-7">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Historial de cajas
        </h1>
        <Link
          href="/caja"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver a caja
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {cajasConDatos.length}{" "}
        {cajasConDatos.length === 1 ? "turno cerrado" : "turnos cerrados"}
        {conDiferencia > 0 && (
          <span className="text-danger"> · {conDiferencia} con diferencia</span>
        )}
      </p>

      {cajasConDatos.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay cajas cerradas todavía.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {soyDueno && (
                  <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                    USUARIO
                  </th>
                )}
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  CERRADA
                </th>
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  APERTURA
                </th>
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  ESPERADO
                </th>
                <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  DECLARADO
                </th>
                <th className="py-2.5 px-4 text-right text-[11px] font-normal tracking-wider text-muted-foreground/70">
                  DIFERENCIA
                </th>
              </tr>
            </thead>
            <tbody>
              {cajasConDatos.map((caja) => (
                <tr
                  key={caja.id}
                  className="border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-surface-2 cursor-pointer"
                >
                  {soyDueno && (
                    <td className="p-0">
                      <Link
                        href={`/caja/historial/${caja.id}`}
                        className="block py-2.5 px-4 text-sm text-muted-foreground"
                      >
                        {caja.nombreUsuario}
                      </Link>
                    </td>
                  )}
                  <td className="p-0">
                    <Link
                      href={`/caja/historial/${caja.id}`}
                      className="block py-2.5 px-4 text-sm text-muted-foreground tabular whitespace-nowrap"
                    >
                      {caja.cerradaEn
                        ? new Date(caja.cerradaEn).toLocaleDateString("es-AR")
                        : "—"}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/caja/historial/${caja.id}`}
                      className="block py-2.5 px-4 text-sm tabular"
                    >
                      {pesos(caja.apertura)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/caja/historial/${caja.id}`}
                      className="block py-2.5 px-4 text-sm tabular"
                    >
                      {pesos(caja.esperado)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/caja/historial/${caja.id}`}
                      className="block py-2.5 px-4 text-sm tabular"
                    >
                      {pesos(caja.declarado)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link
                      href={`/caja/historial/${caja.id}`}
                      className="flex justify-end py-2.5 px-4"
                    >
                      {caja.diferencia === 0 ? (
                        <span className="text-xs text-success">OK</span>
                      ) : (
                        <span className="rounded-full border border-danger/30 bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger tabular">
                          {caja.diferencia < 0 ? "Faltan " : "Sobran "}
                          {pesos(Math.abs(caja.diferencia))}
                        </span>
                      )}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
