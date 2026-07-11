import { db } from "@/db";
import { socios, suscripciones, pagos } from "@/db/schema";
import { eq, desc, isNull, gte, and } from "drizzle-orm";
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

    // Traer todos los socios activos (no dados de baja)
    const listaSocios = await db
        .select()
        .from(socios)
        .where(isNull(socios.eliminadoEn));

    // Calcular el estado de cada uno según su última suscripción
    const sociosConEstado: SocioConEstado[] = [];

    for (const socio of listaSocios) {
        const [ultimaSuscripcion] = await db
        .select()
        .from(suscripciones)
        .where(eq(suscripciones.socioId, socio.id))
        .orderBy(desc(suscripciones.hasta))
        .limit(1);

        if (ultimaSuscripcion) {
        const estado = calcularEstadoSocio(new Date(ultimaSuscripcion.hasta), hoy);
        sociosConEstado.push({
            id: socio.id,
            nombre: socio.nombre,
            apellido: socio.apellido,
            telefono: socio.telefono,
            vencimiento: ultimaSuscripcion.hasta,
            estado,
        });
        }
    }

    // Separar por estado para las listas de acción
    const porVencer = sociosConEstado.filter((s) => s.estado === "por_vencer");
    const vencidos = sociosConEstado.filter((s) => s.estado === "vencido");
    const activos = sociosConEstado.filter((s) => s.estado === "activo");

    // Ingresos del mes: sumar pagos desde el día 1 del mes actual
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const pagosDelMes = await db
        .select()
        .from(pagos)
        .where(and(gte(pagos.fechaPago, primerDiaMes), eq(pagos.anulado, false)));

    const ingresosMesCentavos = pagosDelMes.reduce(
        (total, pago) => total + pago.montoCentavos,
        0
    );

    // Cobrado hoy
    const hoyStr = hoy.toISOString().slice(0, 10);
    const pagosHoy = pagosDelMes.filter((p) => p.fechaPago === hoyStr);
    const cobradoHoyCentavos = pagosHoy.reduce(
        (total, pago) => total + pago.montoCentavos,
        0
    );

    return {
        porVencer,
        vencidos,
        totalActivos: activos.length,
        ingresosMesCentavos,
        cobradoHoyCentavos,
        cantidadPagosHoy: pagosHoy.length,
    };
}