import { differenceInCalendarDays } from "date-fns";

export type EstadoSocio = "activo" | "por_vencer" | "vencido" | "inactivo";

export const DIAS_POR_VENCER = 7;
export const DIAS_RECUPERABLE = 30;

export function calcularEstadoSocio(vencimiento: Date, hoy: Date): EstadoSocio {
    const diasHastaVencimiento = differenceInCalendarDays(vencimiento, hoy);

    if (diasHastaVencimiento < 0) {
        const diasVencido = Math.abs(diasHastaVencimiento);
        if (diasVencido > DIAS_RECUPERABLE) {
        return "inactivo";
        }
        return "vencido";
    }

    if (diasHastaVencimiento <= DIAS_POR_VENCER) {
        return "por_vencer";
    }

    return "activo";
}