"use server";

import { db } from "@/db";
import { planes, preciosPlan } from "@/db/schema";
import { eq, desc, lte, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function verificarDueno(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return "Tu sesión expiró.";
  if (session.user.rol !== "dueño") {
    return "Solo el dueño puede gestionar planes y precios.";
  }
  return null;
}

export async function cambiarPrecio(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const errorPermiso = await verificarDueno();
  if (errorPermiso) return { error: errorPermiso };

  const planId = Number(formData.get("planId"));
  const precioPesos = Number(formData.get("precio"));

  if (isNaN(precioPesos) || precioPesos <= 0) {
    return { error: "Ingresá un precio válido mayor a cero." };
  }

  const [plan] = await db.select().from(planes).where(eq(planes.id, planId));
  if (!plan) return { error: "Plan no encontrado." };

  const hoyStr = new Date().toISOString().slice(0, 10);
  const precioCentavos = Math.round(precioPesos * 100);

  // Si ya hay un precio con vigencia de hoy, lo reemplazamos.
  // Si no, agregamos una fila nueva al historial.
  const [precioDeHoy] = await db
    .select()
    .from(preciosPlan)
    .where(
      and(eq(preciosPlan.planId, planId), eq(preciosPlan.vigenteDesde, hoyStr)),
    );

  if (precioDeHoy) {
    await db
      .update(preciosPlan)
      .set({ precioCentavos })
      .where(eq(preciosPlan.id, precioDeHoy.id));
  } else {
    await db.insert(preciosPlan).values({
      planId,
      precioCentavos,
      vigenteDesde: hoyStr,
    });
  }

  revalidatePath("/planes");
  return { ok: true };
}

export async function alternarActivo(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const errorPermiso = await verificarDueno();
  if (errorPermiso) return { error: errorPermiso };

  const planId = Number(formData.get("planId"));

  const [plan] = await db.select().from(planes).where(eq(planes.id, planId));
  if (!plan) return { error: "Plan no encontrado." };

  await db
    .update(planes)
    .set({ activo: !plan.activo })
    .where(eq(planes.id, planId));

  revalidatePath("/planes");
  revalidatePath("/pagos/nuevo");
  return { ok: true };
}

export async function crearPlan(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const errorPermiso = await verificarDueno();
  if (errorPermiso) return { error: errorPermiso };

  const nombre = (formData.get("nombre") as string)?.trim();
  const duracionValor = Number(formData.get("duracionValor"));
  const duracionUnidad = formData.get("duracionUnidad") as string;
  const precioPesos = Number(formData.get("precio"));
  const usoUnico = formData.get("usoUnico") === "si";

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (isNaN(duracionValor) || duracionValor <= 0) {
    return { error: "La duración debe ser mayor a cero." };
  }
  if (duracionUnidad !== "mes" && duracionUnidad !== "dia") {
    return { error: "Unidad de duración inválida." };
  }
  if (isNaN(precioPesos) || precioPesos <= 0) {
    return { error: "Ingresá un precio válido." };
  }

  const [nuevoPlan] = await db
    .insert(planes)
    .values({
      nombre,
      duracionValor,
      duracionUnidad,
      usosMaximosPorSocio: usoUnico ? 1 : null,
    })
    .returning();

  await db.insert(preciosPlan).values({
    planId: nuevoPlan.id,
    precioCentavos: Math.round(precioPesos * 100),
    vigenteDesde: new Date().toISOString().slice(0, 10),
  });

  revalidatePath("/planes");
  revalidatePath("/pagos/nuevo");
  return { ok: true };
}
