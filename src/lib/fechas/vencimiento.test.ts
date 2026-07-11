import { describe, it, expect } from "vitest";
import { calcularVencimiento } from "./vencimiento";

describe("calcularVencimiento", () => {
    it("mensual normal: 13 de agosto vence el 13 de septiembre", () => {
        const resultado = calcularVencimiento(new Date(2025, 7, 13), 1, "mes");
        expect(resultado).toEqual(new Date(2025, 8, 13));
    });

    it("recorte: 31 de enero vence el 28 de febrero", () => {
        const resultado = calcularVencimiento(new Date(2025, 0, 31), 1, "mes");
        expect(resultado).toEqual(new Date(2025, 1, 28));
    });

    it("bisiesto: 31 de enero 2024 vence el 29 de febrero", () => {
        const resultado = calcularVencimiento(new Date(2024, 0, 31), 1, "mes");
        expect(resultado).toEqual(new Date(2024, 1, 29));
    });

    it("trimestral: 15 de marzo vence el 15 de junio", () => {
        const resultado = calcularVencimiento(new Date(2025, 2, 15), 3, "mes");
        expect(resultado).toEqual(new Date(2025, 5, 15));
    });

    it("trimestral con recorte único: 31 de diciembre vence el 31 de marzo", () => {
        const resultado = calcularVencimiento(new Date(2024, 11, 31), 3, "mes");
        expect(resultado).toEqual(new Date(2025, 2, 31));
    });

    it("bienvenida: 25 de enero + 14 dias vence el 8 de febrero", () => {
        const resultado = calcularVencimiento(new Date(2025, 0, 25), 14, "dia");
        expect(resultado).toEqual(new Date(2025, 1, 8));
    });
});