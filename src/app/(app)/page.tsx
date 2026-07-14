import { obtenerMetricas } from "@/lib/dashboard/metricas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requerirSesion } from "@/lib/session";


function formatearPesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export default async function DashboardPage() {
  const session = await requerirSesion();
  const metricas = await obtenerMetricas();

  return (
    <div className="max-w-5xl mx-auto p-8">

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Seven</h1>
        <div className="flex gap-2">
          <Link href="/socios">
            <Button variant="outline">Socios</Button>
          </Link>
          <Link href="/pagos/nuevo">
            <Button>Registrar pago</Button>
          </Link>
        </div>
      </div>

      {/* Bloque 1: Qué hacer hoy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <h2 className="text-sm font-medium text-yellow-700 mb-3">
            Por vencer esta semana ({metricas.porVencer.length})
          </h2>
          {metricas.porVencer.length === 0 ? (
            <p className="text-sm text-gray-400">Nadie por vencer.</p>
          ) : (
            <ul className="space-y-2">
              {metricas.porVencer.map((s) => (
                <li key={s.id} className="flex justify-between text-sm">
                  <Link href={`/socios/${s.id}`} className="text-blue-600 hover:underline">
                    {s.nombre} {s.apellido}
                  </Link>
                  <span className="text-gray-500">vence {s.vencimiento}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-sm font-medium text-red-700 mb-3">
            Vencidos recuperables ({metricas.vencidos.length})
          </h2>
          {metricas.vencidos.length === 0 ? (
            <p className="text-sm text-gray-400">Nadie vencido.</p>
          ) : (
            <ul className="space-y-2">
              {metricas.vencidos.map((s) => (
                <li key={s.id} className="flex justify-between text-sm">
                  <Link href={`/socios/${s.id}`} className="text-blue-600 hover:underline">
                    {s.nombre} {s.apellido}
                  </Link>
                  <span className="text-gray-500">{s.telefono}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bloque 2: Números */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Socios activos</p>
          <p className="text-2xl font-bold">{metricas.totalActivos}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Ingresos del mes</p>
          <p className="text-2xl font-bold">
            {formatearPesos(metricas.ingresosMesCentavos)}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Cobrado hoy</p>
          <p className="text-2xl font-bold">
            {formatearPesos(metricas.cobradoHoyCentavos)}
          </p>
          <p className="text-xs text-gray-400">{metricas.cantidadPagosHoy} pagos</p>
        </div>
      </div>
    </div>
  );
}