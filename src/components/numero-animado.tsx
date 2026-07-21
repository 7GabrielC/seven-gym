"use client";

import { useEffect, useRef, useState } from "react";

function pesosLocal(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

type Props = {
  valor: number;
  duracionMs?: number;
  formato?: "entero" | "pesos";
};

export function NumeroAnimado({ valor, duracionMs = 600, formato = "entero" }: Props) {
  const [mostrado, setMostrado] = useState(0);
  const inicioRef = useRef<number | null>(null);
  const desdeRef = useRef(0);

  useEffect(() => {
    desdeRef.current = mostrado;
    inicioRef.current = null;

    let frame: number;

    function tick(timestamp: number) {
      if (inicioRef.current === null) inicioRef.current = timestamp;
      const transcurrido = timestamp - inicioRef.current;
      const progreso = Math.min(transcurrido / duracionMs, 1);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      const actual = desdeRef.current + (valor - desdeRef.current) * suavizado;

      setMostrado(actual);

      if (progreso < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setMostrado(valor);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const redondeado = Math.round(mostrado);
  return <>{formato === "pesos" ? pesosLocal(redondeado) : redondeado}</>;
}