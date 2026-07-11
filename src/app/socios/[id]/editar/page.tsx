import { db } from "@/db";
import { socios } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { editarSocio } from "@/actions/socios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EditarSocioPage({
    params,
    }: {
    params: Promise<{ id: string }>;
    }) {
    const { id } = await params;
    const socioId = Number(id);

    const [socio] = await db
        .select()
        .from(socios)
        .where(and(eq(socios.id, socioId), isNull(socios.eliminadoEn)));

    if (!socio) {
        notFound();
    }

    return (
        <div className="max-w-md mx-auto p-8">
        <Link href={`/socios/${socioId}`} className="text-sm text-blue-600 hover:underline">
            ← Volver a la ficha
        </Link>

        <h1 className="text-2xl font-semibold mt-4 mb-6">Editar socio</h1>

        <form action={editarSocio} className="space-y-4">
            <input type="hidden" name="id" value={socio.id} />

            <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={socio.nombre} required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" defaultValue={socio.apellido} required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" name="dni" defaultValue={socio.dni} required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" defaultValue={socio.telefono} required />
            </div>

            <div className="space-y-2">
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
    );
}