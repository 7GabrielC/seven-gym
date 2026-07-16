import { db } from "@/db";
import {
    pagos,
    suscripciones,
    socios,
    planes,
    gastos,
    otrosIngresos,
} from "@/db/schema";
import { eq, and, isNull, gte, lte, lt, isNotNull } from "drizzle-orm";
import type { Periodo } from "./periodo";

export type ResumenFinanciero = {
    ingresosTotal: number;
    ingresosEfectivo: number;
    ingresosTransferencia: number;
    ingresosCuotas: number;
    ingresosOtros: number;
    egresosTotal: number;
    egresosEfectivo: number;
    egresosTransferencia: number;
    egresosPorCategoria: { categoria: string; monto: number }[];
    resultado: number;
};

export type DesglosePlan = {
    plan: string;
    cantidad: number;
    monto: number;
};

export type MetricasSocios = {
    altas: number;
    bajas: number;
    activosAlCierre: number;
    vencieronEnPeriodo: number;
    renovaron: number;
    tasaRenovacion: number | null;
};

export async function resumenFinanciero(p: Periodo): Promise<ResumenFinanciero> {
    const cuotas = await db
        .select({ monto: pagos.montoCentavos, metodo: pagos.metodo })
        .from(pagos)
        .where(
        and(
            eq(pagos.anulado, false),
            gte(pagos.fechaPago, p.desde),
            lte(pagos.fechaPago, p.hasta)
        )
        );

    const otros = await db
        .select({ monto: otrosIngresos.montoCentavos, metodo: otrosIngresos.metodo })
        .from(otrosIngresos)
        .where(
        and(
            isNull(otrosIngresos.eliminadoEn),
            gte(otrosIngresos.fecha, p.desde),
            lte(otrosIngresos.fecha, p.hasta)
        )
        );

    const listaGastos = await db
        .select({
        monto: gastos.montoCentavos,
        metodo: gastos.metodo,
        categoria: gastos.categoria,
        })
        .from(gastos)
        .where(
        and(
            isNull(gastos.eliminadoEn),
            gte(gastos.fecha, p.desde),
            lte(gastos.fecha, p.hasta)
        )
        );

    const sumar = (arr: { monto: number }[]) =>
        arr.reduce((t, x) => t + x.monto, 0);

    const ingresosCuotas = sumar(cuotas);
    const ingresosOtros = sumar(otros);
    const todosIngresos = [...cuotas, ...otros];

    const ingresosTotal = ingresosCuotas + ingresosOtros;
    const ingresosEfectivo = sumar(
        todosIngresos.filter((x) => x.metodo === "efectivo")
    );
    const ingresosTransferencia = ingresosTotal - ingresosEfectivo;

    const egresosTotal = sumar(listaGastos);
    const egresosEfectivo = sumar(
        listaGastos.filter((x) => x.metodo === "efectivo")
    );
    const egresosTransferencia = egresosTotal - egresosEfectivo;

    const porCat: Record<string, number> = {};
    for (const g of listaGastos) {
        porCat[g.categoria] = (porCat[g.categoria] ?? 0) + g.monto;
    }
    const egresosPorCategoria = Object.entries(porCat)
        .map(([categoria, monto]) => ({ categoria, monto }))
        .sort((a, b) => b.monto - a.monto);

    return {
        ingresosTotal,
        ingresosEfectivo,
        ingresosTransferencia,
        ingresosCuotas,
        ingresosOtros,
        egresosTotal,
        egresosEfectivo,
        egresosTransferencia,
        egresosPorCategoria,
        resultado: ingresosTotal - egresosTotal,
    };
}

export async function desglosePorPlan(p: Periodo): Promise<DesglosePlan[]> {
    const filas = await db
        .select({ plan: planes.nombre, monto: pagos.montoCentavos })
        .from(pagos)
        .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
        .innerJoin(planes, eq(suscripciones.planId, planes.id))
        .where(
        and(
            eq(pagos.anulado, false),
            gte(pagos.fechaPago, p.desde),
            lte(pagos.fechaPago, p.hasta)
        )
        );

    const acc: Record<string, { cantidad: number; monto: number }> = {};
    for (const f of filas) {
        if (!acc[f.plan]) acc[f.plan] = { cantidad: 0, monto: 0 };
        acc[f.plan].cantidad++;
        acc[f.plan].monto += f.monto;
    }

    return Object.entries(acc)
        .map(([plan, v]) => ({ plan, ...v }))
        .sort((a, b) => b.monto - a.monto);
}

export async function metricasSocios(p: Periodo): Promise<MetricasSocios> {
    // Altas: socios creados dentro del período
    const altas = await db
        .select({ id: socios.id })
        .from(socios)
        .where(
        and(
            gte(socios.creadoEn, new Date(p.desde + "T00:00:00Z")),
            lte(socios.creadoEn, new Date(p.hasta + "T23:59:59Z"))
        )
        );

    // Bajas: socios dados de baja dentro del período
    const bajas = await db
        .select({ id: socios.id })
        .from(socios)
        .where(
        and(
            isNotNull(socios.eliminadoEn),
            gte(socios.eliminadoEn, new Date(p.desde + "T00:00:00Z")),
            lte(socios.eliminadoEn, new Date(p.hasta + "T23:59:59Z"))
        )
        );

    // Suscripciones que vencieron dentro del período
    const vencidas = await db
        .select({ socioId: suscripciones.socioId, hasta: suscripciones.hasta })
        .from(suscripciones)
        .where(
        and(
            isNull(suscripciones.eliminadoEn),
            gte(suscripciones.hasta, p.desde),
            lte(suscripciones.hasta, p.hasta)
        )
        );

    // De los que vencieron, ¿cuántos tienen una suscripción posterior?
    let renovaron = 0;
    for (const v of vencidas) {
        const [posterior] = await db
        .select({ id: suscripciones.id })
        .from(suscripciones)
        .where(
            and(
            eq(suscripciones.socioId, v.socioId),
            isNull(suscripciones.eliminadoEn),
            gte(suscripciones.hasta, v.hasta),
            isNotNull(suscripciones.id)
            )
        )
        .limit(2);
        // Si hay más de una con hasta >= la vencida, renovó
        const todas = await db
        .select({ id: suscripciones.id })
        .from(suscripciones)
        .where(
            and(
            eq(suscripciones.socioId, v.socioId),
            isNull(suscripciones.eliminadoEn),
            gte(suscripciones.hasta, v.hasta)
            )
        );
        if (todas.length > 1) renovaron++;
    }

    // Activos al cierre del período: socios no dados de baja
    // con una suscripción cuyo "hasta" es >= la fecha de cierre
    const activos = await db
        .select({ socioId: suscripciones.socioId })
        .from(suscripciones)
        .innerJoin(socios, eq(suscripciones.socioId, socios.id))
        .where(
        and(
            isNull(suscripciones.eliminadoEn),
            isNull(socios.eliminadoEn),
            gte(suscripciones.hasta, p.hasta),
            lte(suscripciones.desde, p.hasta)
        )
        );
    const activosUnicos = new Set(activos.map((a) => a.socioId));

    const tasaRenovacion =
        vencidas.length > 0 ? (renovaron / vencidas.length) * 100 : null;

    return {
        altas: altas.length,
        bajas: bajas.length,
        activosAlCierre: activosUnicos.size,
        vencieronEnPeriodo: vencidas.length,
        renovaron,
        tasaRenovacion,
    };
}