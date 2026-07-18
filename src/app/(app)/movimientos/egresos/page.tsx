import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { gastos, user } from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { FormGasto } from "./form-gasto";
import Link from "next/link";

function pesos(centavos: number, decimales = 0): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: decimales,
    });
}

function fechaCorta(iso: string): string {
    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const [, m, d] = iso.split("-");
    return `${Number(d)} ${MESES[Number(m) - 1]}`;
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

    const total = listaGastos.reduce((t, g) => t + g.monto, 0);
    const totalEfectivo = listaGastos
        .filter((g) => g.metodo === "efectivo")
        .reduce((t, g) => t + g.monto, 0);
    const totalTransferencia = total - totalEfectivo;

    const porCategoria: Record<string, number> = {};
    for (const g of listaGastos) {
        porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + g.monto;
    }
    const categoriasOrdenadas = Object.entries(porCategoria).sort(
        (a, b) => b[1] - a[1]
    );

    return (
        <div className="max-w-6xl px-8 py-7">
        <div className="flex items-center justify-between mb-6">
            <div>
            <h1 className="text-2xl font-semibold tracking-tight">Egresos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Mes en curso</p>
            </div>
            <div className="flex gap-1 rounded-md border border-border p-0.5">
            <Link
                href="/movimientos/ingresos"
                className="rounded px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                Ingresos
            </Link>
            <span className="rounded px-3 py-1 text-sm bg-surface-2 font-medium">
                Egresos
            </span>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                TOTAL
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular text-danger">
                {pesos(total)}
            </div>
            <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                {listaGastos.length} movimientos
            </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                EFECTIVO
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular">
                {pesos(totalEfectivo)}
            </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                TRANSFERENCIA
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular">
                {pesos(totalTransferencia)}
            </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                PRINCIPAL
            </div>
            {categoriasOrdenadas.length === 0 ? (
                <div className="text-2xl font-semibold text-muted-foreground/40">—</div>
            ) : (
                <>
                <div className="text-base font-medium">
                    {etiquetasCategoria[categoriasOrdenadas[0][0]] ??
                    categoriasOrdenadas[0][0]}
                </div>
                <div className="text-sm text-muted-foreground tabular">
                    {pesos(categoriasOrdenadas[0][1])}
                </div>
                </>
            )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            {listaGastos.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Sin egresos este mes.</p>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-border">
                        <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        FECHA
                        </th>
                        <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        CONCEPTO
                        </th>
                        <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        MÉTODO
                        </th>
                        <th className="py-2.5 px-4 text-right text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        MONTO
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {listaGastos.map((g) => (
                        <tr
                        key={g.id}
                        className="border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-surface-2"
                        >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="text-sm text-muted-foreground tabular">
                                {fechaCorta(g.fecha)}
                            </div>
                            <div className="text-[11px] text-muted-foreground/50">
                                {g.usuario.split(" ")[0]}
                            </div>
                        </td>
                        <td className="py-2.5 px-4">
                            <span className="text-sm">{g.descripcion}</span>
                            <span className="ml-2 text-xs text-muted-foreground/60">
                            {etiquetasCategoria[g.categoria] ?? g.categoria}
                            </span>
                        </td>
                        <td className="py-2.5 px-4">
                            <span
                            className={`text-xs ${
                                g.metodo === "efectivo"
                                ? "text-muted-foreground"
                                : "text-muted-foreground/60"
                            }`}
                            >
                            {g.metodo === "efectivo" ? "Efectivo" : "Transferencia"}
                            </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-sm font-medium text-danger tabular whitespace-nowrap">
                            {pesos(g.monto, 2)}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>

            <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-sm font-medium mb-4">Registrar egreso</h2>
                <FormGasto />
            </div>

            {categoriasOrdenadas.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-3">
                    POR CATEGORÍA
                </div>
                <ul className="space-y-2">
                    {categoriasOrdenadas.map(([cat, monto]) => {
                    const pct = total > 0 ? (monto / total) * 100 : 0;
                    return (
                        <li key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                            {etiquetasCategoria[cat] ?? cat}
                            </span>
                            <span className="tabular">{pesos(monto)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
                            <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${pct}%` }}
                            />
                        </div>
                        </li>
                    );
                    })}
                </ul>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}