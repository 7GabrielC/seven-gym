"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarraUsuario } from "@/components/barra-usuario";

type Rama = { href: string; label: string };
type ItemMenu = {
    href: string;
    label: string;
    icono: React.ReactNode;
    soloDueno?: boolean;
    ramas?: Rama[];
};

function Icono({ d }: { d: string }) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        >
        <path d={d} />
        </svg>
    );
}

const items: ItemMenu[] = [
    { href: "/", label: "Inicio", icono: <Icono d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" /> },
    { href: "/socios", label: "Socios", icono: <Icono d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
    { href: "/pagos/nuevo", label: "Cobrar cuota", icono: <Icono d="M2 7h20v10H2zM2 11h20M6 15h4" /> },
    {
        href: "/movimientos/ingresos",
        label: "Movimientos",
        icono: <Icono d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />,
        ramas: [
        { href: "/movimientos/ingresos", label: "Ingresos" },
        { href: "/movimientos/egresos", label: "Egresos" },
        ],
    },
    { href: "/reportes", label: "Reportes", icono: <Icono d="M3 21h18M7 21V11M12 21V4M17 21v-7" />, soloDueno: true },
    { href: "/caja", label: "Caja", icono: <Icono d="M3 8h18v12H3zM3 8l2-4h14l2 4M12 12v4M9 14h6" /> },
    { href: "/planes", label: "Planes", icono: <Icono d="M4 5h16v14H4zM4 10h16M9 5v14" />, soloDueno: true },
    { href: "/usuarios", label: "Usuarios", icono: <Icono d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />, soloDueno: true },
];

export function MenuLateral({ rol, nombre }: { rol: string; nombre: string }) {
    const pathname = usePathname();
    const esDueno = rol === "dueño";
    const itemsVisibles = items.filter((item) => !item.soloDueno || esDueno);

    return (
        <nav className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 flex flex-col">

            {/* Logo */}
            <div className="flex items-center justify-center py-4 shrink-0">
                <Image
                src="/images/sevenLogoBlanco.png"
                alt="Seven"
                width={104}
                height={104}
                className="hidden dark:block"
                />
                <Image
                src="/images/sevenLogoNegro.png"
                alt="Seven"
                width={104}
                height={104}
                className="block dark:hidden"
                />
            </div>

            {/* Navegación */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-px">
                {itemsVisibles.map((item) => {
                const base = item.href.startsWith("/movimientos")
                    ? "/movimientos"
                    : item.href;
                const activo =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(base);

                return (
                    <div key={item.href}>
                    <Link
                        href={item.href}
                        className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
                        activo
                            ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`}
                    >
                        {activo && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-brand-accent" />
                        )}
                        {item.icono}
                        {item.label}
                    </Link>

                    {/* Ramas */}
                    {item.ramas && (
                        <div className="mt-px mb-0.5 space-y-px">
                            {item.ramas.map((rama) => {
                                const ramaActiva = pathname === rama.href;
                                return (
                                <Link
                                    key={rama.href}
                                    href={rama.href}
                                    className={`flex items-center gap-1.5 rounded-md pl-[2.6rem] pr-2.5 py-1 text-[13px] transition-colors duration-150 ${
                                    ramaActiva
                                        ? "text-sidebar-foreground font-medium"
                                        : "text-muted-foreground/70 hover:text-sidebar-foreground"
                                    }`}
                                >
                                    <span className="text-muted-foreground/50">↳</span>
                                    {rama.label}
                                </Link>
                                );
                            })}
                        </div>
                    )}
                    </div>
                );
                })}
            </div>

            {/* Usuario abajo */}
            <div className="border-t border-sidebar-border p-3 shrink-0">
                <BarraUsuario nombre={nombre} rol={rol} />
            </div>
        </nav>
    );
}