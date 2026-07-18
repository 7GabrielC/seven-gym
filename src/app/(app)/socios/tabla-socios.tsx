"use client";

import { useState } from "react";
import Link from "next/link";
import { type EstadoSocio } from "@/lib/socios/estado";
import { Input } from "@/components/ui/input";
import { BadgeEstado } from "@/components/badge-estado";

type SocioFila = {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    email: string | null;
    vencimiento: string | null;
    estado: EstadoSocio | null;
};

type Filtro = "todos" | "por_vencer" | "vencido" | "sin_plan";

const POR_PAGINA = 15;

export function TablaSocios({ socios }: { socios: SocioFila[] }) {
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("todos");
    const [pagina, setPagina] = useState(1);

    const contadores = {
        todos: socios.length,
        por_vencer: socios.filter((s) => s.estado === "por_vencer").length,
        vencido: socios.filter((s) => s.estado === "vencido").length,
        sin_plan: socios.filter((s) => s.estado === null).length,
    };

    const sociosFiltrados = socios.filter((socio) => {
        if (filtro === "por_vencer" && socio.estado !== "por_vencer") return false;
        if (filtro === "vencido" && socio.estado !== "vencido") return false;
        if (filtro === "sin_plan" && socio.estado !== null) return false;

        const texto = busqueda.toLowerCase();
        return (
        socio.nombre.toLowerCase().includes(texto) ||
        socio.apellido.toLowerCase().includes(texto) ||
        socio.dni.includes(texto) ||
        socio.telefono.includes(texto)
        );
    });

    const totalPaginas = Math.max(1, Math.ceil(sociosFiltrados.length / POR_PAGINA));
    const paginaSegura = Math.min(pagina, totalPaginas);
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    const sociosPagina = sociosFiltrados.slice(inicio, inicio + POR_PAGINA);

    function manejarBusqueda(valor: string) {
        setBusqueda(valor);
        setPagina(1);
    }

    function manejarFiltro(valor: Filtro) {
        setFiltro(valor);
        setPagina(1);
    }

    const pills: { valor: Filtro; label: string }[] = [
        { valor: "todos", label: "Todos" },
        { valor: "por_vencer", label: "Por vencer" },
        { valor: "vencido", label: "Vencidos" },
        { valor: "sin_plan", label: "Sin plan" },
    ];

    return (
        <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Input
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => manejarBusqueda(e.target.value)}
            className="max-w-sm"
            />
            <div className="flex gap-1">
            {pills.map((p) => (
                <button
                key={p.valor}
                onClick={() => manejarFiltro(p.valor)}
                className={`rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors duration-150 ${
                    filtro === p.valor
                    ? "bg-surface-2 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50"
                }`}
                >
                {p.label}{" "}
                <span className="tabular text-muted-foreground/60">
                    {contadores[p.valor]}
                </span>
                </button>
            ))}
            </div>
        </div>

        {sociosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron socios.</p>
        ) : (
            <>
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full">
                <thead>
                    <tr className="border-b border-border">
                    <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        SOCIO
                    </th>
                    <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        DNI
                    </th>
                    <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        TELÉFONO
                    </th>
                    <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        VENCE
                    </th>
                    <th className="py-2.5 px-4 text-left text-[11px] font-normal tracking-wider text-muted-foreground/70">
                        ESTADO
                    </th>
                    </tr>
                </thead>
                <tbody>
                    {sociosPagina.map((socio) => (
                    <tr
                        key={socio.id}
                        className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-surface-2"
                    >
                        <td className="py-2.5 px-4">
                        <Link
                            href={`/socios/${socio.id}`}
                            className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                            {socio.nombre} {socio.apellido}
                        </Link>
                        </td>
                        <td className="py-2.5 px-4 text-sm text-muted-foreground tabular">
                        {socio.dni}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-muted-foreground tabular">
                        {socio.telefono}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-muted-foreground tabular">
                        {socio.vencimiento ?? "—"}
                        </td>
                        <td className="py-2.5 px-4">
                        <BadgeEstado estado={socio.estado} vencimiento={socio.vencimiento} />
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                    {inicio + 1}–{Math.min(inicio + POR_PAGINA, sociosFiltrados.length)} de{" "}
                    {sociosFiltrados.length}
                </span>
                <div className="flex items-center gap-1">
                    <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginaSegura === 1}
                    className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                    Anterior
                    </button>
                    <span className="text-xs text-muted-foreground px-2 tabular">
                    {paginaSegura} / {totalPaginas}
                    </span>
                    <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaSegura === totalPaginas}
                    className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                    Siguiente
                    </button>
                </div>
                </div>
            )}
            </>
        )}
        </div>
    );
}