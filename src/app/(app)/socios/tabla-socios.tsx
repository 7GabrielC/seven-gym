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

export function TablaSocios({ socios }: { socios: SocioFila[] }) {
    const [busqueda, setBusqueda] = useState("");

    const sociosFiltrados = socios.filter((socio) => {
        const texto = busqueda.toLowerCase();
        return (
        socio.nombre.toLowerCase().includes(texto) ||
        socio.apellido.toLowerCase().includes(texto) ||
        socio.dni.includes(texto) ||
        socio.telefono.includes(texto)
        );
    });

    return (
        <div>
        <Input
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mb-4 max-w-sm"
        />

        {sociosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron socios.</p>
        ) : (
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
                {sociosFiltrados.map((socio) => (
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
                        <BadgeEstado
                        estado={socio.estado}
                        vencimiento={socio.vencimiento}
                        />
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </div>
    );
}