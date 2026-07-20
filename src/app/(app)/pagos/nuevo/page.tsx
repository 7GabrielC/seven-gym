import { db } from "@/db";
import { socios, planes, suscripciones, preciosPlan } from "@/db/schema";
import { isNull, eq, and, max, desc } from "drizzle-orm";
import { FormPago } from "./form-pago";
import { requerirSesion } from "@/lib/session";

export default async function NuevoPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ socio?: string }>;
}) {
  await requerirSesion();
  const params = await searchParams;
  const socioPreseleccionado = params.socio ? Number(params.socio) : null;

  // Cada socio con su vencimiento actual (una sola consulta, mismo patrón que /socios)
  const listaSocios = await db
    .select({
      id: socios.id,
      nombre: socios.nombre,
      apellido: socios.apellido,
      dni: socios.dni,
      vencimiento: max(suscripciones.hasta),
    })
    .from(socios)
    .leftJoin(
      suscripciones,
      and(
        eq(suscripciones.socioId, socios.id),
        isNull(suscripciones.eliminadoEn),
      ),
    )
    .where(isNull(socios.eliminadoEn))
    .groupBy(socios.id)
    .orderBy(socios.apellido, socios.nombre);

  // Planes activos con su precio vigente
  const listaPlanesRaw = await db
    .select()
    .from(planes)
    .where(eq(planes.activo, true))
    .orderBy(planes.id);

  const precios = await db
    .select({
      planId: preciosPlan.planId,
      precioCentavos: preciosPlan.precioCentavos,
    })
    .from(preciosPlan)
    .orderBy(desc(preciosPlan.vigenteDesde));

  const precioPorPlan = new Map<number, number>();
  for (const p of precios) {
    if (!precioPorPlan.has(p.planId))
      precioPorPlan.set(p.planId, p.precioCentavos);
  }

  const listaPlanes = listaPlanesRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precioCentavos: precioPorPlan.get(p.id) ?? 0,
  }));

  return (
    <div className="max-w-4xl px-8 py-7">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Cobrar cuota
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Elegí el socio y el plan para registrar el pago.
      </p>
      <FormPago
        socios={listaSocios}
        planes={listaPlanes}
        socioInicial={socioPreseleccionado}
      />
    </div>
  );
}
