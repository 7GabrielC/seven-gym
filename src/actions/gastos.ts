"use server";

import { db } from "@/db";
import { gastos, sesionesCaja, movimientosCaja } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hoyArgentinaStr } from "@/lib/fecha-actual";

export async function registrarGasto(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Tu sesión expiró." };

  const descripcion = (formData.get("descripcion") as string)?.trim();
  const categoria = formData.get("categoria") as
    | "limpieza"
    | "mantenimiento"
    | "servicios"
    | "sueldos"
    | "equipamiento"
    | "otros";
  const metodo = formData.get("metodo") as "efectivo" | "transferencia";
  const montoPesos = Number(formData.get("monto"));

  if (!descripcion) return { error: "La descripción es obligatoria." };
  if (isNaN(montoPesos) || montoPesos <= 0) {
    return { error: "Ingresá un monto válido mayor a cero." };
  }

  // Si el gasto es en efectivo, necesita una caja abierta
  let cajaAbierta = null;
  if (metodo === "efectivo") {
    [cajaAbierta] = await db
      .select()
      .from(sesionesCaja)
      .where(
        and(
          eq(sesionesCaja.usuarioId, session.user.id),
          isNull(sesionesCaja.cerradaEn),
        ),
      );

    if (!cajaAbierta) {
      return {
        error:
          "Necesitás una caja abierta para registrar un gasto en efectivo. Si lo pagaste por transferencia, elegí ese método.",
      };
    }
  }

  const montoCentavos = Math.round(montoPesos * 100);
  const hoyStr = hoyArgentinaStr();

  await db.transaction(async (tx) => {
    const [nuevoGasto] = await tx
      .insert(gastos)
      .values({
        descripcion,
        categoria,
        montoCentavos,
        metodo,
        fecha: hoyStr,
        registradoPor: session.user.id,
      })
      .returning();

    // Si fue en efectivo, generar el egreso de caja automáticamente
    if (metodo === "efectivo" && cajaAbierta) {
      await tx.insert(movimientosCaja).values({
        sesionCajaId: cajaAbierta.id,
        gastoId: nuevoGasto.id,
        tipo: "egreso",
        montoCentavos,
        concepto: descripcion,
      });
    }
  });

  revalidatePath("/gastos");
  revalidatePath("/caja");
  return { ok: true };
}
