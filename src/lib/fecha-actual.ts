export function hoyArgentinaStr(): string {
  const ahora = new Date();
  // Argentina es UTC-3 todo el año (no tiene horario de verano)
  const enArgentina = new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
  return enArgentina.toISOString().slice(0, 10);
}

/** Igual que arriba, pero devuelve un objeto Date (para cálculos de mes, etc.) */
export function hoyArgentina(): Date {
  const ahora = new Date();
  return new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
}

/** El saludo según la hora del día, en horario argentino */
export function saludoSegunHora(): string {
  const ahora = hoyArgentina();
  const hora = ahora.getUTCHours();

  if (hora >= 6 && hora < 13) return "Buen día";
  if (hora >= 13 && hora < 21) return "Buenas tardes";
  return "Buenas noches";
}