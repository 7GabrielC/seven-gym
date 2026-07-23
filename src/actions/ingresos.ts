"use server";

import { db } from "@/db";
import { otrosIngresos, sesionesCaja, movimientosCaja } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hoyArgentinaStr } from "@/lib/fecha-actual";
import { esquemaOtroIngreso } from "@/lib/validaciones/esquema-movimientos";

export async function registrarOtroIngreso(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Tu sesión expiró." };

  const resultado = esquemaOtroIngreso.safeParse({
    descripcion: formData.get("descripcion"),
    metodo: formData.get("metodo"),
    monto: formData.get("monto"),
  });

  if (!resultado.success) {
    return { error: resultado.error.issues[0].message };
  }

  const { descripcion, metodo, monto: montoPesos } = resultado.data;

  // Si es en efectivo, necesita una caja abierta
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
          "Necesitás una caja abierta para registrar un ingreso en efectivo. Si fue por transferencia, elegí ese método.",
      };
    }
  }

  const montoCentavos = Math.round(montoPesos * 100);
  const hoyStr = hoyArgentinaStr();

  await db.transaction(async (tx) => {
    const [nuevoIngreso] = await tx
      .insert(otrosIngresos)
      .values({
        descripcion,
        montoCentavos,
        metodo,
        fecha: hoyStr,
        registradoPor: session.user.id,
      })
      .returning();

    // Si fue en efectivo, generar el ingreso de caja automáticamente
    if (metodo === "efectivo" && cajaAbierta) {
      await tx.insert(movimientosCaja).values({
        sesionCajaId: cajaAbierta.id,
        otroIngresoId: nuevoIngreso.id,
        tipo: "ingreso",
        montoCentavos,
        concepto: descripcion,
      });
    }
  });

  revalidatePath("/movimientos/ingresos");
  revalidatePath("/caja");
  return { ok: true };
}
