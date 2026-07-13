"use server";

import { db } from "@/db";
import { socios } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function crearSocio(
    formData: FormData
): Promise<{ error: string } | void> {
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const dni = formData.get("dni") as string;
    const telefono = formData.get("telefono") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;

    // Verificar si ya existe un socio con ese DNI (incluyendo dados de baja)
    const [existente] = await db
        .select()
        .from(socios)
        .where(eq(socios.dni, dni));

    if (existente) {
        return { error: `Ya existe un socio con el DNI ${dni}.` };
    }

    await db.insert(socios).values({
        nombre,
        apellido,
        dni,
        telefono,
        fechaNacimiento,
    });

    revalidatePath("/socios");
    redirect("/socios");
}

export async function editarSocio(formData: FormData) {
    const id = Number(formData.get("id"));
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const dni = formData.get("dni") as string;
    const telefono = formData.get("telefono") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;

    await db
        .update(socios)
        .set({
        nombre,
        apellido,
        dni,
        telefono,
        fechaNacimiento,
        actualizadoEn: new Date(),
        })
        .where(eq(socios.id, id));

    revalidatePath("/socios");
    redirect(`/socios/${id}`);
}

export async function darDeBajaSocio(formData: FormData) {
    const id = Number(formData.get("id"));

    await db
        .update(socios)
        .set({ eliminadoEn: new Date() })
        .where(eq(socios.id, id));

    revalidatePath("/socios");
    redirect("/socios");
}