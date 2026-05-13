"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Factura } from "@/lib/data";
import { ArrowRight, FileText } from "lucide-react";

interface FacturasListProps {
  facturas: Factura[];
  onSelectFactura: (factura: Factura) => void;
  selectedFacturaId?: string;
}

export function FacturasList({
  facturas,
  onSelectFactura,
  selectedFacturaId,
}: FacturasListProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-warning" />
          Facturas Pendientes
        </CardTitle>
      </CardHeader>

      <CardContent>
        {facturas.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No hay facturas pendientes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {facturas.map((factura) => {
              const isSelected = selectedFacturaId === factura.id;

              return (
                <button
                  key={factura.id}
                  type="button"
                  onClick={() => onSelectFactura(factura)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-primary mt-0.5" />

                      <div>
                        <p className="font-semibold text-foreground">
                          {factura.id}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {factura.taller}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Siniestro: {factura.siniestro_id}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {factura.fecha}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xl font-semibold text-foreground">
                      ${factura.total_facturado.toFixed(2)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {factura.items.length} ítems
                    </p>
                  </div>

                  <div className="flex items-center justify-end mt-4">
                    <span className="text-sm text-primary font-medium flex items-center gap-2">
                      Auditar
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}