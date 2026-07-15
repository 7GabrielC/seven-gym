"use server";

import { db } from "@/db";
import { planes, preciosPlan, suscripciones, pagos, sesionesCaja, movimientosCaja } from "@/db/schema";
import { calcularVencimiento, type UnidadDuracion } from "@/lib/fechas/vencimiento";
import { eq, desc, lte, and, isNull, gt } from "drizzle-orm";
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
        .where(
        and(
            eq(suscripciones.socioId, socioId),
            isNull(suscripciones.eliminadoEn)
        )
        )
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

export async function anularPago(
    formData: FormData
): Promise<{ error: string } | { ok: true; aviso?: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { error: "Tu sesión expiró." };

    // Solo el dueño puede anular
    if (session.user.rol !== "dueño") {
        return { error: "Solo el dueño puede anular pagos." };
    }

    const pagoId = Number(formData.get("pagoId"));
    const motivo = (formData.get("motivo") as string)?.trim();

    if (!motivo) {
        return { error: "El motivo de anulación es obligatorio." };
    }

    // Traer el pago
    const [pago] = await db.select().from(pagos).where(eq(pagos.id, pagoId));
    if (!pago) return { error: "Pago no encontrado." };
    if (pago.anulado) return { error: "Este pago ya fue anulado." };

    // Traer la suscripción asociada (si tiene)
    let suscripcion = null;
    if (pago.suscripcionId) {
        [suscripcion] = await db
        .select()
        .from(suscripciones)
        .where(eq(suscripciones.id, pago.suscripcionId));
    }

    // Detectar si hay suscripciones encadenadas DESPUÉS de esta
    let avisoEncadenada: string | undefined;
    if (suscripcion) {
        const posteriores = await db
        .select()
        .from(suscripciones)
        .where(
            and(
            eq(suscripciones.socioId, suscripcion.socioId),
            gt(suscripciones.desde, suscripcion.desde),
            isNull(suscripciones.eliminadoEn)
            )
        );
        if (posteriores.length > 0) {
        avisoEncadenada =
            "Ojo: este socio tiene períodos posteriores encadenados. Revisá sus fechas.";
        }
    }

    // Buscar el movimiento de caja generado por este pago (si fue en efectivo)
    let movimiento = null;
    let cajaDelMovimiento = null;
    if (pago.metodo === "efectivo") {
        [movimiento] = await db
        .select()
        .from(movimientosCaja)
        .where(eq(movimientosCaja.pagoId, pago.id));

        if (movimiento) {
        [cajaDelMovimiento] = await db
            .select()
            .from(sesionesCaja)
            .where(eq(sesionesCaja.id, movimiento.sesionCajaId));
        }
    }

    const cajaSigueAbierta =
        cajaDelMovimiento && cajaDelMovimiento.cerradaEn === null;

    await db.transaction(async (tx) => {
        // 1. Anular el pago con rastro de auditoría
        await tx
        .update(pagos)
        .set({
            anulado: true,
            anuladoEn: new Date(),
            anuladoPor: session.user.id,
            motivoAnulacion: motivo,
        })
        .where(eq(pagos.id, pagoId));

        // 2. Anular la suscripción que generó (soft delete)
        if (suscripcion) {
        await tx
            .update(suscripciones)
            .set({ eliminadoEn: new Date() })
            .where(eq(suscripciones.id, suscripcion.id));
        }

        // 3. Si fue efectivo y la caja SIGUE ABIERTA, movimiento inverso.
        //    Si la caja ya cerró, no se toca (arqueo cerrado es inmutable).
        if (movimiento && cajaSigueAbierta) {
        await tx.insert(movimientosCaja).values({
            sesionCajaId: movimiento.sesionCajaId,
            tipo: "egreso",
            montoCentavos: movimiento.montoCentavos,
            concepto: `Anulación de pago #${pago.id}`,
        });
        }
    });

    let aviso = avisoEncadenada;
    if (movimiento && !cajaSigueAbierta) {
        const extra =
        "El pago pertenecía a una caja ya cerrada: su arqueo no se modifica.";
        aviso = aviso ? `${aviso} ${extra}` : extra;
    }

    revalidatePath("/socios");
    revalidatePath("/caja");
    return { ok: true, aviso };
}