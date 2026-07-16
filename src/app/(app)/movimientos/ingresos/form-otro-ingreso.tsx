"use client";

import { useState } from "react";
import { registrarOtroIngreso } from "@/actions/ingresos";
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

export function FormOtroIngreso() {
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [cargando, setCargando] = useState(false);

    async function manejarSubmit(formData: FormData) {
        setError("");
        setExito("");
        setCargando(true);
        const resultado = await registrarOtroIngreso(formData);
        setCargando(false);
        if ("error" in resultado) setError(resultado.error);
        else {
        setExito("Ingreso registrado.");
        const form = document.getElementById("form-otro-ingreso") as HTMLFormElement;
        form?.reset();
        }
    }

    return (
        <form id="form-otro-ingreso" action={manejarSubmit} className="space-y-3">
        <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
            id="descripcion"
            name="descripcion"
            placeholder="Ej: venta de botella de agua"
            required
            />
        </div>

        <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input id="monto" name="monto" type="number" step="0.01" min="0" required />
        </div>

        <div className="space-y-2">
            <Label>Método</Label>
            <Select name="metodo" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí el método" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="efectivo">Efectivo (entra a la caja)</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
            </SelectContent>
            </Select>
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

        <Button type="submit" variant="outline" className="w-full" disabled={cargando}>
            {cargando ? "Registrando..." : "Registrar otro ingreso"}
        </Button>
        </form>
    );
}