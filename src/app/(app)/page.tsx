import { obtenerMetricas } from "@/lib/dashboard/metricas";
import { requerirSesion } from "@/lib/session";
import { diasHastaVencimiento } from "@/lib/socios/estado";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default async function DashboardPage() {
  const session = await requerirSesion();

  const metricas = await obtenerMetricas();

  const hoy = new Date();
  const fecha = `${DIAS[hoy.getDay()]} ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;
  const primerNombre = session.user.name.split(" ")[0];

  return (
    <div className="max-w-6xl px-8 py-7">

      {/* Saludo */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Buen día, {primerNombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{fecha}</p>
        </div>
        <Link href="/pagos/nuevo">
          <Button>Cobrar cuota</Button>
        </Link>
      </div>

      {/* Listas de acción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] tracking-wider text-warning">
              POR VENCER
            </span>
            <span className="text-[11px] text-muted-foreground tabular">
              {metricas.porVencer.length}
            </span>
          </div>
          {metricas.porVencer.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 py-1">
              Nadie por vencer esta semana.
            </p>
          ) : (
            <ul>
              {metricas.porVencer.map((s) => {
                const dias = diasHastaVencimiento(new Date(s.vencimiento), hoy);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                  >
                    <Link
                      href={`/socios/${s.id}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {s.nombre} {s.apellido}
                    </Link>
                    <span className="rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning tabular">
                      {dias === 0 ? "Vence hoy" : dias === 1 ? "1 día" : `${dias} días`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] tracking-wider text-danger">VENCIDOS</span>
            <span className="text-[11px] text-muted-foreground tabular">
              {metricas.vencidos.length}
            </span>
          </div>
          {metricas.vencidos.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 py-1">Nadie vencido.</p>
          ) : (
            <ul>
              {metricas.vencidos.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                >
                  <Link
                    href={`/socios/${s.id}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {s.nombre} {s.apellido}
                  </Link>
                  <span className="text-xs text-muted-foreground tabular">
                    {s.telefono}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            SOCIOS ACTIVOS
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular">
            {metricas.totalActivos}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            INGRESOS DEL MES
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular">
            {pesos(metricas.ingresosMesCentavos)}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5">
            COBRADO HOY
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular">
            {pesos(metricas.cobradoHoyCentavos)}
          </div>
          <div className="text-[11px] text-muted-foreground/60 mt-1 tabular">
            {metricas.cantidadPagosHoy}{" "}
            {metricas.cantidadPagosHoy === 1 ? "cuota" : "cuotas"}
          </div>
        </div>
      </div>
    </div>
  );
}