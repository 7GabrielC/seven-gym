"use client";

import { useState } from "react";
import { cambiarPrecio, alternarActivo } from "@/actions/planes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Precio = { precioCentavos: number; vigenteDesde: string };

type Props = {
    id: number;
    nombre: string;
    duracionValor: number;
    duracionUnidad: string;
    activo: boolean;
    usoUnico: boolean;
    precioActual: number | null;
    historial: Precio[];
};

function pesos(centavos: number): string {
    return (centavos / 100).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
    });
}

export function FilaPlan(plan: Props) {
    const [editando, setEditando] = useState(false);
    const [verHistorial, setVerHistorial] = useState(false);
    const [precio, setPrecio] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function guardarPrecio() {
        setError("");
        setCargando(true);
        const fd = new FormData();
        fd.append("planId", String(plan.id));
        fd.append("precio", precio);
        const res = await cambiarPrecio(fd);
        setCargando(false);
        if ("error" in res) setError(res.error);
        else {
        setEditando(false);
        setPrecio("");
        }
    }

    async function toggleActivo() {
        setCargando(true);
        const fd = new FormData();
        fd.append("planId", String(plan.id));
        await alternarActivo(fd);
        setCargando(false);
    }

    return (
        <div className={`border rounded-lg p-4 ${!plan.activo ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-4">
            <div>
            <div className="flex items-center gap-2">
                <h3 className="font-semibold">{plan.nombre}</h3>
                {!plan.activo && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    Inactivo
                </span>
                )}
                {plan.usoUnico && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    Uso único
                </span>
                )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
                Duración: {plan.duracionValor}{" "}
                {plan.duracionUnidad === "mes"
                ? plan.duracionValor === 1
                    ? "mes"
                    : "meses"
                : "días"}
            </p>
            </div>

            <div className="text-right">
            <p className="text-xl font-bold">
                {plan.precioActual !== null ? pesos(plan.precioActual) : "Sin precio"}
            </p>
            <button
                onClick={() => setVerHistorial(!verHistorial)}
                className="text-xs text-blue-600 hover:underline"
            >
                {verHistorial ? "Ocultar" : "Ver"} historial ({plan.historial.length})
            </button>
            </div>
        </div>

        {verHistorial && (
            <div className="mt-3 pt-3 border-t">
            <ul className="space-y-1">
                {plan.historial.map((p, i) => (
                <li key={i} className="flex justify-between text-xs text-gray-600">
                    <span>Desde {p.vigenteDesde}</span>
                    <span>{pesos(p.precioCentavos)}</span>
                </li>
                ))}
            </ul>
            </div>
        )}

        <div className="mt-4 pt-3 border-t">
            {editando ? (
            <div className="space-y-2">
                <div className="flex gap-2">
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="Nuevo precio"
                    className="max-w-40"
                />
                <Button size="sm" onClick={guardarPrecio} disabled={cargando || !precio}>
                    {cargando ? "Guardando..." : "Guardar"}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                    setEditando(false);
                    setError("");
                    }}
                >
                    Cancelar
                </Button>
                </div>
                <p className="text-xs text-gray-500">
                Rige desde hoy. El precio anterior queda en el historial.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            ) : (
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                Cambiar precio
                </Button>
                <Button
                size="sm"
                variant="ghost"
                onClick={toggleActivo}
                disabled={cargando}
                >
                {plan.activo ? "Desactivar" : "Activar"}
                </Button>
            </div>
            )}
        </div>
        </div>
    );
}