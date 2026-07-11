"use client";

import { registrarPago } from "@/actions/pagos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Socio = { id: number; nombre: string; apellido: string };
type Plan = { id: number; nombre: string };

export function FormPago({ socios, planes }: { socios: Socio[]; planes: Plan[] }) {
    return (
        <form action={registrarPago} className="space-y-4">
        <div className="space-y-2">
            <Label>Socio</Label>
            <Select name="socioId" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí un socio" />
            </SelectTrigger>
            <SelectContent>
                {socios.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre} {s.apellido}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label>Plan</Label>
            <Select name="planId" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí un plan" />
            </SelectTrigger>
            <SelectContent>
                {planes.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select name="metodo" required>
            <SelectTrigger>
                <SelectValue placeholder="Elegí el método" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
            </SelectContent>
            </Select>
        </div>

        <Button type="submit" className="w-full">
            Registrar pago
        </Button>
        </form>
    );
}