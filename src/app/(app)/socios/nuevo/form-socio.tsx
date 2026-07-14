"use client";

import { useState } from "react";
import { crearSocio } from "@/actions/socios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FormSocio() {
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function manejarSubmit(formData: FormData) {
        setError("");
        setCargando(true);
        const resultado = await crearSocio(formData);
        if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        }
    }

    return (
        <form action={manejarSubmit} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required />
        </div>

        <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" required />
        </div>

        <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" name="dni" required />
        </div>

        <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" required />
        </div>

        <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input id="email" name="email" type="email" />
        </div>

        <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input id="fechaNacimiento" name="fechaNacimiento" type="date" required />
        </div>

        {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
            </p>
        )}

        <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Guardando..." : "Guardar socio"}
        </Button>
        </form>
    );
}