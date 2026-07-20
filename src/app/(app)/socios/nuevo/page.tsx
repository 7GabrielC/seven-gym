import { requerirSesion } from "@/lib/session";
import { FormSocio } from "./form-socio";
import Link from "next/link";

export default async function NuevoSocioPage() {
  await requerirSesion();

  return (
    <div className="max-w-4xl px-8 py-7">
      <Link
        href="/socios"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Socios
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Nuevo socio
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Cargá los datos personales. Después vas a poder asignarle un plan.
      </p>

      <FormSocio />
    </div>
  );
}
