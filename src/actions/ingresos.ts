"use server";

import { db } from "@/db";
import { otrosIngresos, sesionesCaja, movimientosCaja } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function registrarOtroIngreso(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Tu sesión expiró." };

  const descripcion = (formData.get("descripcion") as string)?.trim();
  const metodo = formData.get("metodo") as "efectivo" | "transferencia";
  const montoPesos = Number(formData.get("monto"));

  if (!descripcion) return { error: "La descripción es obligatoria." };
  if (isNaN(montoPesos) || montoPesos <= 0) {
    return { error: "Ingresá un monto válido mayor a cero." };
  }

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
  const hoyStr = new Date().toISOString().slice(0, 10);

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
