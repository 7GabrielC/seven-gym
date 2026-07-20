"use client";

import { useState } from "react";
import { crearUsuario } from "@/actions/usuarios";
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

export function FormUsuario() {
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);
  const [rol, setRol] = useState("recepcionista");

  async function manejarSubmit(formData: FormData) {
    setError("");
    setExito("");
    setCargando(true);
    const resultado = await crearUsuario(formData);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setExito("Usuario creado correctamente.");
      const form = document.getElementById("form-usuario") as HTMLFormElement;
      form?.reset();
      setRol("recepcionista");
    }
  }

  return (
    <form id="form-usuario" action={manejarSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Rol</Label>
        <Select
          name="rol"
          value={rol}
          onValueChange={(v) => setRol(v ?? "recepcionista")}
          required
        >
          <SelectTrigger>
            <SelectValue>
              {rol === "dueño" ? "Dueño" : "Recepcionista"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recepcionista">Recepcionista</SelectItem>
            <SelectItem value="dueño">Dueño</SelectItem>
          </SelectContent>
        </Select>
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
        {cargando ? "Creando..." : "Crear usuario"}
      </Button>
    </form>
  );
}
