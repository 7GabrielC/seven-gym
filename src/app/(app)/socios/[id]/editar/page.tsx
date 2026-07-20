import { db } from "@/db";
import { socios } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { editarSocio } from "@/actions/socios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requerirSesion } from "@/lib/session";

export default async function EditarSocioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requerirSesion();
  const { id } = await params;
  const socioId = Number(id);

  const [socio] = await db
    .select()
    .from(socios)
    .where(and(eq(socios.id, socioId), isNull(socios.eliminadoEn)));

  if (!socio) notFound();

  const iniciales =
    `${socio.nombre[0] ?? ""}${socio.apellido[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-4xl px-8 py-7">
      <Link
        href={`/socios/${socioId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver a la ficha
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Editar socio
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {socio.nombre} {socio.apellido}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <form action={editarSocio} className="space-y-4">
            <input type="hidden" name="id" value={socio.id} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={socio.nombre}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  defaultValue={socio.apellido}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" name="dni" defaultValue={socio.dni} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  defaultValue={socio.telefono}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email{" "}
                <span className="text-muted-foreground/60 font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={socio.email ?? ""}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                defaultValue={socio.fechaNacimiento}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Guardar cambios
            </Button>
          </form>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 flex flex-col items-center text-center h-fit">
          <div className="size-16 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xl font-medium text-muted-foreground mb-3">
            {iniciales}
          </div>
          <div className="text-sm font-medium">
            {socio.nombre} {socio.apellido}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            DNI {socio.dni}
          </div>
        </div>
      </div>
    </div>
  );
}
