"use server";

import { db } from "@/db";
import { planes, preciosPlan, suscripciones, pagos, socios } from "@/db/schema";
import { calcularVencimiento, type UnidadDuracion } from "@/lib/fechas/vencimiento";
import { eq, desc, lte, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function registrarPago(formData: FormData) {
    const socioId = Number(formData.get("socioId"));
    const planId = Number(formData.get("planId"));
    const metodo = formData.get("metodo") as "efectivo" | "transferencia";
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("No autorizado");

    // 1. Traer el plan elegido
    const [plan] = await db.select().from(planes).where(eq(planes.id, planId));
    if (!plan) throw new Error("Plan no encontrado");

    // 2. Traer el precio vigente del plan (el más reciente)
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const [precio] = await db
        .select()
        .from(preciosPlan)
        .where(and(eq(preciosPlan.planId, planId), lte(preciosPlan.vigenteDesde, hoyStr)))
        .orderBy(desc(preciosPlan.vigenteDesde))
        .limit(1);
    if (!precio) throw new Error("El plan no tiene precio vigente");

    // 3. Calcular el vencimiento con nuestra función
    const desde = hoy;
    const hasta = calcularVencimiento(
        desde,
        plan.duracionValor,
        plan.duracionUnidad as UnidadDuracion
    );

    // 4. Guardar suscripcion y pago juntos (transacción: todo o nada)
    await db.transaction(async (tx) => {
        const [nuevaSuscripcion] = await tx
        .insert(suscripciones)
        .values({
            socioId,
            planId,
            desde: desde.toISOString().slice(0, 10),
            hasta: hasta.toISOString().slice(0, 10),
        })
        .returning();

        await tx.insert(pagos).values({
        suscripcionId: nuevaSuscripcion.id,
        montoCentavos: precio.precioCentavos,
        metodo,
        fechaPago: hoyStr,
        registradoPor: session.user.id,
        });
    });

    revalidatePath("/socios");
    redirect("/socios");
}