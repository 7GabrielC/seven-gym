import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

async function seedDueno() {
  console.log("Creando usuario dueño...");

  // 1. Crear el usuario con email y contraseña (Better Auth encripta la clave)
  await auth.api.signUpEmail({
    body: {
      name: "Gabriel",
      email: "gabriel@seven-gym.com",
      password: "seven1234",
    },
  });

  // 2. Marcarlo como dueño (el rol por defecto es recepcionista)
  await db
    .update(user)
    .set({ rol: "dueño" })
    .where(eq(user.email, "gabriel@seven-gym.com"));

  console.log("¡Usuario dueño creado!");
  console.log("Email: gabriel@seven-gym.com");
  console.log("Contraseña: seven1234");
  process.exit(0);
}

seedDueno();
