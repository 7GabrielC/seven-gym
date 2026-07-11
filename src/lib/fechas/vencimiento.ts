import { addMonths, addDays } from "date-fns";

export type UnidadDuracion = "mes" | "dia";

export function calcularVencimiento(
    desde: Date,
    valor: number,
    unidad: UnidadDuracion
): Date {
    if (unidad === "dia") {
        return addDays(desde, valor);
    }
    return addMonths(desde, valor);
}