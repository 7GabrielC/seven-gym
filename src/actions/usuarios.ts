"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function crearUsuario(
    formData: FormData
): Promise<{ error: string } | { ok: true }> {
    // Solo el dueño puede crear usuarios
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.rol !== "dueño") {
        return { error: "No tenés permiso para crear usuarios." };
    }

    const nombre = (formData.get("nombre") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const rol = formData.get("rol") as string;

    if (!nombre || !email || !password) {
        return { error: "Completá nombre, email y contraseña." };
    }
    if (password.length < 8) {
        return { error: "La contraseña debe tener al menos 8 caracteres." };
    }
    if (rol !== "dueño" && rol !== "recepcionista") {
        return { error: "Rol inválido." };
    }

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