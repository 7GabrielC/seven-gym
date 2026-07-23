"use server";

import { db } from "@/db";
import { socios, suscripciones } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, isNull, and } from "drizzle-orm";
import { esquemaSocio } from "@/lib/validaciones/esquema-socios";

export async function crearSocio(formData: FormData): Promise<{
  error: string;
  socioBajaId?: number;
  nombreBaja?: string;
} | void> {
  const resultado = esquemaSocio.safeParse({
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    dni: formData.get("dni"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
    fechaNacimiento: formData.get("fechaNacimiento"),
  });

  if (!resultado.success) {
    return { error: resultado.error.issues[0].message };
  }

  const { nombre, apellido, dni, telefono, fechaNacimiento } = resultado.data;
  const email = resultado.data.email || null;

  const [existente] = await db.select().from(socios).where(eq(socios.dni, dni));

  if (existente) {
    if (existente.eliminadoEn) {
      // No es un duplicado real: es alguien que puede reactivarse.
      return {
        error: "dado_de_baja",
        socioBajaId: existente.id,
        nombreBaja: `${existente.nombre} ${existente.apellido}`,
      };
    }
    return { error: `Ya existe un socio activo con el DNI ${dni}.` };
  }

  await db
    .insert(socios)
    .values({ nombre, apellido, dni, telefono, email, fechaNacimiento });

  revalidatePath("/socios");
  redirect("/socios");
}

export async function reactivarSocio(socioId: number) {
  await db
    .update(socios)
    .set({ eliminadoEn: null })
    .where(eq(socios.id, socioId));

  revalidatePath("/socios");
  redirect(`/socios/${socioId}`);
}

export async function editarSocio(
  formData: FormData,
): Promise<{ error: string } | void> {
  const id = Number(formData.get("id"));

  const resultado = esquemaSocio.safeParse({
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    dni: formData.get("dni"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
    fechaNacimiento: formData.get("fechaNacimiento"),
  });

  if (!resultado.success) {
    return { error: resultado.error.issues[0].message };
  }

  const { nombre, apellido, dni, telefono, fechaNacimiento } = resultado.data;
  const email = resultado.data.email || null;

  await db
    .update(socios)
    .set({
      nombre,
      apellido,
      dni,
      telefono,
      email,
      fechaNacimiento,
      actualizadoEn: new Date(),
    })
    .where(eq(socios.id, id));

  revalidatePath("/socios");
  redirect(`/socios/${id}`);
}

export async function darDeBajaSocio(formData: FormData) {
  const id = Number(formData.get("id"));

  await db.transaction(async (tx) => {
    await tx
      .update(socios)
      .set({ eliminadoEn: new Date() })
      .where(eq(socios.id, id));

    // Si tenía una suscripción activa, se cierra junto con la baja del socio.
    await tx
      .update(suscripciones)
      .set({ eliminadoEn: new Date() })
      .where(
        and(eq(suscripciones.socioId, id), isNull(suscripciones.eliminadoEn)),
      );
  });

  revalidatePath("/socios");
  redirect("/socios");
}

export async function verificarDni(
  dni: string,
): Promise<
  | { estado: "libre" }
  | { estado: "activo" }
  | { estado: "baja"; id: number; nombre: string }
> {
  if (!dni || dni.length < 6) return { estado: "libre" };

  const [existente] = await db.select().from(socios).where(eq(socios.dni, dni));

  if (!existente) return { estado: "libre" };
  if (existente.eliminadoEn) {
    return {
      estado: "baja",
      id: existente.id,
      nombre: `${existente.nombre} ${existente.apellido}`,
    };
  }
  return { estado: "activo" };
}
