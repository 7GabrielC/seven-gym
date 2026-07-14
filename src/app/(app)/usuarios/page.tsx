import { requerirDueno } from "@/lib/session";
import { db } from "@/db";
import { user } from "@/db/schema";
import { FormUsuario } from "./form-usuario";

export default async function UsuariosPage() {
    await requerirDueno();

    const usuarios = await db.select().from(user);

    return (
        <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Usuarios del sistema</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
            <h2 className="text-lg font-semibold mb-3">Crear usuario</h2>
            <FormUsuario />
            </div>

            <div>
            <h2 className="text-lg font-semibold mb-3">
                Usuarios ({usuarios.length})
            </h2>
            <ul className="space-y-2">
                {usuarios.map((u) => (
                <li key={u.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{u.name}</span>
                    <span className="text-gray-500">{u.rol}</span>
                </li>
                ))}
            </ul>
            </div>
        </div>
        </div>
    );
}