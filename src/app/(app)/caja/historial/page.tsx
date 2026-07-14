import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { sesionesCaja, movimientosCaja, user } from "@/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
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

    // Para cada caja, calcular el esperado y la diferencia
    const cajasConDatos = await Promise.all(
        cajas.map(async (caja) => {
        const movs = await db
            .select()
            .from(movimientosCaja)
            .where(eq(movimientosCaja.sesionCajaId, caja.id));

        let esperado = caja.apertura;
        for (const m of movs) {
            if (m.tipo === "ingreso") esperado += m.montoCentavos;
            else esperado -= m.montoCentavos;
        }

        const declarado = caja.cierreDeclarado ?? 0;
        const diferencia = declarado - esperado;

        return { ...caja, esperado, declarado, diferencia };
        })
    );

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
                    <td className="py-2 pr-4">{pesos(caja.apertura)}</td>
                    <td className="py-2 pr-4">{pesos(caja.esperado)}</td>
                    <td className="py-2 pr-4">{pesos(caja.declarado)}</td>
                    <td className="py-2 pr-4">
                    <span
                        className={
                        caja.diferencia === 0
                            ? "text-green-600"
                            : "text-red-600 font-medium"
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