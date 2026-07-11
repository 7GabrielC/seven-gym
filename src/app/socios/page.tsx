import { db } from "@/db";
import { socios } from "@/db/schema";
import { isNull } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SociosPage() {
    const listaSocios = await db
        .select()
        .from(socios)
        .where(isNull(socios.eliminadoEn));

    return (
        <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Socios</h1>
            <Link href="/socios/nuevo">
            <Button>Nuevo socio</Button>
            </Link>
        </div>

        {listaSocios.length === 0 ? (
            <p className="text-muted-foreground">Todavía no hay socios cargados.</p>
        ) : (
            <table className="w-full border-collapse">
            <thead>
                <tr className="border-b text-left">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Apellido</th>
                <th className="py-2 pr-4">DNI</th>
                <th className="py-2 pr-4">Teléfono</th>
                </tr>
            </thead>
            <tbody>
                {listaSocios.map((socio) => (
                <tr key={socio.id} className="border-b">
                    <td className="py-2 pr-4">{socio.nombre}</td>
                    <td className="py-2 pr-4">{socio.apellido}</td>
                    <td className="py-2 pr-4">{socio.dni}</td>
                    <td className="py-2 pr-4">{socio.telefono}</td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    );
}