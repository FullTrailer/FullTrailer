import type { Tracto, Configuracion } from './tractos';
import { configuracionDe } from './tractos';
import type { Remolque } from './remolques';
import type { Dolly } from './dollies';

export type FacturaEstatus = 'pendiente' | 'timbrada';

export interface FacturaDetalle {
  folio: string;
  fecha: string;
  concepto: string;
  km: number;
  tarifaKm: number;
  estatus: FacturaEstatus;
}

export interface Importes {
  subtotal: number;
  iva: number;
  total: number;
}

export interface Facturable {
  folio: string;
  tracto: Tracto;
  configuracion: Configuracion;
  remolque1: Remolque | null;
  dolly: Dolly | null;
  remolque2: Remolque | null;
}

export const IVA_RATE = 0.16;

export const ESTATUS_LABEL: Record<FacturaEstatus, string> = {
  pendiente: 'Pendiente de timbrar',
  timbrada: 'Timbrada',
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function importesDe(km: number, tarifaKm: number): Importes {
  const subtotal = round2(km * tarifaKm);
  const iva = round2(subtotal * IVA_RATE);
  return { subtotal, iva, total: round2(subtotal + iva) };
}

export function emptyDetalle(folio: string): FacturaDetalle {
  return {
    folio,
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    km: 0,
    tarifaKm: 0,
    estatus: 'pendiente',
  };
}

/**
 * Extrae las unidades facturables directo de la configuración de cada
 * tracto (idRemolque1/idDolly/idRemolque2 + facturaFolio ya asignado en
 * Tractos), en vez de mantener un catálogo de facturas por separado.
 */
export function buildFacturables(tractos: Tracto[], remolques: Remolque[], dollies: Dolly[]): Facturable[] {
  return tractos
    .filter((t) => !!t.facturaFolio)
    .map((t) => ({
      folio: t.facturaFolio as string,
      tracto: t,
      configuracion: configuracionDe(t),
      remolque1: t.idRemolque1 ? remolques.find((r) => r.clave === t.idRemolque1) ?? null : null,
      dolly: t.idDolly ? dollies.find((d) => d.clave === t.idDolly) ?? null : null,
      remolque2: t.idRemolque2 ? remolques.find((r) => r.clave === t.idRemolque2) ?? null : null,
    }));
}
