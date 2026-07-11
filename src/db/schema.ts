import { pgTable, bigserial, varchar, integer, timestamp, date } from "drizzle-orm/pg-core";

export const socios = pgTable("socios", {
    id: bigserial("id", { mode: "number" }).primaryKey(),

    nombre: varchar("nombre", { length: 100 }).notNull(),
    apellido: varchar("apellido", { length: 100 }).notNull(),
    dni: varchar("dni", { length: 20 }).notNull().unique(),
    telefono: varchar("telefono", { length: 30 }).notNull(),
    fechaNacimiento: date("fecha_nacimiento").notNull(),

    diaAncla: integer("dia_ancla"),

    creadoEn: timestamp("creado_en").notNull().defaultNow(),
    actualizadoEn: timestamp("actualizado_en").notNull().defaultNow(),
    eliminadoEn: timestamp("eliminado_en"),
});