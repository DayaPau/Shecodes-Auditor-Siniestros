import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  TARIFA_REFERENCIA,
  HISTORIAL_SINIESTROS,
  SINIESTROS_REPORTADOS,
  type Factura,
  type Hallazgo,
  type ResultadoAuditoria,
} from "@/lib/data";

export const runtime = "nodejs";

function redondear(valor: number) {
  return Number(valor.toFixed(2));
}

function calcularSumaItems(factura: Factura) {
  return redondear(
    factura.items.reduce(
      (total, item) => total + item.cantidad * item.precio_unitario,
      0
    )
  );
}

function generarHallazgosDeterministicos(factura: Factura): Hallazgo[] {
  const hallazgos: Hallazgo[] = [];

  const sumaItems = calcularSumaItems(factura);
  const diferenciaTotal = redondear(sumaItems - factura.total_facturado);

  const siniestroReportado = SINIESTROS_REPORTADOS.find(
    (s) => s.id === factura.siniestro_id
  );

  const historial = HISTORIAL_SINIESTROS.find(
    (s) => s.id === factura.siniestro_id
  );

  // 1. Validar total declarado vs suma real de ítems
  if (Math.abs(diferenciaTotal) > 0.01) {
    hallazgos.push({
      tipo: "inconsistencia_total",
      item: "Total facturado",
      detalle: `La factura declara $${factura.total_facturado.toFixed(
        2
      )}, pero la suma de los ítems es $${sumaItems.toFixed(
        2
      )}. Diferencia detectada: $${Math.abs(diferenciaTotal).toFixed(2)}.`,
      impacto_economico: 0,
    });
  }

  // 2. Validar cada ítem
  for (const item of factura.items) {
    const precioReferencia = TARIFA_REFERENCIA[item.codigo];

    // Duplicado
    if (historial && historial.items_cobrados.includes(item.codigo)) {
      hallazgos.push({
        tipo: "duplicado",
        item: item.concepto,
        detalle: `Este ítem ya fue cobrado en el siniestro ${historial.id}, registrado el ${historial.fecha}.`,
        impacto_economico: redondear(item.cantidad * item.precio_unitario),
      });

      continue;
    }

    // No reportado
    if (
      siniestroReportado &&
      !siniestroReportado.items_autorizados.includes(item.codigo)
    ) {
      hallazgos.push({
        tipo: "no_reportado",
        item: item.concepto,
        detalle: `El ítem no consta como autorizado para el siniestro reportado: ${siniestroReportado.tipo_siniestro}.`,
        impacto_economico: redondear(item.cantidad * item.precio_unitario),
      });

      continue;
    }

    // Sobreprecio
    if (precioReferencia && item.precio_unitario > precioReferencia * 1.1) {
      hallazgos.push({
        tipo: "sobreprecio",
        item: item.concepto,
        detalle: `El precio unitario facturado ($${item.precio_unitario.toFixed(
          2
        )}) supera el tarifario acordado ($${precioReferencia.toFixed(
          2
        )}) en más del 10%.`,
        impacto_economico: redondear(
          (item.precio_unitario - precioReferencia) * item.cantidad
        ),
      });

      continue;
    }

    // Correcto
    hallazgos.push({
      tipo: "correcto",
      item: item.concepto,
      detalle:
        "El ítem está autorizado para el siniestro y respeta el tarifario acordado.",
      impacto_economico: 0,
    });
  }

  return hallazgos;
}

function combinarHallazgos(
  hallazgosBase: Hallazgo[],
  hallazgosIA: Hallazgo[] | undefined
) {
  const combinados: Hallazgo[] = [...hallazgosBase];

  if (!Array.isArray(hallazgosIA)) {
    return combinados;
  }

  for (const hallazgoIA of hallazgosIA) {
    const yaExiste = combinados.some(
      (h) =>
        h.tipo === hallazgoIA.tipo &&
        h.item.toLowerCase() === hallazgoIA.item.toLowerCase()
    );

    if (!yaExiste && hallazgoIA.item && hallazgoIA.detalle) {
      combinados.push({
        tipo: hallazgoIA.tipo,
        item: hallazgoIA.item,
        detalle: hallazgoIA.detalle,
        impacto_economico: Number(hallazgoIA.impacto_economico || 0),
      });
    }
  }

  return combinados;
}

