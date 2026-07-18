import { db } from "@/db";
import {
    pagos,
    suscripciones,
    socios,
    planes,
    gastos,
    otrosIngresos,
} from "@/db/schema";
import { eq, sum, and, isNull, gte, lte, isNotNull, count, sql } from "drizzle-orm";
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
    const desdeTs = new Date(p.desde + "T00:00:00Z");
    const hastaTs = new Date(p.hasta + "T23:59:59Z");

    const [altas, bajas, renovacion, activos] = await Promise.all([
        // Altas del período
        db
        .select({ n: count() })
        .from(socios)
        .where(and(gte(socios.creadoEn, desdeTs), lte(socios.creadoEn, hastaTs))),

        // Bajas del período
        db
        .select({ n: count() })
        .from(socios)
        .where(
            and(
            isNotNull(socios.eliminadoEn),
            gte(socios.eliminadoEn, desdeTs),
            lte(socios.eliminadoEn, hastaTs)
            )
        ),

        // Vencidos y renovados, en UNA consulta.
        // Por cada suscripción que venció en el período, preguntamos si el socio
        // tiene otra suscripción posterior. El EXISTS lo resuelve la base.
        db
        .select({
            vencieron: count(),
            renovaron: sql<number>`count(*) filter (where exists (
            select 1 from ${suscripciones} s2
            where s2.socio_id = ${suscripciones.socioId}
                and s2.eliminado_en is null
                and s2.desde >= ${suscripciones.hasta}
            ))`,
        })
        .from(suscripciones)
        .where(
            and(
            isNull(suscripciones.eliminadoEn),
            gte(suscripciones.hasta, p.desde),
            lte(suscripciones.hasta, p.hasta)
            )
        ),

        // Socios activos al cierre del período
        db
        .select({ n: sql<number>`count(distinct ${suscripciones.socioId})` })
        .from(suscripciones)
        .innerJoin(socios, eq(suscripciones.socioId, socios.id))
        .where(
            and(
            isNull(suscripciones.eliminadoEn),
            isNull(socios.eliminadoEn),
            gte(suscripciones.hasta, p.hasta),
            lte(suscripciones.desde, p.hasta)
            )
        ),
    ]);

    const vencieron = Number(renovacion[0]?.vencieron ?? 0);
    const renovaron = Number(renovacion[0]?.renovaron ?? 0);

    return {
        altas: Number(altas[0]?.n ?? 0),
        bajas: Number(bajas[0]?.n ?? 0),
        activosAlCierre: Number(activos[0]?.n ?? 0),
        vencieronEnPeriodo: vencieron,
        renovaron,
        tasaRenovacion: vencieron > 0 ? (renovaron / vencieron) * 100 : null,
    };
}

export type PuntoMensual = {
    mes: string;
    etiqueta: string;
    ingresos: number;
    egresos: number;
    resultado: number;
};

/** Serie de los últimos N meses (incluye el actual) */
export async function serieMensual(meses = 6): Promise<PuntoMensual[]> {
    const hoy = new Date();
    const desde = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1))
        .toISOString()
        .slice(0, 10);

    const [cuotas, otros, listaGastos] = await Promise.all([
        db
        .select({
            mes: sql<string>`to_char(${pagos.fechaPago}, 'YYYY-MM')`,
            total: sum(pagos.montoCentavos),
        })
        .from(pagos)
        .where(and(eq(pagos.anulado, false), gte(pagos.fechaPago, desde)))
        .groupBy(sql`to_char(${pagos.fechaPago}, 'YYYY-MM')`),

        db
        .select({
            mes: sql<string>`to_char(${otrosIngresos.fecha}, 'YYYY-MM')`,
            total: sum(otrosIngresos.montoCentavos),
        })
        .from(otrosIngresos)
        .where(and(isNull(otrosIngresos.eliminadoEn), gte(otrosIngresos.fecha, desde)))
        .groupBy(sql`to_char(${otrosIngresos.fecha}, 'YYYY-MM')`),

        db
        .select({
            mes: sql<string>`to_char(${gastos.fecha}, 'YYYY-MM')`,
            total: sum(gastos.montoCentavos),
        })
        .from(gastos)
        .where(and(isNull(gastos.eliminadoEn), gte(gastos.fecha, desde)))
        .groupBy(sql`to_char(${gastos.fecha}, 'YYYY-MM')`),
    ]);

    const mapa = new Map<string, { ingresos: number; egresos: number }>();

    // Armar los meses vacíos primero, para que no falte ninguno
    const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const serie: PuntoMensual[] = [];

    for (let i = meses - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth() - i, 1));
        const clave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        mapa.set(clave, { ingresos: 0, egresos: 0 });
        serie.push({
        mes: clave,
        etiqueta: MESES_CORTOS[d.getUTCMonth()],
        ingresos: 0,
        egresos: 0,
        resultado: 0,
        });
    }

    for (const c of cuotas) {
        const e = mapa.get(c.mes);
        if (e) e.ingresos += Number(c.total ?? 0);
    }
    for (const o of otros) {
        const e = mapa.get(o.mes);
        if (e) e.ingresos += Number(o.total ?? 0);
    }
    for (const g of listaGastos) {
        const e = mapa.get(g.mes);
        if (e) e.egresos += Number(g.total ?? 0);
    }

    return serie.map((p) => {
        const v = mapa.get(p.mes)!;
        return {
        ...p,
        ingresos: v.ingresos,
        egresos: v.egresos,
        resultado: v.ingresos - v.egresos,
        };
    });
}