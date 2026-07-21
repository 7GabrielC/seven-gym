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

  if (session.user.activo === false) {
    await auth.api.signOut({ headers: await headers() });
    redirect("/login?desactivado=1");
  }

  return session;
}

export async function esDueno() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.rol === "dueño" && session?.user?.activo !== false;
}

export async function requerirDueno() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.activo === false) {
    await auth.api.signOut({ headers: await headers() });
    redirect("/login?desactivado=1");
  }

  if (session.user.rol !== "dueño") {
    redirect("/");
  }

  return session;
}