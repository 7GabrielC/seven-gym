"use client";

import { useState } from "react";
import { abrirCaja } from "@/actions/caja";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FormAbrirCaja() {
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function manejarSubmit(formData: FormData) {
        setError("");
        setCargando(true);
        const resultado = await abrirCaja(formData);
        if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        }
    }

    return (
        <form action={manejarSubmit} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="montoApertura">Efectivo inicial en caja</Label>
            <Input
            id="montoApertura"
            name="montoApertura"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            required
            />
            <p className="text-xs text-gray-500">
            Contá el efectivo con el que arrancás el turno.
            </p>
        </div>

        {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
            </p>
        )}

        <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Abriendo..." : "Abrir caja"}
        </Button>
        </form>
    );
}