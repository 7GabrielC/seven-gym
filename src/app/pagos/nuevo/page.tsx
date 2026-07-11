import { db } from "@/db";
import { socios, planes } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { FormPago } from "./form-pago";

export default async function NuevoPagoPage() {
    const listaSocios = await db.select().from(socios).where(isNull(socios.eliminadoEn));
    const listaPlanes = await db.select().from(planes);

    return (
        <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-6">Registrar pago</h1>
        <FormPago socios={listaSocios} planes={listaPlanes} />
        </div>
    );
}