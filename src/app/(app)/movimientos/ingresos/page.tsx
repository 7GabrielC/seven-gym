import { requerirSesion } from "@/lib/session";
import { db } from "@/db";
import { pagos, suscripciones, socios, planes, otrosIngresos, user } from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { FormOtroIngreso } from "./form-otro-ingreso";
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

type Fila = {
    tipo: "cuota" | "otro";
    id: number;
    fecha: string;
    detalle: string;
    socioId: number | null;
    monto: number;
    metodo: string;
    usuario: string;
    plan: string | null;
};

export default async function IngresosPage() {
    await requerirSesion();

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const [cuotas, otros] = await Promise.all([
        db
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
        .orderBy(desc(pagos.fechaPago), desc(pagos.id)),

        db
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
        .where(
            and(isNull(otrosIngresos.eliminadoEn), gte(otrosIngresos.fecha, primerDiaMes))
        )
        .orderBy(desc(otrosIngresos.fecha), desc(otrosIngresos.id)),
    ]);

    const filas: Fila[] = [
        ...cuotas.map((c) => ({
        tipo: "cuota" as const,
        id: c.id,
        fecha: c.fecha,
        detalle: `${c.nombre} ${c.apellido}`,
        socioId: c.socioId,
        monto: c.monto,
        metodo: c.metodo,
        usuario: c.usuario,
        plan: c.plan,
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
        plan: null,
        })),
    ].sort((a, b) => b.fecha.localeCompare(a.fecha));

    const total = filas.reduce((t, f) => t + f.monto, 0);
    const totalEfectivo = filas
        .filter((f) => f.metodo === "efectivo")
        .reduce((t, f) => t + f.monto, 0);
    const totalTransferencia = total - totalEfectivo;
    const totalCuotas = filas
        .filter((f) => f.tipo === "cuota")
        .reduce((t, f) => t + f.monto, 0);
    const totalOtros = total - totalCuotas;

    return (
        <div className="max-w-6xl px-8 py-7">
            <div className="flex items-center justify-between mb-6">
                <div>
                <h1 className="text-2xl font-semibold tracking-tight">Ingresos</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Mes en curso</p>
                </div>
                <div className="flex gap-1 rounded-md border border-border p-0.5">
                <span className="rounded px-3 py-1 text-sm bg-surface-2 font-medium">
                    Ingresos
                </span>
                <Link
                    href="/movimientos/egresos"
                    className="rounded px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Egresos
                </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                    TOTAL
                </div>
                <div className="text-2xl font-semibold tracking-tight tabular text-success">
                    {pesos(total)}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                    {filas.length} movimientos
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
                    CUOTAS / OTROS
                </div>
                <div className="text-base font-medium tabular">{pesos(totalCuotas)}</div>
                <div className="text-sm text-muted-foreground tabular">
                    {pesos(totalOtros)}
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                {filas.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Sin ingresos este mes.
                    </p>
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
                        {filas.map((f) => (
                            <tr
                            key={`${f.tipo}-${f.id}`}
                            className="border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-surface-2"
                            >
                            <td className="py-2.5 px-4 whitespace-nowrap">
                                <div className="text-sm text-muted-foreground tabular">
                                    {fechaCorta(f.fecha)}
                                </div>
                                <div className="text-[11px] text-muted-foreground/50">
                                    {f.usuario.split(" ")[0]}
                                </div>
                            </td>
                            <td className="py-2.5 px-4">
                                {f.socioId ? (
                                <Link
                                    href={`/socios/${f.socioId}`}
                                    className="text-sm hover:text-primary transition-colors"
                                >
                                    {f.detalle}
                                </Link>
                                ) : (
                                <span className="text-sm">{f.detalle}</span>
                                )}
                                <span className="ml-2 text-xs text-muted-foreground/60">
                                {f.plan ?? "otro ingreso"}
                                </span>
                            </td>
                            <td className="py-2.5 px-4">
                                <span
                                className={`text-xs ${
                                    f.metodo === "efectivo"
                                    ? "text-muted-foreground"
                                    : "text-muted-foreground/60"
                                }`}
                                >
                                {f.metodo === "efectivo" ? "Efectivo" : "Transferencia"}
                                </span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-sm font-medium text-success tabular whitespace-nowrap">
                                {pesos(f.monto, 2)}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
                </div>

                <div>
                    <div className="rounded-lg border border-border bg-card p-4">
                        <h2 className="text-sm font-medium mb-1">Otro ingreso</h2>
                        <p className="text-xs text-muted-foreground mb-4">
                        Para lo que no es cuota: venta de agua, alquiler de locker, etc.
                        </p>
                        <FormOtroIngreso />
                    </div>
                </div>
            </div>
        </div>
    );
}