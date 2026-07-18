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
    serieMensual,
} from "@/lib/reportes/metricas";
import { SelectorPeriodo } from "./selector-periodo";
import { GraficoMensual } from "./grafico-mensual";

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    });
}

function variacion(actual: number, anterior: number): string | null {
    if (anterior === 0) return null;
    const pct = ((actual - anterior) / Math.abs(anterior)) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
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

    const [fin, finAnt, planes, socios, serie] = await Promise.all([
        resumenFinanciero(periodo),
        resumenFinanciero(anterior),
        desglosePorPlan(periodo),
        metricasSocios(periodo),
        serieMensual(6),
    ]);

    const meses = mesesDisponibles(2026, 0);
    // Siempre definido: evita que el Select pase de no-controlado a controlado
    const hoy = new Date();
    const mesActual =
        params.mes ??
        `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

    const varIngresos = variacion(fin.ingresosTotal, finAnt.ingresosTotal);
    const varEgresos = variacion(fin.egresosTotal, finAnt.egresosTotal);
    const varResultado = variacion(fin.resultado, finAnt.resultado);

    return (
        <div className="max-w-6xl px-8 py-7">
            <div className="mb-5">
                <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{periodo.etiqueta}</p>
            </div>

            <SelectorPeriodo
                meses={meses}
                mesActual={mesActual}
                desdeActual={params.desde}
                hastaActual={params.hasta}
            />

            {/* Resultado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                    INGRESOS
                </div>
                <div className="text-2xl font-semibold tracking-tight tabular text-success">
                    {pesos(fin.ingresosTotal)}
                </div>
                {varIngresos && (
                    <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                    {varIngresos} vs anterior
                    </div>
                )}
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                    EGRESOS
                </div>
                <div className="text-2xl font-semibold tracking-tight tabular text-danger">
                    {pesos(fin.egresosTotal)}
                </div>
                {varEgresos && (
                    <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                    {varEgresos} vs anterior
                    </div>
                )}
                </div>

                <div
                className={`rounded-lg border p-4 ${
                    fin.resultado >= 0
                    ? "border-brand-accent/30 bg-brand-accent-soft"
                    : "border-danger/30 bg-danger-soft"
                }`}
                >
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                    RESULTADO
                </div>
                <div
                    className={`text-2xl font-semibold tracking-tight tabular ${
                    fin.resultado >= 0 ? "text-brand-accent" : "text-danger"
                    }`}
                >
                    {pesos(fin.resultado)}
                </div>
                {varResultado && (
                    <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                    {varResultado} vs anterior
                    </div>
                )}
                </div>
            </div>

            {/* Gráfico */}
            <div className="rounded-lg border border-border bg-card p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] tracking-wider text-muted-foreground/70">
                    ÚLTIMOS 6 MESES
                </span>
                <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-chart-1" />
                    <span className="text-muted-foreground">Ingresos</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-chart-4" />
                    <span className="text-muted-foreground">Egresos</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 rounded-full bg-brand-accent" />
                    <span className="text-muted-foreground">Resultado</span>
                    </span>
                </div>
                </div>
                <GraficoMensual datos={serie} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Por plan */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                    <span className="text-[11px] tracking-wider text-muted-foreground/70">
                    FACTURACIÓN POR PLAN
                    </span>
                </div>
                {planes.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 p-6 text-center">
                    Sin cuotas en el período.
                    </p>
                ) : (
                    <ul className="p-4 space-y-3">
                    {planes.map((p) => {
                        const pct =
                        fin.ingresosCuotas > 0 ? (p.monto / fin.ingresosCuotas) * 100 : 0;
                        return (
                        <li key={p.plan}>
                            <div className="flex justify-between text-sm mb-1">
                            <span>
                                {p.plan}
                                <span className="ml-1.5 text-xs text-muted-foreground/60 tabular">
                                {p.cantidad}
                                </span>
                            </span>
                            <span className="tabular font-medium">{pesos(p.monto)}</span>
                            </div>
                            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${pct}%` }}
                            />
                            </div>
                        </li>
                        );
                    })}
                    </ul>
                )}
            </div>

            {/* Por categoría */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                    <span className="text-[11px] tracking-wider text-muted-foreground/70">
                    EGRESOS POR CATEGORÍA
                    </span>
                </div>
                {fin.egresosPorCategoria.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 p-6 text-center">
                    Sin egresos en el período.
                    </p>
                ) : (
                    <ul className="p-4 space-y-3">
                    {fin.egresosPorCategoria.map((c) => {
                        const pct =
                        fin.egresosTotal > 0 ? (c.monto / fin.egresosTotal) * 100 : 0;
                        return (
                        <li key={c.categoria}>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{etiquetasCategoria[c.categoria] ?? c.categoria}</span>
                                <span className="tabular font-medium">{pesos(c.monto)}</span>
                            </div>
                            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-muted-foreground/40"
                                style={{ width: `${pct}%` }}
                            />
                            </div>
                        </li>
                        );
                    })}
                    </ul>
                )}
                </div>
            </div>

            {/* Socios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                        ALTAS
                    </div>
                    <div className="text-xl font-semibold tracking-tight tabular">
                        {socios.altas}
                    </div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                        BAJAS
                    </div>
                    <div className="text-xl font-semibold tracking-tight tabular">
                        {socios.bajas}
                    </div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                        ACTIVOS AL CIERRE
                    </div>
                    <div className="text-xl font-semibold tracking-tight tabular">
                        {socios.activosAlCierre}
                    </div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                        RENOVACIÓN
                    </div>
                    <div className="text-xl font-semibold tracking-tight tabular">
                        {socios.tasaRenovacion !== null
                        ? `${socios.tasaRenovacion.toFixed(0)}%`
                        : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                        {socios.renovaron} de {socios.vencieronEnPeriodo}
                    </div>
                </div>
            </div>
        </div>
    );
}