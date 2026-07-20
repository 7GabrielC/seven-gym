"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type PuntoMensual = { etiqueta: string; ingresos: number };

function pesosCorto(centavos: number): string {
  const pesos = centavos / 100;
  if (Math.abs(pesos) >= 1_000_000) return `${(pesos / 1_000_000).toFixed(1)}M`;
  if (Math.abs(pesos) >= 1_000) return `${Math.round(pesos / 1_000)}k`;
  return String(Math.round(pesos));
}

function pesosCompleto(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function TooltipArea({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="text-[11px] text-muted-foreground/70 mb-1 capitalize">
        {label}
      </div>
      <div className="text-sm font-medium tabular text-success">
        {pesosCompleto(payload[0].value)}
      </div>
    </div>
  );
}

export function AreaIngresos({ datos }: { datos: PuntoMensual[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={datos}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <defs>
            <linearGradient id="degradadoIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="etiqueta"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={pesosCorto}
            width={44}
          />
          <Tooltip
            content={<TooltipArea />}
            cursor={{ stroke: "var(--border)" }}
          />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#degradadoIngresos)"
            dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type Plan = { plan: string; cantidad: number };

const ESCALA_AZUL = ["#0b00e0", "#3d2eff", "#6c5fff", "#9a91ff", "#c7c2ff"];

export function DonutSociosPorPlan({ datos }: { datos: Plan[] }) {
  const total = datos.reduce((t, p) => t + p.cantidad, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="cantidad"
              nameKey="plan"
              innerRadius={44}
              outerRadius={64}
              paddingAngle={2}
              strokeWidth={0}
            >
              {datos.map((_, i) => (
                <Cell key={i} fill={ESCALA_AZUL[i % ESCALA_AZUL.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold tracking-tight tabular">
            {total}
          </span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
      </div>

      <ul className="space-y-2 flex-1 min-w-0">
        {datos.map((p, i) => {
          const pct = total > 0 ? Math.round((p.cantidad / total) * 100) : 0;
          return (
            <li key={p.plan} className="flex items-center gap-2 text-sm">
              <span
                className="size-2 rounded-sm shrink-0"
                style={{ background: ESCALA_AZUL[i % ESCALA_AZUL.length] }}
              />
              <span className="truncate flex-1">{p.plan}</span>
              <span className="text-muted-foreground tabular text-xs">
                {p.cantidad} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
