"use client";

import { useState } from "react";
import { TarifaCard } from "@/components/tarifa-card";
import { HistorialCard } from "@/components/historial-card";
import { FacturasList } from "@/components/facturas-list";
import { AuditoriaResult } from "@/components/auditoria-result";
import { StatsCard } from "@/components/stats-card";
import { AgregarFacturaForm } from "@/components/agregar-factura-form";
import {
  type Factura,
  type Hallazgo,
  type ResultadoAuditoria,
  TARIFA_REFERENCIA,
  HISTORIAL_SINIESTROS,
  SINIESTROS_REPORTADOS,
  FACTURAS,
} from "@/lib/data";
import {
  FileText,
  Shield,
  TrendingDown,
  AlertTriangle,
  Zap,
  Plus,
} from "lucide-react";

function redondear(valor: number) {
  return Number(valor.toFixed(2));
}

function auditarFacturaLocal(factura: Factura): ResultadoAuditoria {
  const hallazgos: Hallazgo[] = [];

  const sumaItems = redondear(
    factura.items.reduce(
      (total, item) => total + item.cantidad * item.precio_unitario,
      0
    )
  );

  const diferenciaTotal = redondear(sumaItems - factura.total_facturado);

  const siniestroReportado = SINIESTROS_REPORTADOS.find(
    (s) => s.id === factura.siniestro_id
  );

  const historial = HISTORIAL_SINIESTROS.find(
    (s) => s.id === factura.siniestro_id
  );

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

  for (const item of factura.items) {
    const precioReferencia = TARIFA_REFERENCIA[item.codigo];

    if (historial && historial.items_cobrados.includes(item.codigo)) {
      hallazgos.push({
        tipo: "duplicado",
        item: item.concepto,
        detalle: `Este ítem ya fue cobrado en el siniestro ${historial.id}, registrado el ${historial.fecha}.`,
        impacto_economico: redondear(item.cantidad * item.precio_unitario),
      });

      continue;
    }

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

    hallazgos.push({
      tipo: "correcto",
      item: item.concepto,
      detalle:
        "El ítem está autorizado para el siniestro y respeta el tarifario acordado.",
      impacto_economico: 0,
    });
  }

  const ahorroDetectado = redondear(
    hallazgos
      .filter(
        (h) =>
          h.tipo === "sobreprecio" ||
          h.tipo === "duplicado" ||
          h.tipo === "no_reportado"
      )
      .reduce((total, h) => total + h.impacto_economico, 0)
  );

  const tieneDuplicados = hallazgos.some((h) => h.tipo === "duplicado");
  const tieneNoReportados = hallazgos.some((h) => h.tipo === "no_reportado");
  const tieneSobreprecios = hallazgos.some((h) => h.tipo === "sobreprecio");
  const tieneInconsistenciaTotal = hallazgos.some(
    (h) => h.tipo === "inconsistencia_total"
  );

  let veredicto: ResultadoAuditoria["veredicto"] = "APROBADA";
  let scoreRiesgo = 0;

  if (tieneDuplicados || tieneNoReportados) {
    veredicto = "RECHAZADA";
    scoreRiesgo = 90;
  } else if (tieneSobreprecios || tieneInconsistenciaTotal) {
    veredicto = "OBSERVADA";
    scoreRiesgo = tieneInconsistenciaTotal ? 65 : 55;
  }

  const recomendacion =
    veredicto === "APROBADA"
      ? "Factura aprobada. No se encontraron discrepancias relevantes."
      : veredicto === "OBSERVADA"
      ? "Factura observada. Se recomienda solicitar aclaración o ajuste antes de aprobar el pago."
      : "Factura rechazada. Se recomienda escalar el caso a revisión humana y solicitar una nueva factura al taller.";

  return {
    veredicto,
    score_riesgo: scoreRiesgo,
    hallazgos,
    total_facturado: factura.total_facturado,
    total_aprobable: redondear(
      Math.max(0, factura.total_facturado - ahorroDetectado)
    ),
    ahorro_detectado: ahorroDetectado,
    recomendacion,
    analisis_agente: `El agente revisó la factura ${factura.id}, comparó sus ítems contra el tarifario vigente, verificó el historial de siniestros y contrastó la información con el siniestro reportado.`,
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

export function AuditorDashboard() {
  const [facturas, setFacturas] = useState<Factura[]>(FACTURAS);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [resultado, setResultado] = useState<ResultadoAuditoria | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleSelectFactura = async (factura: Factura) => {
    setSelectedFactura(factura);
    setIsLoading(true);
    setResultado(null);

    try {
      const response = await fetch("/api/auditar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ factura }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error devuelto por la API:", data);

        const result = auditarFacturaLocal(factura);
        setResultado(result);
        return;
      }

      console.log("Resultado generado por IA:", data);
      setResultado(data);
    } catch (error) {
      console.error("Falló la auditoría con IA:", error);

      const result = auditarFacturaLocal(factura);
      setResultado(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgregarFactura = (nuevaFactura: Factura) => {
    setFacturas((prev) => [nuevaFactura, ...prev]);
    setMostrarFormulario(false);
    handleSelectFactura(nuevaFactura);
  };

  const totalFacturado = facturas.reduce(
    (acc, factura) => acc + factura.total_facturado,
    0
  );

  const alertasActivas = facturas.filter((factura) => {
    const sumaItems = factura.items.reduce(
      (total, item) => total + item.cantidad * item.precio_unitario,
      0
    );

    return Math.abs(sumaItems - factura.total_facturado) > 0.01;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">shecodes</h1>
                <p className="text-xs text-muted-foreground">
                  Auditor Agéntico de Siniestros
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Sistema activo
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Facturas Pendientes"
            value={facturas.length}
            icon={<FileText className="h-5 w-5" />}
            color="primary"
          />

          <StatsCard
            label="Total a Revisar"
            value={`$${totalFacturado.toFixed(0)}`}
            icon={<Shield className="h-5 w-5" />}
            color="warning"
          />

          <StatsCard
            label="Historial"
            value={HISTORIAL_SINIESTROS.length}
            icon={<TrendingDown className="h-5 w-5" />}
            color="success"
          />

          <StatsCard
            label="Alertas Activas"
            value={alertasActivas}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <TarifaCard />
            <HistorialCard />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => setMostrarFormulario((prev) => !prev)}
              className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {mostrarFormulario ? "Ocultar formulario" : "Agregar factura"}
            </button>

            {mostrarFormulario && (
              <AgregarFacturaForm
                onAgregarFactura={handleAgregarFactura}
                onCancelar={() => setMostrarFormulario(false)}
              />
            )}

            <FacturasList
              facturas={facturas}
              onSelectFactura={handleSelectFactura}
              selectedFacturaId={selectedFactura?.id}
            />
          </div>

          <div className="lg:col-span-5">
            <AuditoriaResult
              factura={selectedFactura}
              resultado={resultado}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>
              El agente verifica automáticamente: precios contra tarifario,
              cobros duplicados, siniestro reportado, coherencia contable y
              recomendación para el auditor humano.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}