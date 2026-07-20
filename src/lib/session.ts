import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requerirSesion() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function esDueno() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.rol === "dueño";
}

export async function requerirDueno() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.rol !== "dueño") {
    redirect("/");
  }

  return session;
}
