import { db } from "@/db";
import { socios, planes } from "@/db/schema";
import { isNull, eq } from "drizzle-orm";
import { FormPago } from "./form-pago";
import { requerirSesion } from "@/lib/session";

export default async function NuevoPagoPage() {
    await requerirSesion();
    const listaSocios = await db.select().from(socios).where(isNull(socios.eliminadoEn));
    const listaPlanes = await db.select().from(planes).where(eq(planes.activo, true));

    return (
        <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Registrar pago</h1>
        <FormPago socios={listaSocios} planes={listaPlanes} />
        </div>
    );
}