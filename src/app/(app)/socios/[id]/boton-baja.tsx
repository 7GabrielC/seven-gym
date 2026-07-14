"use client";

import { darDeBajaSocio } from "@/actions/socios";
import { Button } from "@/components/ui/button";

export function BotonBaja({ socioId }: { socioId: number }) {
    function confirmarBaja(e: React.MouseEvent) {
        if (!confirm("¿Seguro que querés dar de baja a este socio?")) {
        e.preventDefault();
        }
    }

    return (
        <form action={darDeBajaSocio}>
        <input type="hidden" name="id" value={socioId} />
        <Button type="submit" variant="destructive" onClick={confirmarBaja}>
            Dar de baja
        </Button>
        </form>
    );
}