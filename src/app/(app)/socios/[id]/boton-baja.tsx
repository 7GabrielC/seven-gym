"use client";

import { useState } from "react";
import { darDeBajaSocio } from "@/actions/socios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export function BotonBaja({
  socioId,
  nombre,
}: {
  socioId: number;
  nombre: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setCargando(true);
    const fd = new FormData();
    fd.append("id", String(socioId));
    await darDeBajaSocio(fd);
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setAbierto(true)}>
        Dar de baja
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent showCloseButton={!cargando}>
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="size-8 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0">
                <AlertTriangle size={16} strokeWidth={2} />
              </div>
              <DialogTitle>Dar de baja a {nombre}</DialogTitle>
            </div>
            <DialogDescription>
              El socio dejará de aparecer en las listas activas. Si tiene un
              plan vigente, también se cierra. Esta acción se puede revertir
              solo editando la base directamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAbierto(false)}
              disabled={cargando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmar}
              disabled={cargando}
            >
              {cargando ? "Dando de baja..." : "Sí, dar de baja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
