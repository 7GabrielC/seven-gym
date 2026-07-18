import { db } from "@/db";
import { socios, suscripciones, pagos, planes } from "@/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";
import { BadgeEstado } from "@/components/badge-estado";
import { BotonBaja } from "./boton-baja";
import { BotonAnular } from "./boton-anular";
import { requerirSesion } from "@/lib/session";

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2,
    });
}

function fechaLarga(iso: string): string {
    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const [a, m, d] = iso.split("-");
    return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}

export default async function FichaSocioPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await requerirSesion();
    const soyDueno = session.user.rol === "dueño";
    const { id } = await params;
    const socioId = Number(id);

    const [socio] = await db
        .select()
        .from(socios)
        .where(and(eq(socios.id, socioId), isNull(socios.eliminadoEn)));

    if (!socio) notFound();

    const [ultimaSuscripcion] = await db
        .select()
        .from(suscripciones)
        .where(
        and(eq(suscripciones.socioId, socioId), isNull(suscripciones.eliminadoEn))
        )
        .orderBy(desc(suscripciones.hasta))
        .limit(1);

    const estado: EstadoSocio | null = ultimaSuscripcion
        ? calcularEstadoSocio(new Date(ultimaSuscripcion.hasta), new Date())
        : null;

    const historialPagos = await db
        .select({
        id: pagos.id,
        monto: pagos.montoCentavos,
        metodo: pagos.metodo,
        fecha: pagos.fechaPago,
        plan: planes.nombre,
        anulado: pagos.anulado,
        })
        .from(pagos)
        .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
        .innerJoin(planes, eq(suscripciones.planId, planes.id))
        .where(eq(suscripciones.socioId, socioId))
        .orderBy(desc(pagos.fechaPago), desc(pagos.id));

    const totalPagado = historialPagos
        .filter((p) => !p.anulado)
        .reduce((t, p) => t + p.monto, 0);

    const iniciales = `${socio.nombre[0] ?? ""}${socio.apellido[0] ?? ""}`.toUpperCase();

    return (
        <div className="max-w-5xl px-8 py-7">
        <Link
            href="/socios"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Socios
        </Link>

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                {iniciales}
            </div>
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                {socio.nombre} {socio.apellido}
                </h1>
                <div className="mt-1">
                <BadgeEstado
                    estado={estado}
                    vencimiento={ultimaSuscripcion?.hasta ?? null}
                />
                </div>
            </div>
            </div>

            <div className="flex gap-2">
            <Link href={`/socios/${socio.id}/editar`}>
                <Button variant="outline" size="sm">
                Editar
                </Button>
            </Link>
            {soyDueno && <BotonBaja socioId={socio.id} />}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Datos */}
            <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-3">
                DATOS
                </div>
                <dl className="space-y-2.5">
                <div className="flex justify-between gap-3">
                    <dt className="text-sm text-muted-foreground">DNI</dt>
                    <dd className="text-sm tabular">{socio.dni}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-sm text-muted-foreground">Teléfono</dt>
                    <dd className="text-sm tabular">{socio.telefono}</dd>
                </div>
                {socio.email && (
                    <div className="flex justify-between gap-3">
                    <dt className="text-sm text-muted-foreground shrink-0">Email</dt>
                    <dd className="text-sm truncate" title={socio.email}>
                        {socio.email}
                    </dd>
                    </div>
                )}
                <div className="flex justify-between gap-3">
                    <dt className="text-sm text-muted-foreground">Nacimiento</dt>
                    <dd className="text-sm tabular">
                    {fechaLarga(socio.fechaNacimiento)}
                    </dd>
                </div>
                </dl>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                VENCIMIENTO
                </div>
                {ultimaSuscripcion ? (
                <div className="text-xl font-semibold tracking-tight tabular">
                    {fechaLarga(ultimaSuscripcion.hasta)}
                </div>
                ) : (
                <div className="text-xl font-semibold text-muted-foreground/40">
                    Sin plan
                </div>
                )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
                TOTAL PAGADO
                </div>
                <div className="text-xl font-semibold tracking-tight tabular text-success">
                {pesos(totalPagado)}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
                {historialPagos.filter((p) => !p.anulado).length} cuotas
                </div>
            </div>
            </div>

            {/* Historial */}
            <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium">Historial de pagos</h2>
                <Link href="/pagos/nuevo">
                <Button size="sm">Cobrar cuota</Button>
                </Link>
            </div>

            {historialPagos.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Sin pagos registrados.
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
                        PLAN
                        </th>
                        <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        MÉTODO
                        </th>
                        <th className="py-2.5 px-4 text-right text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        MONTO
                        </th>
                        <th className="py-2.5 px-4 w-16" />
                    </tr>
                    </thead>
                    <tbody>
                    {historialPagos.map((pago) => (
                        <tr
                        key={pago.id}
                        className={`border-b border-border/40 last:border-0 transition-colors duration-150 ${
                            pago.anulado ? "opacity-40" : "hover:bg-surface-2"
                        }`}
                        >
                        <td className="py-2.5 px-4 text-sm text-muted-foreground tabular whitespace-nowrap">
                            {fechaLarga(pago.fecha)}
                        </td>
                        <td className="py-2.5 px-4 text-sm">{pago.plan}</td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground capitalize">
                            {pago.metodo}
                        </td>
                        <td
                            className={`py-2.5 px-4 text-right text-sm font-medium tabular whitespace-nowrap ${
                            pago.anulado ? "line-through" : "text-success"
                            }`}
                        >
                            {pesos(pago.monto)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                            {pago.anulado ? (
                            <span className="text-[11px] text-muted-foreground/60">
                                Anulado
                            </span>
                            ) : (
                            soyDueno && <BotonAnular pagoId={pago.id} />
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}