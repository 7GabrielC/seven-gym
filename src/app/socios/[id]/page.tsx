import { db } from "@/db";
import { socios, suscripciones, pagos, planes } from "@/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";
import { BotonBaja } from "./boton-baja";
import { requerirSesion } from "@/lib/session";

const etiquetasEstado: Record<EstadoSocio, string> = {
    activo: "Activo",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    inactivo: "Inactivo",
};

function formatearPesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
    });
}

export default async function FichaSocioPage({
    params,
    }: {
    params: Promise<{ id: string }>;
    }) {
    await requerirSesion();
    const { id } = await params;
    const socioId = Number(id);

    const [socio] = await db
        .select()
        .from(socios)
        .where(and(eq(socios.id, socioId), isNull(socios.eliminadoEn)));

    if (!socio) {
        notFound();
    }

    const [ultimaSuscripcion] = await db
        .select()
        .from(suscripciones)
        .where(eq(suscripciones.socioId, socioId))
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
        })
        .from(pagos)
        .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
        .innerJoin(planes, eq(suscripciones.planId, planes.id))
        .where(eq(suscripciones.socioId, socioId))
        .orderBy(desc(pagos.fechaPago));

    return (
        <div className="max-w-2xl mx-auto p-8">
        <Link href="/socios" className="text-sm text-blue-600 hover:underline">
            ← Volver a socios
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
            <h1 className="text-2xl font-semibold">
            {socio.nombre} {socio.apellido}
            </h1>
            {estado && (
            <span className="text-sm font-medium">{etiquetasEstado[estado]}</span>
            )}
        </div>
        <div className="flex gap-2 mb-6">
            <Link href={`/socios/${socio.id}/editar`}>
            <Button variant="outline">Editar</Button>
            </Link>
            <BotonBaja socioId={socio.id} />
        </div>

        <div className="space-y-2 mb-8">
            <p><span className="text-gray-500">DNI:</span> {socio.dni}</p>
            <p><span className="text-gray-500">Teléfono:</span> {socio.telefono}</p>
            {ultimaSuscripcion && (
            <p>
                <span className="text-gray-500">Vence:</span>{" "}
                {ultimaSuscripcion.hasta}
            </p>
            )}
        </div>

        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Historial de pagos</h2>
            <Link href="/pagos/nuevo">
            <Button>Registrar pago</Button>
            </Link>
        </div>

        {historialPagos.length === 0 ? (
            <p className="text-muted-foreground">Sin pagos registrados.</p>
        ) : (
            <table className="w-full border-collapse">
            <thead>
                <tr className="border-b text-left">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Método</th>
                </tr>
            </thead>
            <tbody>
                {historialPagos.map((pago) => (
                <tr key={pago.id} className="border-b">
                    <td className="py-2 pr-4">{pago.fecha}</td>
                    <td className="py-2 pr-4">{pago.plan}</td>
                    <td className="py-2 pr-4">{formatearPesos(pago.monto)}</td>
                    <td className="py-2 pr-4 capitalize">{pago.metodo}</td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    );
}