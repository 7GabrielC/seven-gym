import { requerirSesion } from "@/lib/session";
import { FormSocio } from "./form-socio";

export default async function NuevoSocioPage() {
    await requerirSesion();

    return (
        <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Nuevo socio</h1>
        <FormSocio />
        </div>
    );
}