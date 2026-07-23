"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { esquemaUsuario } from "@/lib/validaciones/esquema-usuarios";

export async function crearUsuario(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  // Solo el dueño puede crear usuarios
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.rol !== "dueño") {
    return { error: "No tenés permiso para crear usuarios." };
  }

  const resultado = esquemaUsuario.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
  });

  if (!resultado.success) {
    return { error: resultado.error.issues[0].message };
  }

  const { nombre, email, password, rol } = resultado.data;

  // Verificar que el email no exista ya
  const [existente] = await db.select().from(user).where(eq(user.email, email));
  if (existente) {
    return { error: "Ya existe un usuario con ese email." };
  }

  // Crear el usuario (Better Auth encripta la contraseña)
  try {
    await auth.api.signUpEmail({
      body: { name: nombre, email, password },
    });
  } catch {
    return { error: "No se pudo crear el usuario. Revisá los datos." };
  }

  // Asignar el rol elegido
  await db.update(user).set({ rol }).where(eq(user.email, email));

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function desactivarUsuario(
  usuarioId: string,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.rol !== "dueño") {
    return { error: "No tenés permiso para hacer esto." };
  }

  if (usuarioId === session.user.id) {
    return { error: "No podés desactivar tu propia cuenta." };
  }

  const [objetivo] = await db.select().from(user).where(eq(user.id, usuarioId));
  if (!objetivo) {
    return { error: "Usuario no encontrado." };
  }

  // Si es dueño, verificar que no sea el último dueño activo
  if (objetivo.rol === "dueño") {
    const duenosActivos = await db
      .select()
      .from(user)
      .where(eq(user.rol, "dueño"));
    const activos = duenosActivos.filter((u) => u.activo);
    if (activos.length <= 1) {
      return { error: "No se puede desactivar al único dueño activo." };
    }
  }

  await db.update(user).set({ activo: false }).where(eq(user.id, usuarioId));

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function reactivarUsuario(
  usuarioId: string,
): Promise<{ error: string } | { ok: true }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.rol !== "dueño") {
    return { error: "No tenés permiso para hacer esto." };
  }

  await db.update(user).set({ activo: true }).where(eq(user.id, usuarioId));

  revalidatePath("/usuarios");
  return { ok: true };
}
