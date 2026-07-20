import { requerirDueno } from "@/lib/session";
import { db } from "@/db";
import { planes, preciosPlan } from "@/db/schema";
import { desc } from "drizzle-orm";
import { FilaPlan } from "./fila-plan";
import { FormNuevoPlan } from "./form-nuevo-plan";

export default async function PlanesPage() {
  await requerirDueno();

  const listaPlanes = await db.select().from(planes).orderBy(planes.id);

  const todosLosPrecios = await db
    .select({
      planId: preciosPlan.planId,
      precioCentavos: preciosPlan.precioCentavos,
      vigenteDesde: preciosPlan.vigenteDesde,
    })
    .from(preciosPlan)
    .orderBy(desc(preciosPlan.vigenteDesde));

  const preciosPorPlan = new Map<
    number,
    { precioCentavos: number; vigenteDesde: string }[]
  >();
  for (const p of todosLosPrecios) {
    const lista = preciosPorPlan.get(p.planId) ?? [];
    lista.push({
      precioCentavos: p.precioCentavos,
      vigenteDesde: p.vigenteDesde,
    });
    preciosPorPlan.set(p.planId, lista);
  }

  const planesConPrecios = listaPlanes.map((plan) => {
    const historial = preciosPorPlan.get(plan.id) ?? [];
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
  });

  const activos = planesConPrecios.filter((p) => p.activo).length;

  return (
    <div className="max-w-5xl px-8 py-7">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Planes y precios
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {activos} {activos === 1 ? "plan activo" : "planes activos"} de{" "}
        {planesConPrecios.length}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {planesConPrecios.map((plan) => (
            <FilaPlan key={plan.id} {...plan} />
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 h-fit">
          <h2 className="text-sm font-medium mb-4">Crear plan nuevo</h2>
          <FormNuevoPlan />
        </div>
      </div>
    </div>
  );
}
