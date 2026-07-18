"use server";

import { db } from "@/db";
import { socios, suscripciones } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, isNull, and } from "drizzle-orm";

export async function crearSocio(
    formData: FormData
): Promise<{ error: string; socioBajaId?: number; nombreBaja?: string } | void> {
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const dni = formData.get("dni") as string;
    const telefono = formData.get("telefono") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;
    const email = (formData.get("email") as string) || null;

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

    await db.insert(socios).values({ nombre, apellido, dni, telefono, email, fechaNacimiento });

    revalidatePath("/socios");
    redirect("/socios");
}

export async function reactivarSocio(socioId: number) {
    await db.update(socios).set({ eliminadoEn: null }).where(eq(socios.id, socioId));

    revalidatePath("/socios");
    redirect(`/socios/${socioId}`);
}

export async function editarSocio(formData: FormData) {
    const id = Number(formData.get("id"));
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const dni = formData.get("dni") as string;
    const telefono = formData.get("telefono") as string;
    const fechaNacimiento = formData.get("fechaNacimiento") as string;
    const email = (formData.get("email") as string) || null;

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
        await tx.update(socios).set({ eliminadoEn: new Date() }).where(eq(socios.id, id));

        // Si tenía una suscripción activa, se cierra junto con la baja del socio.
        await tx
        .update(suscripciones)
        .set({ eliminadoEn: new Date() })
        .where(and(eq(suscripciones.socioId, id), isNull(suscripciones.eliminadoEn)));
    });

    revalidatePath("/socios");
    redirect("/socios");
}

export async function verificarDni(
    dni: string
): Promise<{ estado: "libre" } | { estado: "activo" } | { estado: "baja"; id: number; nombre: string }> {
    if (!dni || dni.length < 6) return { estado: "libre" };

    const [existente] = await db.select().from(socios).where(eq(socios.dni, dni));

    if (!existente) return { estado: "libre" };
    if (existente.eliminadoEn) {
        return { estado: "baja", id: existente.id, nombre: `${existente.nombre} ${existente.apellido}` };
    }
    return { estado: "activo" };
}