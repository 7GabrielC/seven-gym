"use client";

import { useState } from "react";
import { cambiarPrecio, alternarActivo } from "@/actions/planes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Precio = { precioCentavos: number; vigenteDesde: string };

type Props = {
  id: number;
  nombre: string;
  duracionValor: number;
  duracionUnidad: string;
  activo: boolean;
  usoUnico: boolean;
  precioActual: number | null;
  historial: Precio[];
};

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

export function FilaPlan(plan: Props) {
  const [editando, setEditando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  const [precio, setPrecio] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function guardarPrecio() {
    setError("");
    setCargando(true);
    const fd = new FormData();
    fd.append("planId", String(plan.id));
    fd.append("precio", precio);
    const res = await cambiarPrecio(fd);
    setCargando(false);
    if ("error" in res) {
      setError(res.error);
    } else {
      setEditando(false);
      setPrecio("");
      toast.success(`Precio de ${plan.nombre} actualizado`);
    }
  }

  async function toggleActivo() {
    setCargando(true);
    const fd = new FormData();
    fd.append("planId", String(plan.id));
    await alternarActivo(fd);
    setCargando(false);
    toast.success(plan.activo ? `${plan.nombre} desactivado` : `${plan.nombre} activado`);
  }

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 transition-opacity duration-150 ${
        !plan.activo ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{plan.nombre}</h3>
            {!plan.activo && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Inactivo
              </span>
            )}
            {plan.usoUnico && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Uso único
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.duracionValor}{" "}
            {plan.duracionUnidad === "mes"
              ? plan.duracionValor === 1
                ? "mes"
                : "meses"
              : "días"}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl font-semibold tabular">
            {plan.precioActual !== null
              ? pesos(plan.precioActual)
              : "Sin precio"}
          </p>
          <button
            onClick={() => setVerHistorial(!verHistorial)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {verHistorial ? "Ocultar" : "Ver"} historial (
            {plan.historial.length})
          </button>
        </div>
      </div>

      {verHistorial && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <ul className="space-y-1">
            {plan.historial.map((p, i) => (
              <li
                key={i}
                className="flex justify-between text-xs text-muted-foreground"
              >
                <span>Desde {p.vigenteDesde}</span>
                <span className="tabular">{pesos(p.precioCentavos)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border/50">
        {editando ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Nuevo precio"
                className="max-w-40"
              />
              <Button
                size="sm"
                onClick={guardarPrecio}
                disabled={cargando || !precio}
              >
                {cargando ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditando(false);
                  setError("");
                }}
              >
                Cancelar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Rige desde hoy. El precio anterior queda en el historial.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditando(true)}
            >
              Cambiar precio
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleActivo}
              disabled={cargando}
            >
              {plan.activo ? "Desactivar" : "Activar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
