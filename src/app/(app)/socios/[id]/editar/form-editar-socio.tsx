"use client";

import { useState } from "react";
import { editarSocio } from "@/actions/socios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string | null;
  fechaNacimiento: string;
};

export function FormEditarSocio({ socio }: { socio: Socio }) {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(formData: FormData) {
    setError("");
    setCargando(true);
    const resultado = await editarSocio(formData);
    if (resultado?.error) {
      setError(resultado.error);
      setCargando(false);
    }
  }

  return (
    <form action={manejarSubmit} className="space-y-4">
      <input type="hidden" name="id" value={socio.id} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={socio.nombre}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            name="apellido"
            defaultValue={socio.apellido}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" name="dni" defaultValue={socio.dni} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            name="telefono"
            defaultValue={socio.telefono}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email{" "}
          <span className="text-muted-foreground/60 font-normal">
            (opcional)
          </span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={socio.email ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
        <Input
          id="fechaNacimiento"
          name="fechaNacimiento"
          type="date"
          defaultValue={socio.fechaNacimiento}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
