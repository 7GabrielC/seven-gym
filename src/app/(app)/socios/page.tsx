import { db } from "@/db";
import { socios, suscripciones } from "@/db/schema";
import { isNull, eq, and, max } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";
import { TablaSocios } from "./tabla-socios";
import { medir } from "@/lib/perf";

export default async function SociosPage() {
    const sociosConEstado = await medir("socios: lista completa", async () => {
        // UNA sola consulta: cada socio con el vencimiento más lejano
        // de sus suscripciones vigentes (no anuladas).
        const filas = await db
        .select({
            id: socios.id,
            nombre: socios.nombre,
            apellido: socios.apellido,
            dni: socios.dni,
            telefono: socios.telefono,
            email: socios.email,
            vencimiento: max(suscripciones.hasta),
        })
        .from(socios)
        .leftJoin(
            suscripciones,
            and(
            eq(suscripciones.socioId, socios.id),
            isNull(suscripciones.eliminadoEn)
            )
        )
        .where(isNull(socios.eliminadoEn))
        .groupBy(socios.id)
        .orderBy(socios.apellido, socios.nombre);

        const hoy = new Date();

        // El estado se calcula en memoria, sin tocar la base
        return filas.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        apellido: f.apellido,
        dni: f.dni,
        telefono: f.telefono,
        email: f.email,
        vencimiento: f.vencimiento,
        estado: f.vencimiento
            ? calcularEstadoSocio(new Date(f.vencimiento), hoy)
            : (null as EstadoSocio | null),
        }));
    });

        return (
        <div className="max-w-6xl px-8 py-7">
        <div className="flex items-center justify-between mb-6">
            <div>
            <h1 className="text-2xl font-semibold tracking-tight">Socios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
                {sociosConEstado.length} en total
            </p>
            <Link
            href="/socios/baja"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
                Ver dados de baja →
            </Link>
            </div>
            <Link href="/socios/nuevo">
            <Button>Nuevo socio</Button>
            </Link>
        </div>

        <TablaSocios socios={sociosConEstado} />
        </div>
    );
}