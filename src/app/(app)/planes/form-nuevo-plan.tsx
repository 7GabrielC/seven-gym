"use client";

import { useState } from "react";
import { crearPlan } from "@/actions/planes";
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

export function FormNuevoPlan() {
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);
  const [unidad, setUnidad] = useState("mes");
  const [unico, setUnico] = useState("no");

  async function manejarSubmit(formData: FormData) {
    setError("");
    setExito("");
    setCargando(true);
    const resultado = await crearPlan(formData);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setExito("Plan creado correctamente.");
      const form = document.getElementById("form-plan") as HTMLFormElement;
      form?.reset();
      setUnidad("mes");
      setUnico("no");
    }
  }

  return (
    <form id="form-plan" action={manejarSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre del plan</Label>
        <Input id="nombre" name="nombre" placeholder="Ej: Semestral" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="duracionValor">Duración</Label>
          <Input
            id="duracionValor"
            name="duracionValor"
            type="number"
            min="1"
            placeholder="6"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Unidad</Label>
          <Select
            name="duracionUnidad"
            value={unidad}
            onValueChange={(v) => setUnidad(v ?? "mes")}
            required
          >
            <SelectTrigger>
              <SelectValue>{unidad === "mes" ? "Meses" : "Días"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Meses</SelectItem>
              <SelectItem value="dia">Días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="precio">Precio inicial</Label>
        <Input
          id="precio"
          name="precio"
          type="number"
          step="0.01"
          min="0"
          placeholder="150000"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>¿Uso único por socio?</Label>
        <Select
          name="usoUnico"
          value={unico}
          onValueChange={(v) => setUnico(v ?? "no")}
          required
        >
          <SelectTrigger>
            <SelectValue>
              {unico === "no"
                ? "No, se puede repetir"
                : "Sí, una vez por socio"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">No, se puede repetir</SelectItem>
            <SelectItem value="si">Sí, una vez por socio</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Como el plan Bienvenida: cada socio puede contratarlo una sola vez.
        </p>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {exito && (
        <p className="text-sm text-success bg-success-soft border border-success/25 rounded-md px-3 py-2">
          {exito}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Creando..." : "Crear plan"}
      </Button>
    </form>
  );
}
