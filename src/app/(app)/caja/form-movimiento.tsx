"use client";

import { useState } from "react";
import { registrarMovimiento } from "@/actions/caja";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FormAjuste() {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(formData: FormData) {
    setError("");
    setCargando(true);
    const resultado = await registrarMovimiento(formData);
    setCargando(false);
    if (resultado?.error) {
      setError(resultado.error);
    } else {
      const form = document.getElementById("form-ajuste") as HTMLFormElement;
      form?.reset();
      setAbierto(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
      >
        Registrar un ajuste de caja
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm">Ajuste de caja</h3>
          <p className="text-xs text-gray-500 mt-1">
            Solo para correcciones excepcionales. Los ingresos y gastos normales
            se registran en Movimientos.
          </p>
        </div>
        <button
          onClick={() => {
            setAbierto(false);
            setError("");
          }}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>

      <form id="form-ajuste" action={manejarSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select name="tipo" required>
            <SelectTrigger>
              <SelectValue placeholder="Ingreso o egreso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ingreso">Ingreso (suma al cajón)</SelectItem>
              <SelectItem value="egreso">Egreso (resta del cajón)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto">Monto</Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="concepto">Motivo del ajuste</Label>
          <Input
            id="concepto"
            name="concepto"
            placeholder="Ej: corrección de pago cargado el lunes"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        <Button type="submit" size="sm" variant="outline" disabled={cargando}>
          {cargando ? "Registrando..." : "Registrar ajuste"}
        </Button>
      </form>
    </div>
  );
}