function construirResultadoFinal(
  factura: Factura,
  resultadoIA: Partial<ResultadoAuditoria>
): ResultadoAuditoria {
  const hallazgosBase = generarHallazgosDeterministicos(factura);
  const hallazgos = combinarHallazgos(hallazgosBase, resultadoIA.hallazgos);

  const ahorroDetectado = redondear(
    hallazgos
      .filter(
        (h) =>
          h.tipo === "sobreprecio" ||
          h.tipo === "duplicado" ||
          h.tipo === "no_reportado"
      )
      .reduce((total, h) => total + Number(h.impacto_economico || 0), 0)
  );

  const tieneDuplicados = hallazgos.some((h) => h.tipo === "duplicado");
  const tieneNoReportados = hallazgos.some((h) => h.tipo === "no_reportado");
  const tieneSobreprecios = hallazgos.some((h) => h.tipo === "sobreprecio");
  const tieneInconsistenciaTotal = hallazgos.some(
    (h) => h.tipo === "inconsistencia_total"
  );

  let veredicto: ResultadoAuditoria["veredicto"] = "APROBADA";

  if (tieneDuplicados || tieneNoReportados) {
    veredicto = "RECHAZADA";
  } else if (tieneSobreprecios || tieneInconsistenciaTotal) {
    veredicto = "OBSERVADA";
  }

  let score = Number(resultadoIA.score_riesgo || 0);

  if (veredicto === "APROBADA") {
    score = 0;
  }

  if (veredicto === "OBSERVADA") {
    score = Math.max(score, tieneInconsistenciaTotal ? 65 : 55);
  }

  if (veredicto === "RECHAZADA") {
    score = Math.max(score, 85);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const totalAprobable = redondear(
    Math.max(0, factura.total_facturado - ahorroDetectado)
  );

  const hallazgosCriticos = hallazgos.filter(
    (h) => h.tipo !== "correcto" && h.tipo !== "inconsistencia_total"
  );

  const siniestroReportado = SINIESTROS_REPORTADOS.find(
    (s) => s.id === factura.siniestro_id
  );

  const analisisAgente =
    resultadoIA.analisis_agente ||
    `El agente revisó la factura ${factura.id}, comparó los ítems contra el tarifario vigente, verificó duplicados en el historial y contrastó la información con el siniestro reportado${
      siniestroReportado ? ` (${siniestroReportado.tipo_siniestro})` : ""
    }. Se identificaron ${hallazgosCriticos.length} hallazgo(s) económico(s) relevante(s).`;

  const recomendacion =
    resultadoIA.recomendacion ||
    (veredicto === "APROBADA"
      ? "Factura aprobada. No se encontraron discrepancias relevantes."
      : veredicto === "OBSERVADA"
      ? "Factura observada. Se recomienda solicitar aclaración o ajuste antes de aprobar el pago."
      : "Factura rechazada. Se recomienda escalar el caso a revisión humana y solicitar una nueva factura al taller.");

  return {
    veredicto,
    score_riesgo: score,
    hallazgos,
    total_facturado: factura.total_facturado,
    total_aprobable: totalAprobable,
    ahorro_detectado: ahorroDetectado,
    recomendacion,
    analisis_agente: analisisAgente,
    trazabilidad: [
      "Factura recibida desde el taller.",
      "Tarifario vigente consultado.",
      "Precios unitarios comparados contra valores acordados.",
      "Historial de siniestros revisado para detectar cobros duplicados.",
      "Siniestro reportado validado contra ítems facturados.",
      "Coherencia contable revisada entre total declarado y suma de ítems.",
      "Dictamen generado para apoyo del auditor humano.",
    ],
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar GEMINI_API_KEY en .env.local" },
        { status: 500 }
      );
    }

    const { factura } = await request.json();

    if (!factura) {
      return NextResponse.json(
        { error: "No se recibió ninguna factura para auditar" },
        { status: 400 }
      );
    }

    const siniestroReportado = SINIESTROS_REPORTADOS.find(
      (s) => s.id === factura.siniestro_id
    );

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Eres un agente auditor experto en facturación de siniestros para una aseguradora.

Analiza la factura y devuelve únicamente un JSON válido, sin markdown, sin texto adicional.

Debes comparar:
1. Factura enviada por el taller.
2. Tarifario acordado.
3. Historial de siniestros ya pagados.
4. Siniestro reportado y sus ítems autorizados.
5. Coherencia entre el total declarado y la suma de ítems.

Formato obligatorio:

{
  "veredicto": "APROBADA" | "OBSERVADA" | "RECHAZADA",
  "score_riesgo": 0,
  "hallazgos": [
    {
      "tipo": "sobreprecio" | "duplicado" | "no_reportado" | "inconsistencia_total" | "correcto",
      "item": "nombre del concepto",
      "detalle": "explicación breve",
      "impacto_economico": 0
    }
  ],
  "total_facturado": 0,
  "total_aprobable": 0,
  "ahorro_detectado": 0,
  "recomendacion": "recomendación para el auditor humano",
  "analisis_agente": "explicación narrativa del análisis realizado",
  "trazabilidad": [
    "paso 1",
    "paso 2",
    "paso 3"
  ]
}

Reglas:
1. Si el precio unitario supera en más del 10% el tarifario, marcar "sobreprecio".
2. Si un ítem ya fue cobrado en el historial del mismo siniestro, marcar "duplicado".
3. Si un ítem no está autorizado en el siniestro reportado, marcar "no_reportado".
4. Si la suma de ítems no coincide con el total declarado, marcar "inconsistencia_total".
5. No modifiques el total_facturado. Usa exactamente FACTURA.total_facturado.
6. El score_riesgo debe estar entre 0 y 100.
7. Si hay duplicados o ítems no reportados, el veredicto debe ser "RECHAZADA".
8. Si hay sobreprecios o inconsistencia de total, el veredicto debe ser "OBSERVADA".
9. Si no hay problemas, el veredicto debe ser "APROBADA".
10. La recomendación debe ser clara, ejecutiva y útil para un auditor humano.

FACTURA:
${JSON.stringify(factura, null, 2)}

TARIFARIO:
${JSON.stringify(TARIFA_REFERENCIA, null, 2)}

HISTORIAL DE SINIESTROS:
${JSON.stringify(HISTORIAL_SINIESTROS, null, 2)}

SINIESTRO REPORTADO:
${JSON.stringify(siniestroReportado || null, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Gemini no devolvió texto");
    }

    const resultadoIA = JSON.parse(text) as Partial<ResultadoAuditoria>;
    const resultadoFinal = construirResultadoFinal(factura, resultadoIA);

    return NextResponse.json(resultadoFinal);
  } catch (error) {
    console.error("Error en /api/auditar:", error);

    return NextResponse.json(
      { error: "Error al auditar la factura con IA" },
      { status: 500 }
    );
  }
}