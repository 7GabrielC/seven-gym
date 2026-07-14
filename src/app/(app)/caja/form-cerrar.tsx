"use client";

import { useState } from "react";
import { cerrarCaja } from "@/actions/caja";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FormCerrarCaja({ esperado }: { esperado: number }) {
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [declarado, setDeclarado] = useState("");

    const declaradoCentavos = Math.round(Number(declarado) * 100);
    const diferencia = declarado === "" ? null : declaradoCentavos - esperado;

    function pesos(centavos: number): string {
        return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        });
    }

    async function manejarSubmit(formData: FormData) {
        setError("");
        setCargando(true);
        const resultado = await cerrarCaja(formData);
        if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        }
    }

    return (
        <form action={manejarSubmit} className="space-y-4">
        <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Efectivo esperado en caja</p>
            <p className="text-xl font-bold">{pesos(esperado)}</p>
        </div>

        <div className="space-y-2">
            <Label htmlFor="montoDeclarado">Efectivo real contado</Label>
            <Input
            id="montoDeclarado"
            name="montoDeclarado"
            type="number"
            step="0.01"
            min="0"
            value={declarado}
            onChange={(e) => setDeclarado(e.target.value)}
            placeholder="Contá el efectivo del cajón"
            required
            />
        </div>

        {diferencia !== null && (
            <div
            className={`rounded-lg p-3 text-sm ${
                diferencia === 0
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-yellow-50 text-yellow-800 border border-yellow-200"
            }`}
            >
            {diferencia === 0 ? (
                <span>La caja cuadra perfecto.</span>
            ) : (
                <span>
                Diferencia: {pesos(diferencia)}{" "}
                {diferencia > 0 ? "(sobra)" : "(falta)"}
                </span>
            )}
            </div>
        )}

        {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
            </p>
        )}

        <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? "Cerrando..." : "Cerrar caja"}
        </Button>
        </form>
    );
}