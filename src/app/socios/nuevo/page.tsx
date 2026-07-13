import { crearSocio } from "@/actions/socios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requerirSesion } from "@/lib/session";

export default async function NuevoSocioPage() {
    await requerirSesion();
    return (
        <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Nuevo socio</h1>

        <form action={crearSocio} className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" name="dni" required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" required />
            </div>

            <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input id="fechaNacimiento" name="fechaNacimiento" type="date" required />
            </div>

            <Button type="submit" className="w-full">
            Guardar socio
            </Button>
        </form>
        </div>
    );
}