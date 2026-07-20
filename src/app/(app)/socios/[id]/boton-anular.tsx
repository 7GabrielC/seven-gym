"use client";

import { useState } from "react";
import { anularPago } from "@/actions/pagos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BotonAnular({ pagoId }: { pagoId: number }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setError("");
    setCargando(true);

    const formData = new FormData();
    formData.append("pagoId", String(pagoId));
    formData.append("motivo", motivo);

    const resultado = await anularPago(formData);
    setCargando(false);

    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      if (resultado.aviso) {
        setAviso(resultado.aviso);
      } else {
        setAbierto(false);
        setMotivo("");
      }
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 h-auto py-1"
        onClick={() => setAbierto(true)}
      >
        Anular
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular pago</DialogTitle>
            <DialogDescription>
              El pago quedará registrado como anulado y el período que generó se
              dará de baja. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {aviso ? (
            <div className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3">
              <p className="font-medium mb-1">Pago anulado.</p>
              <p>{aviso}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la anulación</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: cargado al socio equivocado"
                rows={3}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </p>
          )}

          <DialogFooter>
            {aviso ? (
              <Button onClick={() => setAbierto(false)}>Entendido</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAbierto(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmar}
                  disabled={cargando || !motivo.trim()}
                >
                  {cargando ? "Anulando..." : "Anular pago"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
