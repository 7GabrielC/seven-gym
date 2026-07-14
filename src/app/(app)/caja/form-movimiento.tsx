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

export function FormMovimiento() {
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function manejarSubmit(formData: FormData) {
        setError("");
        setCargando(true);
        const resultado = await registrarMovimiento(formData);
        if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        } else {
        setCargando(false);
        // Limpiar el formulario tras registrar con éxito
        const form = document.getElementById("form-mov") as HTMLFormElement;
        form?.reset();
        }
    }

    return (
        <form id="form-mov" action={manejarSubmit} className="space-y-3">
        <div className="space-y-2">
            <Label>Tipo</Label>
            <Select name="tipo" required>
            <SelectTrigger>
                <SelectValue placeholder="Ingreso o egreso" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ingreso">Ingreso (entra plata)</SelectItem>
                <SelectItem value="egreso">Egreso (sale plata)</SelectItem>
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input id="monto" name="monto" type="number" step="0.01" min="0" required />
        </div>

        <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Input id="concepto" name="concepto" placeholder="Ej: artículos de limpieza" required />
        </div>

        {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
            </p>
        )}

        <Button type="submit" disabled={cargando} variant="outline" className="w-full">
            {cargando ? "Registrando..." : "Registrar movimiento"}
        </Button>
        </form>
    );
}