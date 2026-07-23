"use server";

import { db } from "@/db";
import { planes, preciosPlan } from "@/db/schema";
import { eq, desc, lte, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hoyArgentinaStr } from "@/lib/fecha-actual";
import {
  esquemaCambiarPrecio,
  esquemaCrearPlan,
} from "@/lib/validaciones/esquema-planes";

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

  const resultado = esquemaCambiarPrecio.safeParse({
    planId: formData.get("planId"),
    precio: formData.get("precio"),
  });

  if (!resultado.success) {
    return { error: resultado.error.issues[0].message };
  }

  const { planId, precio: precioPesos } = resultado.data;

  const [plan] = await db.select().from(planes).where(eq(planes.id, planId));
  if (!plan) return { error: "Plan no encontrado." };

  const hoyStr = hoyArgentinaStr();
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

  const resultado = esquemaCrearPlan.safeParse({
    nombre: formData.get("nombre"),
    duracionValor: formData.get("duracionValor"),
    duracionUnidad: formData.get("duracionUnidad"),
    precio: formData.get("precio"),
    usoUnico: formData.get("usoUnico"),
  });

  if (!resultado.success) {
    return { error: resultado.error.issues[0].message };
  }

  const {
    nombre,
    duracionValor,
    duracionUnidad,
    precio: precioPesos,
  } = resultado.data;
  const usoUnico = resultado.data.usoUnico === "si";

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
    vigenteDesde: hoyArgentinaStr(),
  });

  revalidatePath("/planes");
  revalidatePath("/pagos/nuevo");
  return { ok: true };
}
