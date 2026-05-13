"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TARIFA_REFERENCIA, TARIFA_LABELS } from "@/lib/data";

export function TarifaCard() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Tarifario Vigente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(TARIFA_REFERENCIA).map(([codigo, precio]) => (
          <div
            key={codigo}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <span className="text-sm text-foreground">
              {TARIFA_LABELS[codigo] || codigo}
            </span>
            <span className="text-sm font-mono text-primary">
              ${precio.toFixed(2)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
