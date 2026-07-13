"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function BarraUsuario({ nombre, rol }: { nombre: string; rol: string }) {
    const router = useRouter();

    async function cerrarSesion() {
        await authClient.signOut();
        router.push("/login");
    }

    return (
        <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">
            {nombre} <span className="text-gray-400">({rol})</span>
        </span>
        <Button variant="outline" size="sm" onClick={cerrarSesion}>
            Cerrar sesión
        </Button>
        </div>
    );
}