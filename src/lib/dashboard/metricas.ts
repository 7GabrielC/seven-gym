import { db } from "@/db";
import { socios, suscripciones, pagos, planes } from "@/db/schema";
import { eq, isNull, gte, lte, and, max, sum, count, desc, sql } from "drizzle-orm";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";

type SocioConEstado = {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    vencimiento: string;
    estado: EstadoSocio;
};

export async function obtenerMetricas() {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const [filas, totalMes, totalHoy] = await Promise.all([
        // Cada socio con su vencimiento, en una consulta
        db
        .select({
            id: socios.id,
            nombre: socios.nombre,
            apellido: socios.apellido,
            telefono: socios.telefono,
            vencimiento: max(suscripciones.hasta),
        })
        .from(socios)
        .leftJoin(
            suscripciones,
            and(
            eq(suscripciones.socioId, socios.id),
            isNull(suscripciones.eliminadoEn)
            )
        )
        .where(isNull(socios.eliminadoEn))
        .groupBy(socios.id),

        // Ingresos del mes: la base suma, no JavaScript
        db
        .select({ total: sum(pagos.montoCentavos) })
        .from(pagos)
        .where(and(eq(pagos.anulado, false), gte(pagos.fechaPago, primerDiaMes))),

        // Cobrado hoy
        db
        .select({ total: sum(pagos.montoCentavos), n: count() })
        .from(pagos)
        .where(and(eq(pagos.anulado, false), eq(pagos.fechaPago, hoyStr))),
    ]);

    const sociosConEstado: SocioConEstado[] = filas
        .filter((f) => f.vencimiento !== null)
        .map((f) => ({
        id: f.id,
        nombre: f.nombre,
        apellido: f.apellido,
        telefono: f.telefono,
        vencimiento: f.vencimiento!,
        estado: calcularEstadoSocio(new Date(f.vencimiento!), hoy),
        }));

    const porVencer = sociosConEstado.filter((s) => s.estado === "por_vencer");
    const vencidos = sociosConEstado.filter((s) => s.estado === "vencido");
    const activos = sociosConEstado.filter((s) => s.estado === "activo");

    // Ingresos del mes anterior, para la variación
    const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        .toISOString()
        .slice(0, 10);

    const [ingresosMesAnterior] = await db
        .select({ total: sum(pagos.montoCentavos) })
        .from(pagos)
        .where(
        and(
            eq(pagos.anulado, false),
            gte(pagos.fechaPago, primerDiaMesAnterior),
            lte(pagos.fechaPago, ultimoDiaMesAnterior)
        )
        );

    const ingresosMes = Number(totalMes[0]?.total ?? 0);
    const ingresosAnterior = Number(ingresosMesAnterior?.total ?? 0);
    const variacionIngresos =
        ingresosAnterior > 0
        ? Math.round(((ingresosMes - ingresosAnterior) / ingresosAnterior) * 100)
        : null;

    return {
        porVencer,
        vencidos,
        totalActivos: activos.length,
        ingresosMesCentavos: ingresosMes,
        cobradoHoyCentavos: Number(totalHoy[0]?.total ?? 0),
        cantidadPagosHoy: Number(totalHoy[0]?.n ?? 0),
        variacionIngresos,
    };
}

export type SociosPorPlan = { plan: string; cantidad: number };

export type Actividad = {
    tipo: "pago" | "alta" | "anulacion";
    descripcion: string;
    detalle: string;
    monto: number | null;
    fecha: Date;
};

/** Cuántos socios activos tiene cada plan (según su suscripción vigente) */
export async function sociosPorPlan(): Promise<SociosPorPlan[]> {
    const hoyStr = new Date().toISOString().slice(0, 10);

    const filas = await db
        .select({
        plan: planes.nombre,
        cantidad: sql<number>`count(distinct ${suscripciones.socioId})`,
        })
        .from(suscripciones)
        .innerJoin(socios, eq(suscripciones.socioId, socios.id))
        .innerJoin(planes, eq(suscripciones.planId, planes.id))
        .where(
        and(
            isNull(suscripciones.eliminadoEn),
            isNull(socios.eliminadoEn),
            gte(suscripciones.hasta, hoyStr)
        )
        )
        .groupBy(planes.nombre);

    return filas
        .map((f) => ({ plan: f.plan, cantidad: Number(f.cantidad) }))
        .sort((a, b) => b.cantidad - a.cantidad);
}

/** Las últimas cosas que pasaron, derivadas de los datos que ya existen */
export async function actividadReciente(limite = 5): Promise<Actividad[]> {
    const [ultimosPagos, ultimasAltas, ultimasAnulaciones] = await Promise.all([
        db
        .select({
            monto: pagos.montoCentavos,
            fecha: pagos.creadoEn,
            nombre: socios.nombre,
            apellido: socios.apellido,
            plan: planes.nombre,
        })
        .from(pagos)
        .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
        .innerJoin(socios, eq(suscripciones.socioId, socios.id))
        .innerJoin(planes, eq(suscripciones.planId, planes.id))
        .where(eq(pagos.anulado, false))
        .orderBy(desc(pagos.creadoEn))
        .limit(limite),

        db
        .select({
            nombre: socios.nombre,
            apellido: socios.apellido,
            fecha: socios.creadoEn,
        })
        .from(socios)
        .where(isNull(socios.eliminadoEn))
        .orderBy(desc(socios.creadoEn))
        .limit(limite),

        db
        .select({
            monto: pagos.montoCentavos,
            fecha: pagos.anuladoEn,
            nombre: socios.nombre,
            apellido: socios.apellido,
        })
        .from(pagos)
        .innerJoin(suscripciones, eq(pagos.suscripcionId, suscripciones.id))
        .innerJoin(socios, eq(suscripciones.socioId, socios.id))
        .where(eq(pagos.anulado, true))
        .orderBy(desc(pagos.anuladoEn))
        .limit(limite),
    ]);

    const todas: Actividad[] = [
        ...ultimosPagos.map((p) => ({
        tipo: "pago" as const,
        descripcion: `Cobro a ${p.nombre} ${p.apellido}`,
        detalle: p.plan,
        monto: p.monto,
        fecha: new Date(p.fecha),
        })),
        ...ultimasAltas.map((a) => ({
        tipo: "alta" as const,
        descripcion: `Nuevo socio: ${a.nombre} ${a.apellido}`,
        detalle: "Alta",
        monto: null,
        fecha: new Date(a.fecha),
        })),
        ...ultimasAnulaciones
        .filter((a) => a.fecha !== null)
        .map((a) => ({
            tipo: "anulacion" as const,
            descripcion: `Pago anulado: ${a.nombre} ${a.apellido}`,
            detalle: "Anulación",
            monto: a.monto,
            fecha: new Date(a.fecha!),
        })),
    ];

    return todas
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .slice(0, limite);
}