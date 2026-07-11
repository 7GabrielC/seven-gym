import { describe, it, expect } from "vitest";
import { calcularEstadoSocio } from "./estado";

describe("calcularEstadoSocio", () => {
    const hoy = new Date(2025, 5, 15);

    it("activo: vence en 20 dias", () => {
        const vencimiento = new Date(2025, 6, 5);
        expect(calcularEstadoSocio(vencimiento, hoy)).toBe("activo");
    });

    it("por vencer: vence en 5 dias", () => {
        const vencimiento = new Date(2025, 5, 20);
        expect(calcularEstadoSocio(vencimiento, hoy)).toBe("por_vencer");
    });

    it("por vencer: vence justo hoy", () => {
        const vencimiento = new Date(2025, 5, 15);
        expect(calcularEstadoSocio(vencimiento, hoy)).toBe("por_vencer");
    });

    it("vencido: vencio hace 10 dias", () => {
        const vencimiento = new Date(2025, 5, 5);
        expect(calcularEstadoSocio(vencimiento, hoy)).toBe("vencido");
    });

    it("vencido: vencio hace exactamente 30 dias", () => {
        const vencimiento = new Date(2025, 4, 16);
        expect(calcularEstadoSocio(vencimiento, hoy)).toBe("vencido");
    });

    it("inactivo: vencio hace 40 dias", () => {
        const vencimiento = new Date(2025, 4, 6);
        expect(calcularEstadoSocio(vencimiento, hoy)).toBe("inactivo");
    });
});