"use server";

import { db } from "@/db";
import { planes, preciosPlan, suscripciones, pagos, sesionesCaja, movimientosCaja } from "@/db/schema";
import { calcularVencimiento, type UnidadDuracion } from "@/lib/fechas/vencimiento";
import { eq, desc, lte, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function registrarPago(
    formData: FormData
): Promise<{ error: string } | void> {
    const socioId = Number(formData.get("socioId"));
    const planId = Number(formData.get("planId"));
    const metodo = formData.get("metodo") as "efectivo" | "transferencia";

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Tu sesión expiró. Iniciá sesión de nuevo." };

    // 1. Traer el plan elegido
    const [plan] = await db.select().from(planes).where(eq(planes.id, planId));
    if (!plan) return { error: "Plan no encontrado." };

    // 1b. Validar uso único (ej: plan Bienvenida)
    if (plan.usosMaximosPorSocio !== null) {
        const suscripcionesPrevias = await db
        .select()
        .from(suscripciones)
        .where(
            and(
            eq(suscripciones.socioId, socioId),
            eq(suscripciones.planId, planId)
            )
        );

        if (suscripcionesPrevias.length >= plan.usosMaximosPorSocio) {
        return {
            error: `Este socio ya usó el plan ${plan.nombre} y no puede volver a contratarlo.`,
        };
        }
    }

    // 2. Traer el precio vigente del plan (el más reciente)
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const [precio] = await db
        .select()
        .from(preciosPlan)
        .where(and(eq(preciosPlan.planId, planId), lte(preciosPlan.vigenteDesde, hoyStr)))
        .orderBy(desc(preciosPlan.vigenteDesde))
        .limit(1);
    if (!precio) return { error: "El plan no tiene un precio vigente cargado." };

    // 3. Determinar desde cuándo arranca el nuevo período (encadenamiento)
    const [suscripcionVigente] = await db
        .select()
        .from(suscripciones)
        .where(eq(suscripciones.socioId, socioId))
        .orderBy(desc(suscripciones.hasta))
        .limit(1);

    // Si tiene una suscripción cuyo vencimiento es futuro, encadenamos desde ahí.
    // Si no (nunca tuvo, o está vencido), arrancamos hoy.
    let desde = hoy;
    if (suscripcionVigente) {
        const vencimientoActual = new Date(suscripcionVigente.hasta);
        if (vencimientoActual > hoy) {
        desde = vencimientoActual;
        }
    }

    const hasta = calcularVencimiento(
        desde,
        plan.duracionValor,
        plan.duracionUnidad as UnidadDuracion
    );

    // 4. Guardar suscripcion y pago juntos (transacción: todo o nada)
    // Si el pago es en efectivo, necesita una caja abierta
    let cajaAbierta = null;
    if (metodo === "efectivo") {
        [cajaAbierta] = await db
        .select()
        .from(sesionesCaja)
        .where(
            and(
            eq(sesionesCaja.usuarioId, session.user.id),
            isNull(sesionesCaja.cerradaEn)
            )
        );

        if (!cajaAbierta) {
            return {
                error: "Necesitás una caja abierta para cobrar en efectivo. Abrí la caja primero.",
            };
        }
    }
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

        const [nuevoPago] = await tx.insert(pagos).values({
            suscripcionId: nuevaSuscripcion.id,
            montoCentavos: precio.precioCentavos,
            metodo,
            fechaPago: hoyStr,
            registradoPor: session.user.id,
            }).returning();

            // Si es efectivo, generar el movimiento de caja automáticamente
            if (metodo === "efectivo" && cajaAbierta) {
            await tx.insert(movimientosCaja).values({
                sesionCajaId: cajaAbierta.id,
                pagoId: nuevoPago.id,
                tipo: "ingreso",
                montoCentavos: precio.precioCentavos,
                concepto: "Pago de cuota",
            });
            }
        });

    revalidatePath("/socios");
    redirect("/socios");
}