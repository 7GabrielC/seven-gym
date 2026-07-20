import { type EstadoSocio, diasHastaVencimiento } from "@/lib/socios/estado";

type Props = {
  estado: EstadoSocio | null;
  vencimiento?: string | null;
};

export function BadgeEstado({ estado, vencimiento }: Props) {
  if (!estado) {
    return <span className="text-xs text-muted-foreground/50">Sin plan</span>;
  }

  // Activo: presente pero silencioso. Un punto, no un cartel.
  if (estado === "activo") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-brand-accent shadow-[0_0_6px_var(--brand-accent)]" />
        Activo
      </span>
    );
  }

  const dias = vencimiento
    ? diasHastaVencimiento(new Date(vencimiento), new Date())
    : null;

  if (estado === "por_vencer") {
    return (
      <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning tabular">
        {dias === 0 ? "Vence hoy" : dias === 1 ? "1 día" : `${dias} días`}
      </span>
    );
  }

  if (estado === "vencido") {
    const hace = dias !== null ? Math.abs(dias) : null;
    return (
      <span className="inline-flex items-center rounded-full border border-danger/30 bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger tabular">
        {hace !== null ? `Hace ${hace} d` : "Vencido"}
      </span>
    );
  }

  // Inactivo: apagado, ya no es recuperable
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      Inactivo
    </span>
  );
}
