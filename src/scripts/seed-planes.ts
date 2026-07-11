import { db } from "@/db";
import { planes, preciosPlan } from "@/db/schema";

async function seedPlanes() {
    console.log("Cargando planes...");

    const bienvenida = await db
        .insert(planes)
        .values({
        nombre: "Bienvenida",
        duracionValor: 14,
        duracionUnidad: "dia",
        usosMaximosPorSocio: 1,
        })
        .returning();

    const mensual = await db
        .insert(planes)
        .values({
        nombre: "Mensual",
        duracionValor: 1,
        duracionUnidad: "mes",
        })
        .returning();

    const trimestral = await db
        .insert(planes)
        .values({
        nombre: "Trimestral",
        duracionValor: 3,
        duracionUnidad: "mes",
        })
        .returning();

    const hoy = new Date().toISOString().slice(0, 10);

    await db.insert(preciosPlan).values([
        { planId: bienvenida[0].id, precioCentavos: 1000000, vigenteDesde: hoy },
        { planId: mensual[0].id, precioCentavos: 3000000, vigenteDesde: hoy },
        { planId: trimestral[0].id, precioCentavos: 7500000, vigenteDesde: hoy },
    ]);

    console.log("¡Planes cargados!");
    process.exit(0);
}

seedPlanes();