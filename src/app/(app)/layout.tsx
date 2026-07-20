import { requerirSesion } from "@/lib/session";
import { MenuLateral } from "@/components/menu-lateral";
import { BotonTema } from "@/components/boton-tema";
import { db } from "@/db";
import { sesionesCaja } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import Link from "next/link";

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requerirSesion();

  const [cajaAbierta] = await db
    .select({ id: sesionesCaja.id })
    .from(sesionesCaja)
    .where(
      and(
        eq(sesionesCaja.usuarioId, session.user.id),
        isNull(sesionesCaja.cerradaEn),
      ),
    )
    .limit(1);

  const rol = session.user.rol ?? "recepcionista";
  const hoy = new Date();
  const fecha = `${DIAS[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  return (
    <div className="flex min-h-screen">
      <MenuLateral rol={rol} nombre={session.user.name} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-8 h-14 shrink-0">
          {cajaAbierta ? (
            <Link
              href="/caja"
              className="flex items-center gap-2 group"
              title="Ir a la caja"
            >
              <span className="size-1.5 rounded-full bg-brand-accent shadow-[0_0_6px_var(--brand-accent)]" />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Caja abierta
              </span>
            </Link>
          ) : (
            <Link href="/caja" className="flex items-center gap-2 group">
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Caja cerrada
              </span>
            </Link>
          )}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground capitalize">
              {fecha}
            </span>
            <BotonTema />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
