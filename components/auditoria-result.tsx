"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type Factura,
  type ResultadoAuditoria,
  SINIESTROS_REPORTADOS,
} from "@/lib/data";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingDown,
  ArrowUpRight,
  Copy,
  DollarSign,
  ClipboardCheck,
  FileWarning,
  Download,
  UserCheck,
  MessageSquareWarning,
} from "lucide-react";

interface AuditoriaResultProps {
  factura: Factura | null;
  resultado: ResultadoAuditoria | null;
  isLoading: boolean;
}

function getVeredictoIcon(veredicto: string) {
  switch (veredicto) {
    case "APROBADA":
      return <CheckCircle2 className="h-6 w-6 text-success" />;
    case "OBSERVADA":
      return <AlertTriangle className="h-6 w-6 text-warning" />;
    case "RECHAZADA":
      return <XCircle className="h-6 w-6 text-destructive" />;
    default:
      return null;
  }
}

function getVeredictoColor(veredicto: string) {
  switch (veredicto) {
    case "APROBADA":
      return "text-success bg-success/10 border-success/30";
    case "OBSERVADA":
      return "text-warning bg-warning/10 border-warning/30";
    case "RECHAZADA":
      return "text-destructive bg-destructive/10 border-destructive/30";
    default:
      return "";
  }
}

function getHallazgoIcon(tipo: string) {
  switch (tipo) {
    case "sobreprecio":
      return <ArrowUpRight className="h-4 w-4 text-warning" />;
    case "duplicado":
      return <Copy className="h-4 w-4 text-destructive" />;
    case "no_reportado":
      return <FileWarning className="h-4 w-4 text-destructive" />;
    case "inconsistencia_total":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "correcto":
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
}

function getHallazgoBadgeColor(tipo: string) {
  switch (tipo) {
    case "correcto":
      return "bg-success/10 text-success";
    case "sobreprecio":
      return "bg-warning/10 text-warning";
    case "duplicado":
    case "no_reportado":
      return "bg-destructive/10 text-destructive";
    case "inconsistencia_total":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function AuditoriaResult({
  factura,
  resultado,
  isLoading,
}: AuditoriaResultProps) {
  const [decisionHumana, setDecisionHumana] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Auditando factura...</p>
              <p className="text-sm text-muted-foreground mt-1">
                El agente está analizando tarifario, historial, siniestro y
                consistencia contable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resultado || !factura) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">
              Selecciona una factura para auditar
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              El sistema verificará precios, duplicados, siniestro reportado y
              anomalías.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const siniestroReportado = SINIESTROS_REPORTADOS.find(
    (s) => s.id === factura.siniestro_id
  );

  const hallazgos = resultado.hallazgos || [];

  const handleExportarReporte = () => {
    const reporte = {
      factura,
      siniestro_reportado: siniestroReportado || null,
      resultado,
      decision_humana: decisionHumana,
      generado_en: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reporte, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `reporte-auditoria-${factura.id}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Resultado de Auditoría
          </span>
          <span className="text-xs font-mono">{factura.id}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div
          className={`p-4 rounded-lg border ${getVeredictoColor(
            resultado.veredicto
          )}`}
        >
          <div className="flex items-center gap-3">
            {getVeredictoIcon(resultado.veredicto)}
            <div>
              <p className="font-semibold text-lg">{resultado.veredicto}</p>
              <p className="text-sm opacity-80">
                Score de riesgo: {resultado.score_riesgo}/100
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Facturado</p>
            <p className="text-lg font-semibold text-foreground">
              ${resultado.total_facturado.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Aprobable</p>
            <p className="text-lg font-semibold text-success">
              ${resultado.total_aprobable.toFixed(2)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ahorro</p>
            <p className="text-lg font-semibold text-primary flex items-center justify-center gap-1">
              <TrendingDown className="h-4 w-4" />$
              {resultado.ahorro_detectado.toFixed(2)}
            </p>
          </div>
        </div>

        {siniestroReportado && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Siniestro reportado
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {siniestroReportado.tipo_siniestro}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {siniestroReportado.descripcion}
            </p>

            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">
                Evidencias requeridas:
              </p>

              <div className="flex flex-wrap gap-2">
                {siniestroReportado.evidencias_requeridas.map((evidencia) => (
                  <span
                    key={evidencia}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {evidencia}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Hallazgos
          </p>

          {hallazgos.length === 0 ? (
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sin hallazgos críticos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No se detectaron sobreprecios, duplicados, ítems no
                    reportados ni inconsistencias contables.
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block bg-success/10 text-success">
                    correcto
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {hallazgos.map((hallazgo, index) => (
                <div
                  key={`${hallazgo.tipo}-${hallazgo.item}-${index}`}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-start gap-2">
                    {getHallazgoIcon(hallazgo.tipo)}

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {hallazgo.item}
                        </span>

                        {hallazgo.impacto_economico > 0 && (
                          <span className="text-xs font-mono text-destructive">
                            -${hallazgo.impacto_economico.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        {hallazgo.detalle}
                      </p>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${getHallazgoBadgeColor(
                          hallazgo.tipo
                        )}`}
                      >
                        {hallazgo.tipo}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {resultado.analisis_agente && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquareWarning className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Análisis del agente IA
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {resultado.analisis_agente}
            </p>
          </div>
        )}

        {resultado.trazabilidad && resultado.trazabilidad.length > 0 && (
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Trazabilidad de auditoría
              </p>
            </div>

            <ol className="space-y-2">
              {resultado.trazabilidad.map((paso, index) => (
                <li
                  key={`${paso}-${index}`}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span>{paso}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-primary font-medium mb-1">Recomendación</p>
          <p className="text-sm text-foreground">{resultado.recomendacion}</p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Decisión del auditor humano
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setDecisionHumana("Aprobar pago")}
              className="text-sm px-3 py-2 rounded-lg bg-success/10 text-success border border-success/20 hover:bg-success/20"
            >
              Aprobar pago
            </button>

            <button
              onClick={() => setDecisionHumana("Solicitar corrección")}
              className="text-sm px-3 py-2 rounded-lg bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20"
            >
              Solicitar corrección
            </button>

            <button
              onClick={() => setDecisionHumana("Rechazar factura")}
              className="text-sm px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
            >
              Rechazar factura
            </button>

            <button
              onClick={() => setDecisionHumana("Escalar a auditor")}
              className="text-sm px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            >
              Escalar a auditor
            </button>
          </div>

          {decisionHumana && (
            <p className="text-xs text-muted-foreground mt-3">
              Decisión registrada:{" "}
              <span className="text-primary font-medium">
                {decisionHumana}
              </span>
            </p>
          )}
        </div>

        <button
          onClick={handleExportarReporte}
          className="w-full text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar reporte de auditoría
        </button>
      </CardContent>
    </Card>
  );
}