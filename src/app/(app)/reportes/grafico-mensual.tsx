"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Punto = {
  etiqueta: string;
  ingresos: number;
  egresos: number;
  resultado: number;
};

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

function TooltipPersonalizado({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const valor = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0;
  const resultado = valor("resultado");

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-1.5 capitalize">
        {label}
      </div>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Ingresos</span>
          <span className="tabular text-success">
            {pesosCompleto(valor("ingresos"))}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Egresos</span>
          <span className="tabular text-danger">
            {pesosCompleto(valor("egresos"))}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-border/50">
          <span className="text-muted-foreground">Resultado</span>
          <span
            className={`tabular font-medium ${
              resultado >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {pesosCompleto(resultado)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function GraficoMensual({ datos }: { datos: Punto[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={datos}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        >
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
            width={48}
          />
          <Tooltip
            content={<TooltipPersonalizado />}
            cursor={{ fill: "var(--surface-2)" }}
          />
          <Bar
            dataKey="ingresos"
            fill="var(--success)"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="egresos"
            fill="var(--danger)"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Line
            dataKey="resultado"
            stroke="var(--brand-accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--brand-accent)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
