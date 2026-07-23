import { z } from "zod";

const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const soloTelefono = /^[\d\s+()-]+$/;

export const esquemaSocio = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo")
    .regex(soloLetras, "El nombre solo puede tener letras"),
  apellido: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido es demasiado largo")
    .regex(soloLetras, "El apellido solo puede tener letras"),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 números, sin puntos ni letras"),
  telefono: z
    .string()
    .trim()
    .min(6, "El teléfono es demasiado corto")
    .max(30, "El teléfono es demasiado largo")
    .regex(soloTelefono, "El teléfono solo puede tener números, espacios y + ( ) -"),
  email: z
    .string()
    .trim()
    .email("El email no tiene un formato válido")
    .optional()
    .or(z.literal("")),
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
});

export type DatosSocio = z.infer<typeof esquemaSocio>;