"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ItemMenu = {
    href: string;
    label: string;
    icono: React.ReactNode;
    soloDueno?: boolean;
};

function Icono({ d }: { d: string }) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="17"
        height="17"
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
    {
        href: "/",
        label: "Inicio",
        icono: <Icono d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
    },
    {
        href: "/socios",
        label: "Socios",
        icono: <Icono d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    },
    {
        href: "/pagos/nuevo",
        label: "Cobrar cuota",
        icono: <Icono d="M2 7h20v10H2zM2 11h20M6 15h4" />,
    },
    {
        href: "/movimientos/ingresos",
        label: "Movimientos",
        icono: <Icono d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />,
    },
    {
        href: "/reportes",
        label: "Reportes",
        icono: <Icono d="M3 21h18M7 21V11M12 21V4M17 21v-7" />,
        soloDueno: true,
    },
    {
        href: "/caja",
        label: "Caja",
        icono: <Icono d="M3 8h18v12H3zM3 8l2-4h14l2 4M12 12v4M9 14h6" />,
    },
    {
        href: "/planes",
        label: "Planes",
        icono: <Icono d="M4 5h16v14H4zM4 10h16M9 5v14" />,
        soloDueno: true,
    },
    {
        href: "/usuarios",
        label: "Usuarios",
        icono: <Icono d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
        soloDueno: true,
    },
];

export function MenuLateral({ rol }: { rol: string }) {
    const pathname = usePathname();
    const esDueno = rol === "dueño";
    const itemsVisibles = items.filter((item) => !item.soloDueno || esDueno);

    return (
        <nav className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar min-h-screen px-3 py-4">
            <div className="px-3 pb-6">
                <div className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                Seven
                </div>
                <div className="text-[10px] tracking-[0.12em] text-muted-foreground/60 mt-0.5">
                GIMNASIO
                </div>
            </div>

            <div className="space-y-0.5">
                {itemsVisibles.map((item) => {
                const base = item.href.startsWith("/movimientos")
                    ? "/movimientos"
                    : item.href;
                const activo =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(base);

                return (
                    <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150 ${
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
                );
                })}
            </div>
        </nav>
    );
}