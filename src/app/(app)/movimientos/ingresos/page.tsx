import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { pagos, suscripciones, socios, planes, otrosIngresos, user } from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { FormOtroIngreso } from "./form-otro-ingreso";
import Link from "next/link";

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
    });
}

type Fila = {
    tipo: "cuota" | "otro";
    id: number;
    fecha: string;
    detalle: string;
    socioId: number | null;
    monto: number;
    metodo: string;
    usuario: string;
};

export default async function IngresosPage() {
    await requerirSesion();

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    // Pagos de cuotas del mes (no anulados)
    const cuotas = await db
        .select({
        id: pagos.id,
        fecha: pagos.fechaPago,
        monto: pagos.montoCentavos,
        metodo: pagos.metodo,
        socioId: socios.id,
        nombre: socios.nombre,
        apellido: socios.apellido,
        plan: planes.nombre,
        usuario: user.name,
        })
        .from(pagos)
        .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
        .innerJoin(socios, eq(suscripciones.socioId, socios.id))
        .innerJoin(planes, eq(suscripciones.planId, planes.id))
        .innerJoin(user, eq(pagos.registradoPor, user.id))
        .where(and(eq(pagos.anulado, false), gte(pagos.fechaPago, primerDiaMes)))
        .orderBy(desc(pagos.fechaPago), desc(pagos.id));

    // Otros ingresos del mes
    const otros = await db
        .select({
        id: otrosIngresos.id,
        fecha: otrosIngresos.fecha,
        monto: otrosIngresos.montoCentavos,
        metodo: otrosIngresos.metodo,
        descripcion: otrosIngresos.descripcion,
        usuario: user.name,
        })
        .from(otrosIngresos)
        .innerJoin(user, eq(otrosIngresos.registradoPor, user.id))
        .where(and(isNull(otrosIngresos.eliminadoEn), gte(otrosIngresos.fecha, primerDiaMes)))
        .orderBy(desc(otrosIngresos.fecha), desc(otrosIngresos.id));

    // Unificar en una sola lista
    const filas: Fila[] = [
        ...cuotas.map((c) => ({
        tipo: "cuota" as const,
        id: c.id,
        fecha: c.fecha,
        detalle: `${c.nombre} ${c.apellido} — ${c.plan}`,
        socioId: c.socioId,
        monto: c.monto,
        metodo: c.metodo,
        usuario: c.usuario,
        })),
        ...otros.map((o) => ({
        tipo: "otro" as const,
        id: o.id,
        fecha: o.fecha,
        detalle: o.descripcion,
        socioId: null,
        monto: o.monto,
        metodo: o.metodo,
        usuario: o.usuario,
        })),
    ].sort((a, b) => b.fecha.localeCompare(a.fecha));

    // Métricas
    const total = filas.reduce((t, f) => t + f.monto, 0);
    const totalEfectivo = filas
        .filter((f) => f.metodo === "efectivo")
        .reduce((t, f) => t + f.monto, 0);
    const totalTransferencia = filas
        .filter((f) => f.metodo === "transferencia")
        .reduce((t, f) => t + f.monto, 0);
    const totalCuotas = filas
        .filter((f) => f.tipo === "cuota")
        .reduce((t, f) => t + f.monto, 0);
    const totalOtros = total - totalCuotas;

    return (
        <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Ingresos del mes</h1>
            <Link
            href="/movimientos/egresos"
            className="text-sm text-blue-600 hover:underline"
            >
            Ver egresos →
            </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">{pesos(total)}</p>
            <p className="text-xs text-gray-400">{filas.length} movimientos</p>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Efectivo</p>
            <p className="text-xl font-bold">{pesos(totalEfectivo)}</p>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Transferencia</p>
            <p className="text-xl font-bold">{pesos(totalTransferencia)}</p>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Cuotas / Otros</p>
            <p className="text-sm font-medium mt-1">{pesos(totalCuotas)}</p>
            <p className="text-sm text-gray-500">{pesos(totalOtros)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3">Detalle</h2>
            {filas.length === 0 ? (
                <p className="text-sm text-gray-400">Sin ingresos este mes.</p>
            ) : (
                <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b text-left">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Concepto</th>
                    <th className="py-2 pr-3">Método</th>
                    <th className="py-2 pr-3">Cobró</th>
                    <th className="py-2 pr-3 text-right">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map((f) => (
                    <tr key={`${f.tipo}-${f.id}`} className="border-b">
                        <td className="py-2 pr-3 text-gray-500">{f.fecha}</td>
                        <td className="py-2 pr-3">
                        {f.socioId ? (
                            <Link
                            href={`/socios/${f.socioId}`}
                            className="text-blue-600 hover:underline"
                            >
                            {f.detalle}
                            </Link>
                        ) : (
                            <span>
                            {f.detalle}{" "}
                            <span className="text-xs text-gray-400">(otro)</span>
                            </span>
                        )}
                        </td>
                        <td className="py-2 pr-3 capitalize text-gray-500">
                        {f.metodo}
                        </td>
                        <td className="py-2 pr-3 text-gray-500">{f.usuario}</td>
                        <td className="py-2 pr-3 text-right text-green-700 font-medium">
                        {pesos(f.monto)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>

            <div>
            <h2 className="text-lg font-semibold mb-3">Otro ingreso</h2>
            <FormOtroIngreso />
            <p className="text-xs text-gray-500 mt-3">
                Las cuotas se registran desde &quot;Registrar pago&quot;. Acá van los
                ingresos que no son cuotas (venta de agua, etc.).
            </p>
            </div>
        </div>
        </div>
    );
}