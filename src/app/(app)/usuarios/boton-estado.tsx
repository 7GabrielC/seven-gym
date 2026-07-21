"use client";

import { useState } from "react";
import { desactivarUsuario, reactivarUsuario } from "@/actions/usuarios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function BotonEstado({
  usuarioId,
  nombre,
  activo,
  esUsuarioActual,
}: {
  usuarioId: string;
  nombre: string;
  activo: boolean;
  esUsuarioActual: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function confirmarDesactivar() {
    setCargando(true);
    setError("");
    const resultado = await desactivarUsuario(usuarioId);
    setCargando(false);
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setAbierto(false);
    }
  }

  async function reactivar() {
    setCargando(true);
    await reactivarUsuario(usuarioId);
    setCargando(false);
  }

  if (esUsuarioActual) {
    return <span className="text-xs text-muted-foreground/50">Vos</span>;
  }

  if (!activo) {
    return (
      <Button size="sm" variant="outline" onClick={reactivar} disabled={cargando}>
        {cargando ? "Reactivando..." : "Reactivar"}
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setAbierto(true)}>
        Desactivar
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent showCloseButton={!cargando}>
          <DialogHeader>
            <DialogTitle>Desactivar a {nombre}</DialogTitle>
            <DialogDescription>
              No va a poder iniciar sesión hasta que lo reactives. Sus pagos, cajas
              y demás registros históricos se conservan intactos.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md px-3 py-2">
              {error}
            </p>
          )}

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
              onClick={confirmarDesactivar}
              disabled={cargando}
            >
              {cargando ? "Desactivando..." : "Sí, desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}