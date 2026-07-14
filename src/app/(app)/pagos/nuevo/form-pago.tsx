"use client";

import { useState } from "react";
import { registrarPago } from "@/actions/pagos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Socio = { id: number; nombre: string; apellido: string };
type Plan = { id: number; nombre: string };

export function FormPago({ socios, planes }: { socios: Socio[]; planes: Plan[] }) {
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function manejarSubmit(formData: FormData) {
        setError("");
        setCargando(true);
        const resultado = await registrarPago(formData);
        // Si la acción redirige (éxito), este código no se ejecuta.
        // Solo llega acá si devolvió un error.
        if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        }
    }

    return (
        <form action={manejarSubmit} className="space-y-4">
        <div className="space-y-2">
            <Label>Socio</Label>
            <Select name="socioId" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí un socio" />
            </SelectTrigger>
            <SelectContent>
                {socios.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre} {s.apellido}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label>Plan</Label>
            <Select name="planId" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí un plan" />
            </SelectTrigger>
            <SelectContent>
                {planes.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select name="metodo" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí el método" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
            </SelectContent>
            </Select>
        </div>

        {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
            </p>
        )}

        <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Registrando..." : "Registrar pago"}
        </Button>
        </form>
    );
}