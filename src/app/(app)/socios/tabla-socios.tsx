"use client";

import { useState } from "react";
import Link from "next/link";
import { type EstadoSocio } from "@/lib/socios/estado";
import { Input } from "@/components/ui/input";

const estilosEstado: Record<EstadoSocio, string> = {
    activo: "bg-green-100 text-green-800",
    por_vencer: "bg-yellow-100 text-yellow-800",
    vencido: "bg-red-100 text-red-800",
    inactivo: "bg-gray-100 text-gray-600",
};

const etiquetasEstado: Record<EstadoSocio, string> = {
    activo: "Activo",
    por_vencer: "Por vencer",
    vencido: "Vencido",
    inactivo: "Inactivo",
};

type SocioFila = {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    email: string | null;
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
            <p className="text-muted-foreground">No se encontraron socios.</p>
        ) : (
            <table className="w-full border-collapse">
            <thead>
                <tr className="border-b text-left">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Apellido</th>
                <th className="py-2 pr-4">DNI</th>
                <th className="py-2 pr-4">Teléfono</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Estado</th>
                </tr>
            </thead>
            <tbody>
                {sociosFiltrados.map((socio) => (
                <tr key={socio.id} className="border-b">
                    <td className="py-2 pr-4">
                    <Link href={`/socios/${socio.id}`} className="text-blue-600 hover:underline">
                        {socio.nombre}
                    </Link>
                    </td>
                    <td className="py-2 pr-4">{socio.apellido}</td>
                    <td className="py-2 pr-4">{socio.dni}</td>
                    <td className="py-2 pr-4">{socio.telefono}</td>
                    <td className="py-2 pr-4">
                        {socio.email ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-2 pr-4">
                    {socio.estado ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${estilosEstado[socio.estado]}`}>
                        {etiquetasEstado[socio.estado]}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Sin plan</span>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        </div>
    );
}