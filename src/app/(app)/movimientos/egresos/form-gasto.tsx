"use client";

import { useState } from "react";
import { registrarGasto } from "@/actions/gastos";
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

export function FormGasto() {
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(formData: FormData) {
    setError("");
    setExito("");
    setCargando(true);
    const resultado = await registrarGasto(formData);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setExito("Gasto registrado.");
      const form = document.getElementById("form-gasto") as HTMLFormElement;
      form?.reset();
    }
  }

  return (
    <form id="form-gasto" action={manejarSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder="Ej: lavandina y trapos"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select name="categoria" required>
          <SelectTrigger>
            <SelectValue placeholder="Elegí una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="limpieza">Limpieza</SelectItem>
            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            <SelectItem value="servicios">Servicios</SelectItem>
            <SelectItem value="sueldos">Sueldos</SelectItem>
            <SelectItem value="equipamiento">Equipamiento</SelectItem>
            <SelectItem value="otros">Otros</SelectItem>
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
        <Label>Método de pago</Label>
        <Select name="metodo" required>
          <SelectTrigger>
            <SelectValue placeholder="Elegí el método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo (sale de la caja)</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Si es efectivo, se descuenta de tu caja abierta automáticamente.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}
      {exito && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
          {exito}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Registrando..." : "Registrar gasto"}
      </Button>
    </form>
  );
}
