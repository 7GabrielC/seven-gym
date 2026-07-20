"use client";

import { useState, useMemo } from "react";
import { registrarPago } from "@/actions/pagos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcularEstadoSocio } from "@/lib/socios/estado";
import { BadgeEstado } from "@/components/badge-estado";
import { BuscadorSocio } from "./buscador-socio";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  vencimiento: string | null;
};
type Plan = { id: number; nombre: string; precioCentavos: number };

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

const etiquetaMetodo: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export function FormPago({
  socios,
  planes,
  socioInicial,
}: {
  socios: Socio[];
  planes: Plan[];
  socioInicial?: number | null;
}) {
  const [socioId, setSocioId] = useState<number | null>(socioInicial ?? null);
  const [planId, setPlanId] = useState("");
  const [metodo, setMetodo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(formData: FormData) {
    setError("");
    setCargando(true);
    const resultado = await registrarPago(formData);
    if (resultado?.error) {
      setError(resultado.error);
      setCargando(false);
    }
  }

  const socioSeleccionado = useMemo(
    () => socios.find((s) => s.id === socioId) ?? null,
    [socioId, socios],
  );
  const planSeleccionado = useMemo(
    () => planes.find((p) => p.id === Number(planId)) ?? null,
    [planId, planes],
  );

  const estadoSocio = socioSeleccionado?.vencimiento
    ? calcularEstadoSocio(new Date(socioSeleccionado.vencimiento), new Date())
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
        <form action={manejarSubmit} className="space-y-4">
          <input type="hidden" name="socioId" value={socioId ?? ""} />

          <div className="space-y-1.5">
            <Label>Socio</Label>
            <BuscadorSocio
              socios={socios}
              value={socioId}
              onChange={setSocioId}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select
              name="planId"
              required
              value={planId}
              onValueChange={(v) => setPlanId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí un plan">
                  {planSeleccionado?.nombre}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {planes.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <span className="flex items-center justify-between w-full gap-4">
                      <span>{p.nombre}</span>
                      <span className="text-muted-foreground tabular">
                        {pesos(p.precioCentavos)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Select
              name="metodo"
              required
              value={metodo}
              onValueChange={(v) => setMetodo(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí el método">
                  {etiquetaMetodo[metodo]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={cargando || !socioId}
          >
            {cargando ? "Registrando..." : "Registrar pago"}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 h-fit">
        <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-4 text-center">
          RESUMEN
        </div>

        {!socioSeleccionado ? (
          <p className="text-sm text-muted-foreground/60 text-center">
            Buscá un socio para ver su estado.
          </p>
        ) : (
          <div className="space-y-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Nombre</div>
              <div className="text-sm font-medium">
                {socioSeleccionado.nombre} {socioSeleccionado.apellido}
              </div>
              <div className="flex justify-center mt-1.5">
                <BadgeEstado
                  estado={estadoSocio}
                  vencimiento={socioSeleccionado.vencimiento}
                />
              </div>
            </div>

            {planSeleccionado && (
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-1">
                  A cobrar
                </div>
                <div className="text-2xl font-semibold tabular">
                  {pesos(planSeleccionado.precioCentavos)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {planSeleccionado.nombre}
                </div>
              </div>
            )}

            {metodo && (
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Método</div>
                <div className="text-sm font-medium">
                  {etiquetaMetodo[metodo]}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
