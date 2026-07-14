import { db } from "@/db";
import { socios, suscripciones } from "@/db/schema";
import { isNull, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";
import { TablaSocios } from "./tabla-socios";
import { requerirSesion } from "@/lib/session";

export default async function SociosPage() {
    await requerirSesion();
    const listaSocios = await db.select().from(socios).where(isNull(socios.eliminadoEn));
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

        return {
            id: socio.id,
            nombre: socio.nombre,
            apellido: socio.apellido,
            dni: socio.dni,
            telefono: socio.telefono,
            email: socio.email,
            estado,
        };
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

        <TablaSocios socios={sociosConEstado} />
        </div>
    );
}