"use server";

import { db } from "@/db";
import { socios } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function crearSocio(formData: FormData) {
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const dni = formData.get("dni") as string;
    const telefono = formData.get("telefono") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;

    await db.insert(socios).values({
        nombre,
        apellido,
        dni,
        telefono,
        fechaNacimiento,
    });

    revalidatePath("/socios");
}