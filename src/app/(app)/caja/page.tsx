import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { sesionesCaja, movimientosCaja } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { FormAbrirCaja } from "./form-abrir";
import { FormMovimiento } from "./form-movimiento";
import { FormCerrarCaja } from "./form-cerrar";
import Link from "next/link";

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
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
            isNull(sesionesCaja.cerradaEn)
        )
        );

    if (!cajaAbierta) {
        return (
        <div className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-6">Caja</h1>
            <FormAbrirCaja />
        </div>
        );
    }

    // Traer los movimientos de esta caja
    const movimientos = await db
        .select()
        .from(movimientosCaja)
        .where(eq(movimientosCaja.sesionCajaId, cajaAbierta.id))
        .orderBy(desc(movimientosCaja.creadoEn));

    // Calcular el total esperado: apertura + ingresos - egresos
    let totalEsperado = cajaAbierta.montoApertura;
    for (const mov of movimientos) {
        if (mov.tipo === "ingreso") {
        totalEsperado += mov.montoCentavos;
        } else {
        totalEsperado -= mov.montoCentavos;
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Caja</h1>
                <Link href="/caja/historial" className="text-sm text-blue-600 hover:underline">
                    Ver historial
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Apertura</p>
                <p className="text-xl font-bold">{pesos(cajaAbierta.montoApertura)}</p>
                </div>
                <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Efectivo esperado ahora</p>
                <p className="text-xl font-bold">{pesos(totalEsperado)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <h2 className="text-lg font-semibold mb-3">Registrar movimiento</h2>
                <FormMovimiento />
                </div>

                <div>
                <h2 className="text-lg font-semibold mb-3">
                    Movimientos ({movimientos.length})
                </h2>
                {movimientos.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin movimientos todavía.</p>
                ) : (
                    <ul className="space-y-2">
                    {movimientos.map((mov) => (
                        <li
                        key={mov.id}
                        className="flex justify-between items-center text-sm border-b pb-2"
                        >
                        <span>
                            <span
                            className={
                                mov.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                            }
                            >
                            {mov.tipo === "ingreso" ? "+" : "−"} {pesos(mov.montoCentavos)}
                            </span>
                            <span className="text-gray-500 ml-2">{mov.concepto}</span>
                        </span>
                        </li>
                    ))}
                    </ul>
                )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t">
                <h2 className="text-lg font-semibold mb-3">Cerrar caja</h2>
                <FormCerrarCaja esperado={totalEsperado} />
            </div>
        </div>
    );
}