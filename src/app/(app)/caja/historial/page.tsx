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

    // Traer cajas cerradas. El dueño ve todas; el recepcionista solo las suyas.
    const condiciones = soyDueno
        ? isNotNull(sesionesCaja.cerradaEn)
        : and(
            isNotNull(sesionesCaja.cerradaEn),
            eq(sesionesCaja.usuarioId, session.user.id)
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

    // Todos los movimientos de todas esas cajas, en UNA consulta
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

    // Agrupar el saldo de cada caja en memoria
    const saldoPorCaja = new Map<number, number>();
    for (const m of movs) {
        const actual = saldoPorCaja.get(m.sesionCajaId) ?? 0;
        saldoPorCaja.set(
        m.sesionCajaId,
        m.tipo === "ingreso" ? actual + m.monto : actual - m.monto
        );
    }

    const cajasConDatos = cajas.map((caja) => {
        const esperado = caja.apertura + (saldoPorCaja.get(caja.id) ?? 0);
        const declarado = caja.cierreDeclarado ?? 0;
        return { ...caja, esperado, declarado, diferencia: declarado - esperado };
    });

    return (
        <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Historial de cajas</h1>
            <Link href="/caja" className="text-sm text-blue-600 hover:underline">
            ← Volver a caja
            </Link>
        </div>

        {cajasConDatos.length === 0 ? (
            <p className="text-muted-foreground">No hay cajas cerradas todavía.</p>
        ) : (
            <table className="w-full border-collapse text-sm">
            <thead>
                <tr className="border-b text-left">
                {soyDueno && <th className="py-2 pr-4">Usuario</th>}
                <th className="py-2 pr-4">Cerrada</th>
                <th className="py-2 pr-4">Apertura</th>
                <th className="py-2 pr-4">Esperado</th>
                <th className="py-2 pr-4">Declarado</th>
                <th className="py-2 pr-4">Diferencia</th>
                </tr>
            </thead>
            <tbody>
                {cajasConDatos.map((caja) => (
                <tr key={caja.id} className="border-b">
                    {soyDueno && <td className="py-2 pr-4">{caja.nombreUsuario}</td>}
                    <td className="py-2 pr-4">
                    {caja.cerradaEn
                        ? new Date(caja.cerradaEn).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 tabular">{pesos(caja.apertura)}</td>
                    <td className="py-2 pr-4 tabular">{pesos(caja.esperado)}</td>
                    <td className="py-2 pr-4 tabular">{pesos(caja.declarado)}</td>
                    <td className="py-2 pr-4">
                    <span
                        className={
                        caja.diferencia === 0
                            ? "text-success"
                            : "text-danger font-medium"
                        }
                    >
                        {caja.diferencia === 0 ? "OK" : pesos(caja.diferencia)}
                    </span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    );
}