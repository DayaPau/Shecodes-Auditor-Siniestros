"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HISTORIAL_SINIESTROS, TARIFA_LABELS } from "@/lib/data";

export function HistorialCard() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-chart-1" />
          Historial de Siniestros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {HISTORIAL_SINIESTROS.map((siniestro) => (
          <div
            key={siniestro.id}
            className="p-3 rounded-lg bg-secondary/50 border border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-mono text-primary">
                {siniestro.id}
              </span>
              <span className="text-xs text-muted-foreground">
                {siniestro.fecha}
              </span>
            </div>
            <div className="text-sm text-foreground mb-1">{siniestro.taller}</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {siniestro.items_cobrados.map((item) => (
                <span
                  key={item}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {TARIFA_LABELS[item] || item}
                </span>
              ))}
            </div>
            <div className="text-sm font-semibold text-success">
              ${siniestro.monto_aprobado.toFixed(2)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
