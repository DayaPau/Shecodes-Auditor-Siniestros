"use client";

import { useMemo, useState } from "react";
import {
  type Factura,
  type FacturaItem,
  SINIESTROS_REPORTADOS,
  TARIFA_LABELS,
  TARIFA_REFERENCIA,
} from "@/lib/data";
import { Plus, Trash2, Save, Calculator } from "lucide-react";

interface AgregarFacturaFormProps {
  onAgregarFactura: (factura: Factura) => void;
  onCancelar: () => void;
}

function generarFacturaId() {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `FAC-2025-${numero}`;
}

const CODIGOS_TARIFARIO = Object.keys(TARIFA_REFERENCIA);

export function AgregarFacturaForm({
  onAgregarFactura,
  onCancelar,
}: AgregarFacturaFormProps) {
  const [id, setId] = useState(generarFacturaId);
  const [siniestroId, setSiniestroId] = useState(
    SINIESTROS_REPORTADOS[0]?.id || ""
  );
  const [taller, setTaller] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [totalFacturado, setTotalFacturado] = useState("");

  const [items, setItems] = useState<FacturaItem[]>([
    {
      concepto: TARIFA_LABELS.mano_de_obra_hora,
      codigo: "mano_de_obra_hora",
      cantidad: 1,
      precio_unitario: TARIFA_REFERENCIA.mano_de_obra_hora,
    },
  ]);

  const sumaItems = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.cantidad * item.precio_unitario,
      0
    );
  }, [items]);

  const actualizarItem = (index: number, cambios: Partial<FacturaItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...cambios } : item))
    );
  };

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        concepto: TARIFA_LABELS.cambio_parabrisas,
        codigo: "cambio_parabrisas",
        cantidad: 1,
        precio_unitario: TARIFA_REFERENCIA.cambio_parabrisas,
      },
    ]);
  };

  const eliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const usarSumaComoTotal = () => {
    setTotalFacturado(sumaItems.toFixed(2));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!id.trim()) {
      alert("Ingresa el ID de la factura.");
      return;
    }

    if (!siniestroId) {
      alert("Selecciona un siniestro.");
      return;
    }

    if (!taller.trim()) {
      alert("Ingresa el nombre del taller.");
      return;
    }

    if (items.length === 0) {
      alert("Agrega al menos un ítem.");
      return;
    }

    const itemsValidos = items.every(
      (item) =>
        item.concepto.trim() &&
        item.codigo.trim() &&
        item.cantidad > 0 &&
        item.precio_unitario >= 0
    );

    if (!itemsValidos) {
      alert("Revisa los ítems. Todos deben tener concepto, cantidad y precio.");
      return;
    }

    const total = Number(totalFacturado);

    if (Number.isNaN(total) || total < 0) {
      alert("Ingresa un total facturado válido.");
      return;
    }

    const nuevaFactura: Factura = {
      id: id.trim(),
      siniestro_id: siniestroId,
      taller: taller.trim(),
      fecha,
      total_facturado: total,
      items: items.map((item) => ({
        concepto: item.concepto.trim(),
        codigo: item.codigo,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
      })),
    };

    onAgregarFactura(nuevaFactura);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Agregar nueva factura
          </p>
          <p className="text-xs text-muted-foreground">
            Crea una factura de prueba para auditar con el agente IA.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancelar}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">ID factura</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="FAC-2025-0001"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Siniestro</label>
          <select
            value={siniestroId}
            onChange={(e) => setSiniestroId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            {SINIESTROS_REPORTADOS.map((siniestro) => (
              <option key={siniestro.id} value={siniestro.id}>
                {siniestro.id} - {siniestro.tipo_siniestro}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Taller</label>
          <input
            value={taller}
            onChange={(e) => setTaller(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="Nombre del taller"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            Ítems facturados
          </p>

          <button
            type="button"
            onClick={agregarItem}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Agregar ítem
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg bg-secondary/30 border border-border/50 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Ítem #{index + 1}
                </p>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarItem(index)}
                    className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Código tarifario
                  </label>
                  <select
                    value={item.codigo}
                    onChange={(e) => {
                      const codigo = e.target.value;
                      actualizarItem(index, {
                        codigo,
                        concepto: TARIFA_LABELS[codigo] || codigo,
                        precio_unitario: TARIFA_REFERENCIA[codigo] || 0,
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {CODIGOS_TARIFARIO.map((codigo) => (
                      <option key={codigo} value={codigo}>
                        {TARIFA_LABELS[codigo]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Concepto
                  </label>
                  <input
                    value={item.concepto}
                    onChange={(e) =>
                      actualizarItem(index, { concepto: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.cantidad}
                    onChange={(e) =>
                      actualizarItem(index, {
                        cantidad: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Precio unitario
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precio_unitario}
                    onChange={(e) =>
                      actualizarItem(index, {
                        precio_unitario: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Subtotal:{" "}
                <span className="text-primary font-medium">
                  ${(item.cantidad * item.precio_unitario).toFixed(2)}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Suma de ítems</p>
            <p className="text-lg font-semibold text-primary">
              ${sumaItems.toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            onClick={usarSumaComoTotal}
            className="text-xs px-3 py-2 rounded-lg bg-secondary text-foreground border border-border hover:bg-secondary/80 flex items-center gap-1"
          >
            <Calculator className="h-3 w-3" />
            Usar como total
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">
            Total facturado declarado
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalFacturado}
            onChange={(e) => setTotalFacturado(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="Ej: 1200.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Puedes poner un valor diferente a la suma de ítems para probar la
            alerta de inconsistencia contable.
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        Guardar y auditar factura
      </button>
    </form>
  );
}