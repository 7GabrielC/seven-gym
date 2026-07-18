import { db } from "@/db";
import { socios, suscripciones, pagos } from "@/db/schema";
import { eq, isNull, gte, and, max, sum, count } from "drizzle-orm";
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

    return {
        porVencer,
        vencidos,
        totalActivos: activos.length,
        ingresosMesCentavos: Number(totalMes[0]?.total ?? 0),
        cobradoHoyCentavos: Number(totalHoy[0]?.total ?? 0),
        cantidadPagosHoy: Number(totalHoy[0]?.n ?? 0),
    };
}