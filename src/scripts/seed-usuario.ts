import { db } from "@/db";
import { usuarios } from "@/db/schema";

async function seedUsuario() {
    console.log("Cargando usuario...");

    await db.insert(usuarios).values({
        nombre: "Gabriel",
        email: "gabriel@seven-gym.com",
        rol: "dueño",
    });

    console.log("¡Usuario cargado!");
    process.exit(0);
}

seedUsuario();