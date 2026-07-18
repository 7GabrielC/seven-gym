"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BotonTema } from "@/components/boton-tema";

export function BarraUsuario({ nombre, rol }: { nombre: string; rol: string }) {
    const router = useRouter();

    async function cerrarSesion() {
        await authClient.signOut();
        router.push("/login");
    }

    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
                {nombre} <span className="opacity-60">({rol})</span>
            </span>
            <BotonTema />
            <Button variant="outline" size="sm" onClick={cerrarSesion}>
                Cerrar sesión
            </Button>
        </div>
    );
}