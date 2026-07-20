"use server";

import { db } from "@/db";
import { sesionesCaja, movimientosCaja } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function abrirCaja(
  formData: FormData,
): Promise<{ error: string } | void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Tu sesión expiró. Iniciá sesión de nuevo." };

  const montoAperturaPesos = Number(formData.get("montoApertura"));
  if (isNaN(montoAperturaPesos) || montoAperturaPesos < 0) {
    return { error: "Ingresá un monto de apertura válido." };
  }

  // Verificar que este usuario no tenga ya una caja abierta
  const [cajaAbierta] = await db
    .select()
    .from(sesionesCaja)
    .where(
      and(
        eq(sesionesCaja.usuarioId, session.user.id),
        isNull(sesionesCaja.cerradaEn),
      ),
    );

  if (cajaAbierta) {
    return { error: "Ya tenés una caja abierta. Cerrala antes de abrir otra." };
  }

  // Convertir pesos a centavos
  const montoAperturaCentavos = Math.round(montoAperturaPesos * 100);

  await db.insert(sesionesCaja).values({
    usuarioId: session.user.id,
    montoApertura: montoAperturaCentavos,
  });

  revalidatePath("/caja");
  redirect("/caja");
}

export async function registrarMovimiento(
  formData: FormData,
): Promise<{ error: string } | void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Tu sesión expiró. Iniciá sesión de nuevo." };

  const tipo = formData.get("tipo") as "ingreso" | "egreso";
  const montoPesos = Number(formData.get("monto"));
  const concepto = (formData.get("concepto") as string)?.trim();

  if (isNaN(montoPesos) || montoPesos <= 0) {
    return { error: "Ingresá un monto válido mayor a cero." };
  }
  if (!concepto) {
    return { error: "El concepto es obligatorio." };
  }

  // Buscar la caja abierta del usuario
  const [cajaAbierta] = await db
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
        "No tenés una caja abierta. Abrí una antes de registrar movimientos.",
    };
  }

  const montoCentavos = Math.round(montoPesos * 100);

  await db.insert(movimientosCaja).values({
    sesionCajaId: cajaAbierta.id,
    tipo,
    montoCentavos,
    concepto,
  });

  revalidatePath("/caja");
}

export async function cerrarCaja(
  formData: FormData,
): Promise<{ error: string } | void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Tu sesión expiró. Iniciá sesión de nuevo." };

  const montoDeclaradoPesos = Number(formData.get("montoDeclarado"));
  if (isNaN(montoDeclaradoPesos) || montoDeclaradoPesos < 0) {
    return { error: "Ingresá un monto de cierre válido." };
  }

  // Buscar la caja abierta del usuario
  const [cajaAbierta] = await db
    .select()
    .from(sesionesCaja)
    .where(
      and(
        eq(sesionesCaja.usuarioId, session.user.id),
        isNull(sesionesCaja.cerradaEn),
      ),
    );

  if (!cajaAbierta) {
    return { error: "No tenés una caja abierta para cerrar." };
  }

  const montoDeclaradoCentavos = Math.round(montoDeclaradoPesos * 100);

  // Cerrar la caja: guardar el monto declarado y la fecha de cierre
  await db
    .update(sesionesCaja)
    .set({
      montoCierreDeclarado: montoDeclaradoCentavos,
      cerradaEn: new Date(),
    })
    .where(eq(sesionesCaja.id, cajaAbierta.id));

  revalidatePath("/caja");
  redirect("/caja");
}
