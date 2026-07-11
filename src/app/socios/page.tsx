import { db } from "@/db";
import { socios, suscripciones } from "@/db/schema";
import { isNull, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";

const estilosEstado: Record<EstadoSocio, string> = {
    activo: "bg-green-100 text-green-800",
    por_vencer: "bg-yellow-100 text-yellow-800",
    vencido: "bg-red-100 text-red-800",
    inactivo: "bg-gray-100 text-gray-600",
};

const etiquetasEstado: Record<EstadoSocio, string> = {
    activo: "Activo",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    inactivo: "Inactivo",
};

export default async function SociosPage() {
    const listaSocios = await db
        .select()
        .from(socios)
        .where(isNull(socios.eliminadoEn));

    const hoy = new Date();

    const sociosConEstado = await Promise.all(
        listaSocios.map(async (socio) => {
        const [ultimaSuscripcion] = await db
            .select()
            .from(suscripciones)
            .where(eq(suscripciones.socioId, socio.id))
            .orderBy(desc(suscripciones.hasta))
            .limit(1);

        let estado: EstadoSocio | null = null;
        if (ultimaSuscripcion) {
            estado = calcularEstadoSocio(new Date(ultimaSuscripcion.hasta), hoy);
        }

        return { ...socio, estado };
        })
    );

    return (
        <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Socios</h1>
            <Link href="/socios/nuevo">
            <Button>Nuevo socio</Button>
            </Link>
        </div>

        {sociosConEstado.length === 0 ? (
            <p className="text-muted-foreground">Todavía no hay socios cargados.</p>
        ) : (
            <table className="w-full border-collapse">
            <thead>
                <tr className="border-b text-left">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Apellido</th>
                <th className="py-2 pr-4">DNI</th>
                <th className="py-2 pr-4">Teléfono</th>
                <th className="py-2 pr-4">Estado</th>
                </tr>
            </thead>
            <tbody>
                {sociosConEstado.map((socio) => (
                <tr key={socio.id} className="border-b">
                    <td className="py-2 pr-4">
                        <Link href={`/socios/${socio.id}`} className="text-blue-600 hover:underline">
                            {socio.nombre}
                        </Link>
                    </td>
                    <td className="py-2 pr-4">{socio.apellido}</td>
                    <td className="py-2 pr-4">{socio.dni}</td>
                    <td className="py-2 pr-4">{socio.telefono}</td>
                    <td className="py-2 pr-4">
                    {socio.estado ? (
                        <span
                        className={`px-2 py-1 rounded text-xs font-medium ${estilosEstado[socio.estado]}`}
                        >
                        {etiquetasEstado[socio.estado]}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Sin plan</span>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    );
}