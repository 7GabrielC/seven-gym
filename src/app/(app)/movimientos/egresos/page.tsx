import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { gastos, user } from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { FormGasto } from "./form-gasto";
import Link from "next/link";

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
    });
}

const etiquetasCategoria: Record<string, string> = {
    limpieza: "Limpieza",
    mantenimiento: "Mantenimiento",
    servicios: "Servicios",
    sueldos: "Sueldos",
    equipamiento: "Equipamiento",
    otros: "Otros",
};

export default async function EgresosPage() {
    await requerirSesion();

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const listaGastos = await db
        .select({
        id: gastos.id,
        descripcion: gastos.descripcion,
        categoria: gastos.categoria,
        monto: gastos.montoCentavos,
        metodo: gastos.metodo,
        fecha: gastos.fecha,
        usuario: user.name,
        })
        .from(gastos)
        .innerJoin(user, eq(gastos.registradoPor, user.id))
        .where(and(isNull(gastos.eliminadoEn), gte(gastos.fecha, primerDiaMes)))
        .orderBy(desc(gastos.fecha), desc(gastos.id));

    // Métricas (mismo criterio que Ingresos)
    const total = listaGastos.reduce((t, g) => t + g.monto, 0);
    const totalEfectivo = listaGastos
        .filter((g) => g.metodo === "efectivo")
        .reduce((t, g) => t + g.monto, 0);
    const totalTransferencia = listaGastos
        .filter((g) => g.metodo === "transferencia")
        .reduce((t, g) => t + g.monto, 0);

    const porCategoria: Record<string, number> = {};
    for (const g of listaGastos) {
        porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + g.monto;
    }
    const categoriasOrdenadas = Object.entries(porCategoria).sort(
        (a, b) => b[1] - a[1]
    );

    return (
        <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Egresos del mes</h1>
            <Link
            href="/movimientos/ingresos"
            className="text-sm text-blue-600 hover:underline"
            >
            ← Ver ingresos
            </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold">{pesos(total)}</p>
            <p className="text-xs text-gray-400">{listaGastos.length} movimientos</p>
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
            <p className="text-sm text-gray-500">Por categoría</p>
            {categoriasOrdenadas.length === 0 ? (
                <p className="text-sm text-gray-400 mt-1">—</p>
            ) : (
                <ul className="mt-1 space-y-0.5">
                {categoriasOrdenadas.slice(0, 3).map(([cat, monto]) => (
                    <li key={cat} className="flex justify-between text-sm">
                    <span className="text-gray-500">
                        {etiquetasCategoria[cat] ?? cat}
                    </span>
                    <span className="font-medium">{pesos(monto)}</span>
                    </li>
                ))}
                </ul>
            )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3">Detalle</h2>
            {listaGastos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin egresos este mes.</p>
            ) : (
                <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b text-left">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Concepto</th>
                    <th className="py-2 pr-3">Método</th>
                    <th className="py-2 pr-3">Registró</th>
                    <th className="py-2 pr-3 text-right">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {listaGastos.map((g) => (
                    <tr key={g.id} className="border-b">
                        <td className="py-2 pr-3 text-gray-500">{g.fecha}</td>
                        <td className="py-2 pr-3">
                        {g.descripcion}{" "}
                        <span className="text-xs text-gray-400">
                            ({etiquetasCategoria[g.categoria] ?? g.categoria})
                        </span>
                        </td>
                        <td className="py-2 pr-3 capitalize text-gray-500">
                        {g.metodo}
                        </td>
                        <td className="py-2 pr-3 text-gray-500">{g.usuario}</td>
                        <td className="py-2 pr-3 text-right text-red-700 font-medium">
                        {pesos(g.monto)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>

            <div>
            <h2 className="text-lg font-semibold mb-3">Registrar egreso</h2>
            <FormGasto />
            </div>
        </div>
        </div>
    );
}