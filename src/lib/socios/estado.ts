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

/** Días que faltan para el vencimiento. Negativo si ya venció. */
export function diasHastaVencimiento(vencimiento: Date, hoy: Date): number {
  const v = Date.UTC(
    vencimiento.getUTCFullYear(),
    vencimiento.getUTCMonth(),
    vencimiento.getUTCDate(),
  );
  const h = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return Math.round((v - h) / 86400000);
}
