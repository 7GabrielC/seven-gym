import { requerirDueno } from "@/lib/session";
import {
    periodoMes,
    periodoRango,
    periodoMesActual,
    periodoAnterior,
    mesesDisponibles,
} from "@/lib/reportes/periodo";
import {
    resumenFinanciero,
    desglosePorPlan,
    metricasSocios,
} from "@/lib/reportes/metricas";
import { SelectorPeriodo } from "./selector-periodo";

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
    });
}

function variacion(actual: number, anterior: number): string | null {
    if (anterior === 0) return null;
    const pct = ((actual - anterior) / Math.abs(anterior)) * 100;
    const signo = pct >= 0 ? "+" : "";
    return `${signo}${pct.toFixed(0)}%`;
}

const etiquetasCategoria: Record<string, string> = {
    limpieza: "Limpieza",
    mantenimiento: "Mantenimiento",
    servicios: "Servicios",
    sueldos: "Sueldos",
    equipamiento: "Equipamiento",
    otros: "Otros",
};

export default async function ReportesPage({
    searchParams,
}: {
    searchParams: Promise<{ mes?: string; desde?: string; hasta?: string }>;
}) {
    await requerirDueno();
    const params = await searchParams;

    // Determinar el período según la URL
    let periodo;
    if (params.desde && params.hasta) {
        periodo = periodoRango(params.desde, params.hasta);
    } else if (params.mes) {
        const [anio, mes] = params.mes.split("-").map(Number);
        periodo = periodoMes(anio, mes - 1);
    } else {
        periodo = periodoMesActual();
    }

    const anterior = periodoAnterior(periodo);

    const [fin, finAnt, planes, socios] = await Promise.all([
        resumenFinanciero(periodo),
        resumenFinanciero(anterior),
        desglosePorPlan(periodo),
        metricasSocios(periodo),
    ]);

    const meses = mesesDisponibles(2026, 0);
    const mesActual = params.mes;

    return (
        <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-2">Reportes</h1>
        <p className="text-sm text-gray-500 mb-6">{periodo.etiqueta}</p>

        <SelectorPeriodo
            meses={meses}
            mesActual={mesActual}
            desdeActual={params.desde}
            hastaActual={params.hasta}
        />

        {/* Resultado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-2xl font-bold text-green-700">
                {pesos(fin.ingresosTotal)}
            </p>
            {variacion(fin.ingresosTotal, finAnt.ingresosTotal) && (
                <p className="text-xs text-gray-400">
                {variacion(fin.ingresosTotal, finAnt.ingresosTotal)} vs período
                anterior
                </p>
            )}
            </div>

            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Egresos</p>
            <p className="text-2xl font-bold text-red-700">
                {pesos(fin.egresosTotal)}
            </p>
            {variacion(fin.egresosTotal, finAnt.egresosTotal) && (
                <p className="text-xs text-gray-400">
                {variacion(fin.egresosTotal, finAnt.egresosTotal)} vs período
                anterior
                </p>
            )}
            </div>

            <div
            className={`border-2 rounded-lg p-4 ${
                fin.resultado >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }`}
            >
            <p className="text-sm text-gray-600">Resultado</p>
            <p
                className={`text-2xl font-bold ${
                fin.resultado >= 0 ? "text-green-800" : "text-red-800"
                }`}
            >
                {pesos(fin.resultado)}
            </p>
            {variacion(fin.resultado, finAnt.resultado) && (
                <p className="text-xs text-gray-500">
                {variacion(fin.resultado, finAnt.resultado)} vs período anterior
                </p>
            )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Desglose por plan */}
            <div>
            <h2 className="text-lg font-semibold mb-3">Facturación por plan</h2>
            {planes.length === 0 ? (
                <p className="text-sm text-gray-400">Sin cuotas en el período.</p>
            ) : (
                <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b text-left">
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3 text-right">Cuotas</th>
                    <th className="py-2 text-right">Facturado</th>
                    </tr>
                </thead>
                <tbody>
                    {planes.map((p) => (
                    <tr key={p.plan} className="border-b">
                        <td className="py-2 pr-3">{p.plan}</td>
                        <td className="py-2 pr-3 text-right text-gray-500">
                        {p.cantidad}
                        </td>
                        <td className="py-2 text-right font-medium">
                        {pesos(p.monto)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>

            {/* Egresos por categoría */}
            <div>
            <h2 className="text-lg font-semibold mb-3">Egresos por categoría</h2>
            {fin.egresosPorCategoria.length === 0 ? (
                <p className="text-sm text-gray-400">Sin egresos en el período.</p>
            ) : (
                <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b text-left">
                    <th className="py-2 pr-3">Categoría</th>
                    <th className="py-2 text-right">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {fin.egresosPorCategoria.map((c) => (
                    <tr key={c.categoria} className="border-b">
                        <td className="py-2 pr-3">
                        {etiquetasCategoria[c.categoria] ?? c.categoria}
                        </td>
                        <td className="py-2 text-right font-medium">
                        {pesos(c.monto)}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>
        </div>

        {/* Socios */}
        <h2 className="text-lg font-semibold mb-3">Socios</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Altas</p>
            <p className="text-xl font-bold">{socios.altas}</p>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Bajas</p>
            <p className="text-xl font-bold">{socios.bajas}</p>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Activos al cierre</p>
            <p className="text-xl font-bold">{socios.activosAlCierre}</p>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500">Tasa de renovación</p>
            <p className="text-xl font-bold">
                {socios.tasaRenovacion !== null
                ? `${socios.tasaRenovacion.toFixed(0)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-400">
                {socios.renovaron} de {socios.vencieronEnPeriodo} vencidos
            </p>
            </div>
        </div>

        {/* Desglose por método */}
        <h2 className="text-lg font-semibold mb-3">Por método de pago</h2>
        <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Ingresos</p>
            <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Efectivo</span>
                <span>{pesos(fin.ingresosEfectivo)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Transferencia</span>
                <span>{pesos(fin.ingresosTransferencia)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-t mt-1 pt-2">
                <span className="text-gray-600">Cuotas / Otros</span>
                <span>
                {pesos(fin.ingresosCuotas)} / {pesos(fin.ingresosOtros)}
                </span>
            </div>
            </div>
            <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2">Egresos</p>
            <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Efectivo</span>
                <span>{pesos(fin.egresosEfectivo)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Transferencia</span>
                <span>{pesos(fin.egresosTransferencia)}</span>
            </div>
            </div>
        </div>
        </div>
    );
}