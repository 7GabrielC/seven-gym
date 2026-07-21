import {
  obtenerMetricas,
  sociosPorPlan,
  actividadReciente,
} from "@/lib/dashboard/metricas";
import { serieMensual } from "@/lib/reportes/metricas";
import { requerirSesion } from "@/lib/session";
import { diasHastaVencimiento } from "@/lib/socios/estado";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AreaIngresos, DonutSociosPorPlan } from "./dashboard-graficos";
import {
  Users,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  UserPlus,
  XCircle,
} from "lucide-react";
import { NumeroAnimado } from "@/components/numero-animado";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function horaRelativa(fecha: Date): string {
  const ahora = new Date();
  const esHoy = fecha.toDateString() === ahora.toDateString();
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  const esAyer = fecha.toDateString() === ayer.toDateString();
  const hora = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (esHoy) return `Hoy, ${hora}`;
  if (esAyer) return `Ayer, ${hora}`;
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const session = await requerirSesion();

  const [metricas, planes, actividad, serie] = await Promise.all([
    obtenerMetricas(),
    sociosPorPlan(),
    actividadReciente(5),
    serieMensual(6),
  ]);

  const hoy = new Date();
  const primerNombre = session.user.name.split(" ")[0];

  return (
    <div className="max-w-6xl px-8 py-7">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Buen día, {primerNombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen general del gimnasio
          </p>
        </div>
        <Link href="/pagos/nuevo">
          <Button>Cobrar cuota</Button>
        </Link>
      </div>

      {/* 4 métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] tracking-wider text-accent-violet mb-1.5">
                SOCIOS ACTIVOS
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular">
                <NumeroAnimado valor={metricas.totalActivos} />
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                Con membresía vigente
              </div>
            </div>
            <div className="size-9 rounded-full bg-accent-violet-soft text-accent-violet flex items-center justify-center shrink-0">
              <Users size={17} strokeWidth={1.75} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] tracking-wider text-accent-teal mb-1.5">
                INGRESOS DEL MES
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular">
                <NumeroAnimado
                  valor={metricas.ingresosMesCentavos}
                  formato="pesos"
                />
              </div>
              {metricas.variacionIngresos !== null ? (
                <div
                  className={`text-[11px] mt-1 tabular ${metricas.variacionIngresos >= 0 ? "text-brand-accent" : "text-danger"}`}
                >
                  {metricas.variacionIngresos >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(metricas.variacionIngresos)}% vs mes anterior
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground/60 mt-1">
                  Primer mes con datos
                </div>
              )}
            </div>
            <div className="size-9 rounded-full bg-accent-teal-soft text-accent-teal flex items-center justify-center shrink-0">
              <TrendingUp size={17} strokeWidth={1.75} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] tracking-wider text-accent-sky mb-1.5">
                COBRADO HOY
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular">
                <NumeroAnimado
                  valor={metricas.cobradoHoyCentavos}
                  formato="pesos"
                />
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                {metricas.cantidadPagosHoy === 0
                  ? "Todavía nadie pagó hoy"
                  : `${metricas.cantidadPagosHoy} ${metricas.cantidadPagosHoy === 1 ? "cuota cobrada" : "cuotas cobradas"}`}
              </div>
            </div>
            <div className="size-9 rounded-full bg-accent-sky-soft text-accent-sky flex items-center justify-center shrink-0">
              <CreditCard size={17} strokeWidth={1.75} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-danger/25 bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] tracking-wider text-danger mb-1.5">
                VENCIDOS
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular">
                <NumeroAnimado valor={metricas.vencidos.length} />
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                {metricas.vencidos.length === 0
                  ? "Nadie vencido"
                  : "Esperando renovar"}
              </div>
            </div>
            <div className="size-9 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0">
              <AlertTriangle size={17} strokeWidth={1.75} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-foreground mb-3">
            INGRESOS DE LOS ÚLTIMOS 6 MESES
          </div>
          <AreaIngresos datos={serie} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-foreground mb-3">
            SOCIOS POR PLAN
          </div>
          {planes.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 py-8 text-center">
              Sin socios activos.
            </p>
          ) : (
            <DonutSociosPorPlan datos={planes} />
          )}
        </div>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] tracking-wider text-foreground">
              VENCIMIENTOS PRÓXIMOS
            </span>
            <span className="text-[11px] text-muted-foreground tabular">
              {metricas.porVencer.length}
            </span>
          </div>
          {metricas.porVencer.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 py-2">
              Nadie por vencer esta semana.
            </p>
          ) : (
            <ul>
              {metricas.porVencer.map((s, i) => {
                const dias = diasHastaVencimiento(new Date(s.vencimiento), hoy);
                return (
                  <li
                    key={s.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="animate-entrada grid grid-cols-[1fr_auto_72px] items-center gap-2 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-full bg-warning-soft text-warning flex items-center justify-center shrink-0">
                        <Users size={14} strokeWidth={1.75} />
                      </div>
                      <Link
                        href={`/socios/${s.id}`}
                        className="text-sm hover:text-primary transition-colors truncate"
                      >
                        {s.nombre} {s.apellido}
                      </Link>
                    </div>
                    <span className="rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning tabular whitespace-nowrap">
                      {dias === 0
                        ? "Hoy"
                        : dias === 1
                          ? "1 día"
                          : `${dias} días`}
                    </span>
                    <span className="text-xs text-muted-foreground truncate text-right">
                      {s.plan}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[11px] tracking-wider text-foreground mb-3">
            ACTIVIDAD RECIENTE
          </div>
          {actividad.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 py-2">
              Sin actividad aún.
            </p>
          ) : (
            <ul>
              {actividad.map((a, i) => {
                const estilo =
                  a.tipo === "pago"
                    ? {
                        bg: "bg-success-soft",
                        color: "text-success",
                        Icono: CreditCard,
                      }
                    : a.tipo === "alta"
                      ? {
                          bg: "bg-primary/10",
                          color: "text-primary",
                          Icono: UserPlus,
                        }
                      : {
                          bg: "bg-danger-soft",
                          color: "text-danger",
                          Icono: XCircle,
                        };
                const Icono = estilo.Icono;
                return (
                  <li
                    key={i}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="animate-entrada flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`size-7 rounded-full ${estilo.bg} ${estilo.color} flex items-center justify-center shrink-0`}
                      >
                        <Icono size={14} strokeWidth={1.75} />
                      </div>
                      <span className="text-sm truncate">{a.descripcion}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.monto !== null && (
                        <span
                          className={`text-xs tabular ${a.tipo === "anulacion" ? "text-danger" : "text-success"}`}
                        >
                          {a.tipo === "anulacion" ? "−" : ""}
                          {pesos(a.monto)}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap">
                        {horaRelativa(a.fecha)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
