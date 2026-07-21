"use client";

import { useState } from "react";
import { cerrarCaja } from "@/actions/caja";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FormCerrarCaja({ esperado }: { esperado: number }) {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [declarado, setDeclarado] = useState("");

  const declaradoCentavos = Math.round(Number(declarado) * 100);
  const diferencia = declarado === "" ? null : declaradoCentavos - esperado;

  function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
    });
  }

  async function manejarSubmit(formData: FormData) {
    setError("");
    setCargando(true);
    const resultado = await cerrarCaja(formData);
    if (resultado?.error) {
      setError(resultado.error);
      setCargando(false);
    }
  }

  return (
    <form action={manejarSubmit} className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <p className="text-sm text-muted-foreground">Efectivo esperado en caja</p>
        <p className="text-xl font-semibold tabular">{pesos(esperado)}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="montoDeclarado">Efectivo real contado</Label>
        <Input
          id="montoDeclarado"
          name="montoDeclarado"
          type="number"
          step="0.01"
          min="0"
          value={declarado}
          onChange={(e) => setDeclarado(e.target.value)}
          placeholder="Contá el efectivo del cajón"
          required
        />
      </div>

      {diferencia !== null && (
        <div
          className={`rounded-lg p-3 text-sm border ${
            diferencia === 0
              ? "bg-success-soft text-success border-success/25"
              : "bg-warning-soft text-warning border-warning/25"
          }`}
        >
          {diferencia === 0 ? (
            <span>La caja cuadra perfecto.</span>
          ) : (
            <span>
              Diferencia: {pesos(Math.abs(diferencia))}{" "}
              {diferencia > 0 ? "(sobra)" : "(falta)"}
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md p-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Cerrando..." : "Cerrar caja"}
      </Button>
    </form>
  );
}