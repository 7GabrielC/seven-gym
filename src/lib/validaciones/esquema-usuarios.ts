import { z } from "zod";

const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

export const esquemaUsuario = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo")
    .regex(soloLetras, "El nombre solo puede tener letras"),
  email: z.string().trim().email("El email no tiene un formato válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga"),
  rol: z.enum(["dueño", "recepcionista"], {
    message: "Rol inválido",
  }),
});

export type DatosUsuario = z.infer<typeof esquemaUsuario>;
