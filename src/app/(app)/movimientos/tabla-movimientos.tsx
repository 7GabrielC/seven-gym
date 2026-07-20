"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type FilaMovimiento = {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  detalle: string; // plan, categoría, o "otro ingreso"
  socioId: number | null;
  metodo: string;
  monto: number;
  usuario: string;
  creadoEn: Date;
};

function pesos(centavos: number, decimales = 2): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: decimales,
  });
}

function hora(fecha: Date): string {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fechaLarga(iso: string): string {
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MESES = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return `${DIAS[fecha.getUTCDay()]} ${d} ${MESES[m - 1]}`;
}

type Props = {
  filas: FilaMovimiento[];
  color: "success" | "danger";
};

export function TablaMovimientos({ filas, color }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [metodo, setMetodo] = useState<"todos" | "efectivo" | "transferencia">(
    "todos",
  );
  const [diasVisibles, setDiasVisibles] = useState(5);
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());

  function expandirDia(fecha: string) {
    setDiasExpandidos((prev) => new Set(prev).add(fecha));
  }

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return filas.filter((f) => {
      if (metodo !== "todos" && f.metodo !== metodo) return false;
      if (!texto) return true;
      return (
        f.concepto.toLowerCase().includes(texto) ||
        f.detalle.toLowerCase().includes(texto)
      );
    });
  }, [filas, busqueda, metodo]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, FilaMovimiento[]>();
    for (const f of filasFiltradas) {
      const lista = mapa.get(f.fecha) ?? [];
      lista.push(f);
      mapa.set(f.fecha, lista);
    }
    return Array.from(mapa.entries());
  }, [filasFiltradas]);

  const gruposVisibles = grupos.slice(0, diasVisibles);
  const hayMas = grupos.length > diasVisibles;
  const MOVS_POR_DIA = 10;

  const contadores = {
    todos: filas.length,
    efectivo: filas.filter((f) => f.metodo === "efectivo").length,
    transferencia: filas.filter((f) => f.metodo === "transferencia").length,
  };

  const colorTexto = color === "success" ? "text-success" : "text-danger";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por concepto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:max-w-xs rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-1">
          {(["todos", "efectivo", "transferencia"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetodo(m)}
              className={`rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors duration-150 ${
                metodo === m
                  ? "bg-surface-2 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50"
              }`}
            >
              {m === "todos"
                ? "Todos"
                : m === "efectivo"
                  ? "Efectivo"
                  : "Transferencia"}{" "}
              <span className="tabular text-muted-foreground/60">
                {contadores[m]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filasFiltradas.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {filas.length === 0
              ? "Sin movimientos este mes."
              : "Nada coincide con la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {gruposVisibles.map(([fecha, filasDelDia]) => {
            const totalDia = filasDelDia.reduce((t, f) => t + f.monto, 0);
            const expandido = diasExpandidos.has(fecha);
            const filasAMostrar = expandido
              ? filasDelDia
              : filasDelDia.slice(0, MOVS_POR_DIA);
            const ocultas = filasDelDia.length - filasAMostrar.length;

            return (
              <div key={fecha}>
                <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                  <span className="text-xs font-medium text-foreground/80 capitalize">
                    {fechaLarga(fecha)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">
                    {pesos(totalDia, 0)} · {filasDelDia.length}{" "}
                    {filasDelDia.length === 1 ? "mov." : "movs."}
                  </span>
                </div>
                {filasAMostrar.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      {f.socioId ? (
                        <Link
                          href={`/socios/${f.socioId}`}
                          className="text-sm hover:text-primary transition-colors"
                        >
                          {f.concepto}
                        </Link>
                      ) : (
                        <span className="text-sm">{f.concepto}</span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground/60">
                        {f.detalle}
                      </span>
                      <div className="text-[11px] text-muted-foreground/50">
                        {hora(f.creadoEn)} · {f.usuario.split(" ")[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground w-24 text-right">
                        {f.metodo === "efectivo" ? "Efectivo" : "Transferencia"}
                      </span>
                      <span
                        className={`text-sm font-medium tabular w-28 text-right ${colorTexto}`}
                      >
                        {pesos(f.monto)}
                      </span>
                    </div>
                  </div>
                ))}
                {ocultas > 0 && (
                  <button
                    onClick={() => expandirDia(fecha)}
                    className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors border-b border-border/40"
                  >
                    Ver todos ({ocultas} más)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hayMas && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setDiasVisibles((n) => n + 5)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver más días ({grupos.length - diasVisibles} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
