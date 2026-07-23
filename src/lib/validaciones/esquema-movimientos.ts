import { z } from "zod";

export const esquemaGasto = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(200, "La descripción es demasiado larga"),
  categoria: z.enum(
    ["limpieza", "mantenimiento", "servicios", "sueldos", "equipamiento", "otros"],
    { message: "Elegí una categoría válida" },
  ),
  metodo: z.enum(["efectivo", "transferencia"], {
    message: "Elegí un método válido",
  }),
  monto: z.coerce
    .number({ message: "Ingresá un monto válido" })
    .positive("El monto debe ser mayor a cero"),
});

export const esquemaOtroIngreso = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(200, "La descripción es demasiado larga"),
  metodo: z.enum(["efectivo", "transferencia"], {
    message: "Elegí un método válido",
  }),
  monto: z.coerce
    .number({ message: "Ingresá un monto válido" })
    .positive("El monto debe ser mayor a cero"),
});

export type DatosGasto = z.infer<typeof esquemaGasto>;
export type DatosOtroIngreso = z.infer<typeof esquemaOtroIngreso>;