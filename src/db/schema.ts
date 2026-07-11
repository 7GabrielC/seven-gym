import { pgTable, bigserial, varchar, integer, timestamp, date, bigint, boolean, text, pgEnum } from "drizzle-orm/pg-core";

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

export const usuarios = pgTable("usuarios", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().unique(),
    rol: varchar("rol", { length: 20 }).notNull(),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const planes = pgTable("planes", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    duracionValor: integer("duracion_valor").notNull(),
    duracionUnidad: varchar("duracion_unidad", { length: 10 }).notNull(),
    usosMaximosPorSocio: integer("usos_maximos_por_socio"),
    actividad: varchar("actividad", { length: 30 }),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const preciosPlan = pgTable("precios_plan", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    planId: bigint("plan_id", { mode: "number" }).notNull().references(() => planes.id),
    precioCentavos: bigint("precio_centavos", { mode: "number" }).notNull(),
    vigenteDesde: date("vigente_desde").notNull(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const suscripciones = pgTable("suscripciones", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    socioId: bigint("socio_id", { mode: "number" }).notNull().references(() => socios.id),
    planId: bigint("plan_id", { mode: "number" }).notNull().references(() => planes.id),
    desde: date("desde").notNull(),
    hasta: date("hasta").notNull(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
    eliminadoEn: timestamp("eliminado_en"),
});

export const metodoPagoEnum = pgEnum("metodo_pago", ["efectivo", "transferencia"]);

export const tipoMovimientoEnum = pgEnum("tipo_movimiento", ["ingreso", "egreso"]);

export const pagos = pgTable("pagos", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    suscripcionId: bigint("suscripcion_id", { mode: "number" }).references(() => suscripciones.id),
    montoCentavos: bigint("monto_centavos", { mode: "number" }).notNull(),
    metodo: metodoPagoEnum("metodo").notNull(),
    fechaPago: date("fecha_pago").notNull(),
    registradoPor: bigint("registrado_por", { mode: "number" }).notNull().references(() => usuarios.id),
    anulado: boolean("anulado").notNull().default(false),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const sesionesCaja = pgTable("sesiones_caja", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    usuarioId: bigint("usuario_id", { mode: "number" }).notNull().references(() => usuarios.id),
    montoApertura: bigint("monto_apertura", { mode: "number" }).notNull(),
    montoCierreDeclarado: bigint("monto_cierre_declarado", { mode: "number" }),
    abiertaEn: timestamp("abierta_en").notNull().defaultNow(),
    cerradaEn: timestamp("cerrada_en"),
});

export const movimientosCaja = pgTable("movimientos_caja", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sesionCajaId: bigint("sesion_caja_id", { mode: "number" }).notNull().references(() => sesionesCaja.id),
    pagoId: bigint("pago_id", { mode: "number" }).references(() => pagos.id),
    tipo: tipoMovimientoEnum("tipo").notNull(),
    montoCentavos: bigint("monto_centavos", { mode: "number" }).notNull(),
    concepto: varchar("concepto", { length: 150 }).notNull(),
    nombreProspecto: varchar("nombre_prospecto", { length: 150 }),
    telefonoProspecto: varchar("telefono_prospecto", { length: 30 }),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const observaciones = pgTable("observaciones", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    socioId: bigint("socio_id", { mode: "number" }).notNull().references(() => socios.id),
    autorId: bigint("autor_id", { mode: "number" }).notNull().references(() => usuarios.id),
    contenido: text("contenido").notNull(),
    creadoEn: timestamp("creado_en").notNull().defaultNow(),
});