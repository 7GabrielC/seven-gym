"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  meses: { valor: string; etiqueta: string }[];
  mesActual?: string;
  desdeActual?: string;
  hastaActual?: string;
};

export function SelectorPeriodo({
  meses,
  mesActual,
  desdeActual,
  hastaActual,
}: Props) {
  const router = useRouter();
  const [modo, setModo] = useState<"mes" | "rango">(
    desdeActual ? "rango" : "mes",
  );
  const [desde, setDesde] = useState(desdeActual ?? "");
  const [hasta, setHasta] = useState(hastaActual ?? "");

  function irAMes(valor: string | null) {
    if (!valor) return;
    router.push(`/reportes?mes=${valor}`);
  }

  function irARango() {
    if (!desde || !hasta) return;
    router.push(`/reportes?desde=${desde}&hasta=${hasta}`);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-8">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setModo("mes")}
          className={`text-sm pb-1 border-b-2 transition-colors ${
            modo === "mes"
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Por mes
        </button>
        <button
          onClick={() => setModo("rango")}
          className={`text-sm pb-1 border-b-2 transition-colors ${
            modo === "rango"
              ? "border-foreground font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Rango de fechas
        </button>
      </div>

      {modo === "mes" ? (
        <div className="max-w-xs">
          <Select value={mesActual} onValueChange={irAMes}>
            <SelectTrigger>
              <SelectValue placeholder="Elegí un mes" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="desde">Desde</Label>
            <Input
              id="desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hasta">Hasta</Label>
            <Input
              id="hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <Button onClick={irARango} disabled={!desde || !hasta}>
            Ver
          </Button>
        </div>
      )}
    </div>
  );
}
