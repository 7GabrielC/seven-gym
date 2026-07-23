import { z } from "zod";

export const esquemaCambiarPrecio = z.object({
  planId: z.coerce.number().int().positive("Plan inválido"),
  precio: z.coerce
    .number({ message: "Ingresá un precio válido" })
    .positive("El precio debe ser mayor a cero"),
});

export const esquemaCrearPlan = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo"),
  duracionValor: z.coerce
    .number({ message: "La duración debe ser un número" })
    .int("La duración debe ser un número entero")
    .positive("La duración debe ser mayor a cero"),
  duracionUnidad: z.enum(["mes", "dia"], {
    message: "Unidad de duración inválida",
  }),
  precio: z.coerce
    .number({ message: "Ingresá un precio válido" })
    .positive("El precio debe ser mayor a cero"),
  usoUnico: z.string().optional(),
});

export type DatosCambiarPrecio = z.infer<typeof esquemaCambiarPrecio>;
export type DatosCrearPlan = z.infer<typeof esquemaCrearPlan>;