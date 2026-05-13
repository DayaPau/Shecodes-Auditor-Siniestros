// Datos de referencia del auditor de siniestros

export const TARIFA_REFERENCIA: Record<string, number> = {
  mano_de_obra_hora: 85,
  pintura_panel: 120,
  cambio_parabrisas: 380,
  revision_electrica: 95,
  cambio_neumatico: 65,
  alineacion_balanceo: 55,
  cambio_amortiguador: 210,
  diagnostico_computadora: 45,
};

export const TARIFA_LABELS: Record<string, string> = {
  mano_de_obra_hora: "Mano de obra (hora)",
  pintura_panel: "Pintura de panel",
  cambio_parabrisas: "Cambio de parabrisas",
  revision_electrica: "Revisión eléctrica",
  cambio_neumatico: "Cambio de neumático",
  alineacion_balanceo: "Alineación y balanceo",
  cambio_amortiguador: "Cambio de amortiguador",
  diagnostico_computadora: "Diagnóstico computadora",
};

export interface Siniestro {
  id: string;
  taller: string;
  fecha: string;
  items_cobrados: string[];
  monto_aprobado: number;
}

export const HISTORIAL_SINIESTROS: Siniestro[] = [
  {
    id: "SIN-2024-0881",
    taller: "Taller Rodríguez",
    fecha: "2024-11-12",
    items_cobrados: ["cambio_parabrisas", "pintura_panel"],
    monto_aprobado: 620.0,
  },
  {
    id: "SIN-2024-0942",
    taller: "AutoFix SA",
    fecha: "2024-12-03",
    items_cobrados: ["mano_de_obra_hora", "revision_electrica"],
    monto_aprobado: 275.0,
  },
];

export interface SiniestroReportado {
  id: string;
  tipo_siniestro: string;
  descripcion: string;
  items_autorizados: string[];
  evidencias_requeridas: string[];
  estado: "nuevo" | "en_revision" | "liquidado";
}

export const SINIESTROS_REPORTADOS: SiniestroReportado[] = [
  {
    id: "SIN-2025-0101",
    tipo_siniestro: "Rotura de parabrisas y daño lateral",
    descripcion:
      "Vehículo reporta rotura de parabrisas y daño en panel lateral izquierdo.",
    items_autorizados: [
      "cambio_parabrisas",
      "pintura_panel",
      "mano_de_obra_hora",
    ],
    evidencias_requeridas: [
      "Informe del perito",
      "Fotos del vehículo",
      "Factura del taller",
    ],
    estado: "en_revision",
  },
  {
    id: "SIN-2024-0881",
    tipo_siniestro: "Rotura de parabrisas",
    descripcion:
      "Siniestro previamente liquidado por cambio de parabrisas y pintura de panel.",
    items_autorizados: ["cambio_parabrisas", "pintura_panel"],
    evidencias_requeridas: [
      "Factura aprobada",
      "Informe de liquidación",
      "Evidencia fotográfica",
    ],
    estado: "liquidado",
  },
  {
    id: "SIN-2025-0210",
    tipo_siniestro: "Daño en suspensión delantera",
    descripcion:
      "Vehículo reporta daño en suspensión delantera y requiere revisión eléctrica preventiva.",
    items_autorizados: [
      "cambio_amortiguador",
      "alineacion_balanceo",
      "revision_electrica",
    ],
    evidencias_requeridas: [
      "Informe técnico del taller",
      "Fotos del daño",
      "Factura del taller",
    ],
    estado: "en_revision",
  },
];

export interface FacturaItem {
  concepto: string;
  codigo: string;
  cantidad: number;
  precio_unitario: number;
}

export interface Factura {
  id: string;
  siniestro_id: string;
  taller: string;
  fecha: string;
  items: FacturaItem[];
  total_facturado: number;
}

export const FACTURAS: Factura[] = [
  {
    id: "FAC-2025-0331",
    siniestro_id: "SIN-2025-0101",
    taller: "Taller Rodríguez",
    fecha: "2025-03-15",
    items: [
      {
        concepto: "Cambio de parabrisas",
        codigo: "cambio_parabrisas",
        cantidad: 1,
        precio_unitario: 520.0,
      },
      {
        concepto: "Pintura de panel lateral",
        codigo: "pintura_panel",
        cantidad: 2,
        precio_unitario: 120.0,
      },
      {
        concepto: "Mano de obra (8 horas)",
        codigo: "mano_de_obra_hora",
        cantidad: 8,
        precio_unitario: 85.0,
      },
    ],
    total_facturado: 1200.0,
  },
  {
    id: "FAC-2025-0412",
    siniestro_id: "SIN-2024-0881",
    taller: "Taller Rodríguez",
    fecha: "2025-04-01",
    items: [
      {
        concepto: "Cambio de parabrisas",
        codigo: "cambio_parabrisas",
        cantidad: 1,
        precio_unitario: 380.0,
      },
      {
        concepto: "Diagnóstico computadora",
        codigo: "diagnostico_computadora",
        cantidad: 1,
        precio_unitario: 75.0,
      },
    ],
    total_facturado: 455.0,
  },
  {
    id: "FAC-2025-0499",
    siniestro_id: "SIN-2025-0210",
    taller: "AutoFix SA",
    fecha: "2025-04-18",
    items: [
      {
        concepto: "Cambio de amortiguador delantero",
        codigo: "cambio_amortiguador",
        cantidad: 2,
        precio_unitario: 210.0,
      },
      {
        concepto: "Alineación y balanceo",
        codigo: "alineacion_balanceo",
        cantidad: 1,
        precio_unitario: 55.0,
      },
      {
        concepto: "Revisión eléctrica",
        codigo: "revision_electrica",
        cantidad: 1,
        precio_unitario: 95.0,
      },
    ],
    total_facturado: 570.0,
  },
];

export interface Hallazgo {
  tipo:
    | "sobreprecio"
    | "duplicado"
    | "no_reportado"
    | "inconsistencia_total"
    | "correcto";
  item: string;
  detalle: string;
  impacto_economico: number;
}

export interface ResultadoAuditoria {
  veredicto: "APROBADA" | "OBSERVADA" | "RECHAZADA";
  score_riesgo: number;
  hallazgos: Hallazgo[];
  total_facturado: number;
  total_aprobable: number;
  ahorro_detectado: number;
  recomendacion: string;
  analisis_agente?: string;
  trazabilidad?: string[];
}