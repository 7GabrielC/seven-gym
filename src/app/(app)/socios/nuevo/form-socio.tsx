"use client";

import { useState, useEffect } from "react";
import { crearSocio, reactivarSocio, verificarDni } from "@/actions/socios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FormSocio() {
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [dniActivo, setDniActivo] = useState(false);
    const [error, setError] = useState("");
    const [socioBaja, setSocioBaja] = useState<{ id: number; nombre: string } | null>(null);
    const [cargando, setCargando] = useState(false);
    const [reactivando, setReactivando] = useState(false);

    useEffect(() => {
        if (dni.length < 6) {
        setSocioBaja(null);
        setDniActivo(false);
        return;
        }
        const timer = setTimeout(async () => {
        const resultado = await verificarDni(dni);
        if (resultado.estado === "baja") {
            setSocioBaja({ id: resultado.id, nombre: resultado.nombre });
            setDniActivo(false);
        } else if (resultado.estado === "activo") {
            setDniActivo(true);
            setSocioBaja(null);
        } else {
            setSocioBaja(null);
            setDniActivo(false);
        }
        }, 400);

        return () => clearTimeout(timer);
    }, [dni]);

    async function manejarSubmit(formData: FormData) {
        setError("");
        setSocioBaja(null);
        setCargando(true);
        const resultado = await crearSocio(formData);
        if (resultado?.error === "dado_de_baja" && resultado.socioBajaId) {
        setSocioBaja({ id: resultado.socioBajaId, nombre: resultado.nombreBaja! });
        setCargando(false);
        } else if (resultado?.error) {
        setError(resultado.error);
        setCargando(false);
        }
    }

    async function manejarReactivar() {
        if (!socioBaja) return;
        setReactivando(true);
        await reactivarSocio(socioBaja.id);
    }

    const iniciales = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
            <form action={manejarSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                    id="nombre"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />
                </div>
                <div className="space-y-1.5">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                    id="apellido"
                    name="apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                <Label htmlFor="dni">DNI</Label>
                <Input
                    id="dni"
                    name="dni"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    required
                />
                {dniActivo && (
                    <p className="text-xs text-danger">
                    Ya existe un socio activo con este DNI.
                    </p>
                )}
                </div>
                <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" required />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="email">
                Email <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                </Label>
                <Input id="email" name="email" type="email" />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                <Input id="fechaNacimiento" name="fechaNacimiento" type="date" required />
            </div>

            {socioBaja && (
                <div className="rounded-md border border-warning/25 bg-warning-soft p-3.5">
                <p className="text-sm">
                    Ese DNI pertenece a <strong>{socioBaja.nombre}</strong>, un socio dado
                    de baja. Podés reactivarlo en vez de crear uno nuevo.
                </p>
                <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    onClick={manejarReactivar}
                    disabled={reactivando}
                >
                    {reactivando ? "Reactivando..." : `Reactivar a ${socioBaja.nombre}`}
                </Button>
                </div>
            )}

            {error && (
                <p className="text-sm text-danger bg-danger-soft border border-danger/25 rounded-md px-3 py-2">
                {error}
                </p>
            )}

            <Button type="submit" className="w-full" disabled={cargando || dniActivo}>
                {cargando ? "Guardando..." : "Guardar socio"}
            </Button>
            </form>
        </div>

        <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-5 flex flex-col items-center text-center">
            <div className="size-16 rounded-full bg-surface-2 border border-border flex items-center justify-center text-xl font-medium text-muted-foreground mb-3">
                {iniciales || "?"}
            </div>
            <div className="text-sm font-medium">
                {nombre || apellido ? `${nombre} ${apellido}`.trim() : "Nuevo socio"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
                Así se va a ver en la ficha
            </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] tracking-wider text-muted-foreground/70 mb-3">
                ANTES DE GUARDAR
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex gap-2">
                <span className="text-primary shrink-0">•</span>
                El DNI debe ser único, aunque el socio esté dado de baja.
                </li>
                <li className="flex gap-2">
                <span className="text-primary shrink-0">•</span>
                El plan se asigna después, al cobrar la primera cuota.
                </li>
                <li className="flex gap-2">
                <span className="text-primary shrink-0">•</span>
                El teléfono se usa para avisar vencimientos.
                </li>
            </ul>
            </div>
        </div>
        </div>
    );
}