import { requerirDueno } from "@/lib/session";
import { db } from "@/db";
import { planes, preciosPlan } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { FilaPlan } from "./fila-plan";
import { FormNuevoPlan } from "./form-nuevo-plan";

export default async function PlanesPage() {
    await requerirDueno();

    const listaPlanes = await db.select().from(planes).orderBy(planes.id);

    const planesConPrecios = await Promise.all(
        listaPlanes.map(async (plan) => {
        const historial = await db
            .select({
            precioCentavos: preciosPlan.precioCentavos,
            vigenteDesde: preciosPlan.vigenteDesde,
            })
            .from(preciosPlan)
            .where(eq(preciosPlan.planId, plan.id))
            .orderBy(desc(preciosPlan.vigenteDesde));

        return {
            id: plan.id,
            nombre: plan.nombre,
            duracionValor: plan.duracionValor,
            duracionUnidad: plan.duracionUnidad,
            activo: plan.activo,
            usoUnico: plan.usosMaximosPorSocio === 1,
            precioActual: historial[0]?.precioCentavos ?? null,
            historial,
        };
        })
    );

    return (
        <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Planes y precios</h1>

        <div className="space-y-3 mb-8">
            {planesConPrecios.map((plan) => (
            <FilaPlan key={plan.id} {...plan} />
            ))}
        </div>

        <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Crear plan nuevo</h2>
            <FormNuevoPlan />
        </div>
        </div>
    );
}