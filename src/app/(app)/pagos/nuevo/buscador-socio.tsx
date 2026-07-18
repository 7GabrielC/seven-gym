"use client";

import { useState, useRef, useEffect } from "react";
import { calcularEstadoSocio, type EstadoSocio } from "@/lib/socios/estado";

type SocioOpcion = {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    vencimiento: string | null;
};

const colorPunto: Record<string, string> = {
    activo: "bg-success",
    por_vencer: "bg-warning",
    vencido: "bg-danger",
};

export function BuscadorSocio({
    socios,
    value,
    onChange,
}: {
    socios: SocioOpcion[];
    value: number | null;
    onChange: (id: number | null) => void;
}) {
    const [texto, setTexto] = useState("");
    const [abierto, setAbierto] = useState(false);
    const [resaltado, setResaltado] = useState(0);
    const contenedorRef = useRef<HTMLDivElement>(null);

    const seleccionado = socios.find((s) => s.id === value) ?? null;

    // Cerrar al hacer clic afuera
    useEffect(() => {
        function manejarClickAfuera(e: MouseEvent) {
        if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
            setAbierto(false);
        }
        }
        document.addEventListener("mousedown", manejarClickAfuera);
        return () => document.removeEventListener("mousedown", manejarClickAfuera);
    }, []);

    const query = texto.trim().toLowerCase();
    const resultados =
        query.length === 0
        ? []
        : socios
            .filter(
                (s) =>
                `${s.nombre} ${s.apellido}`.toLowerCase().includes(query) ||
                s.dni.includes(query)
            )
            .slice(0, 8);

    function elegir(socio: SocioOpcion) {
        onChange(socio.id);
        setTexto("");
        setAbierto(false);
    }

    function quitar() {
        onChange(null);
        setTexto("");
    }

    function manejarTeclado(e: React.KeyboardEvent) {
        if (!abierto || resultados.length === 0) return;
        if (e.key === "ArrowDown") {
        e.preventDefault();
        setResaltado((i) => Math.min(i + 1, resultados.length - 1));
        } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setResaltado((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
        e.preventDefault();
        elegir(resultados[resaltado]);
        } else if (e.key === "Escape") {
        setAbierto(false);
        }
    }

    // Si ya hay un socio elegido, mostramos su tarjeta en vez del input
    if (seleccionado) {
        const estado: EstadoSocio | null = seleccionado.vencimiento
        ? calcularEstadoSocio(new Date(seleccionado.vencimiento), new Date())
        : null;

        return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
            <span
                className={`size-2 rounded-full shrink-0 ${
                estado ? colorPunto[estado] : "bg-muted-foreground/40"
                }`}
            />
            <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                {seleccionado.nombre} {seleccionado.apellido}
                </div>
                <div className="text-xs text-muted-foreground tabular">{seleccionado.dni}</div>
            </div>
            </div>
            <button
            type="button"
            onClick={quitar}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
            Cambiar
            </button>
        </div>
        );
    }

    return (
        <div ref={contenedorRef} className="relative">
        <input
            type="text"
            value={texto}
            onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setResaltado(0);
            }}
            onFocus={() => setAbierto(true)}
            onKeyDown={manejarTeclado}
            placeholder="Buscar por nombre o DNI..."
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {abierto && query.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-72 overflow-y-auto">
            {resultados.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">Sin resultados.</p>
            ) : (
                resultados.map((s, i) => {
                const estado: EstadoSocio | null = s.vencimiento
                    ? calcularEstadoSocio(new Date(s.vencimiento), new Date())
                    : null;
                return (
                    <button
                    key={s.id}
                    type="button"
                    onClick={() => elegir(s)}
                    onMouseEnter={() => setResaltado(i)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        i === resaltado ? "bg-surface-2" : ""
                    }`}
                    >
                    <span
                        className={`size-2 rounded-full shrink-0 ${
                        estado ? colorPunto[estado] : "bg-muted-foreground/40"
                        }`}
                    />
                    <span className="text-sm">
                        {s.nombre} {s.apellido}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto tabular">
                        {s.dni}
                    </span>
                    </button>
                );
                })
            )}
            </div>
        )}
        </div>
    );
}