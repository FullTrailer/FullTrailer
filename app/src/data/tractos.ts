import tractoCatalog from '../../../json/tracto.json';

export interface Tracto {
  clave: string;
  descripcion: string;
  marca: string;
  modelo: string;
  placas: string | null;
  numSerie: string;
  categoria: string;
  tipo: string;
  activo: boolean;
  baseOperacion: string | null;
  status: string | null;
  idRemolque1: string | null;
  idDolly: string | null;
  idRemolque2: string | null;
  facturaFolio: string | null;
}

interface RawTracto {
  Clave: string;
  Descripcion?: string | null;
  Marca?: string | null;
  Modelo?: string | number | null;
  Placas?: string | null;
  NumSerie?: string | null;
  Categoria?: string | null;
  Tipo?: string | null;
  Activo?: number | null;
  BaseOperacion?: string | null;
  Status?: string | null;
  ID_Remolque1?: string | null;
  ID_Dolly?: string | null;
  ID_Remolque2?: string | null;
}

export type Configuracion = 'solo' | 'remolque' | 'doble';

export function configuracionDe(tracto: Tracto): Configuracion {
  if (tracto.idDolly && tracto.idRemolque2) return 'doble';
  if (tracto.idRemolque1) return 'remolque';
  return 'solo';
}

function normalize(raw: RawTracto): Tracto {
  return {
    clave: raw.Clave,
    descripcion: (raw.Descripcion ?? '').trim(),
    marca: raw.Marca ?? '',
    modelo: raw.Modelo != null ? String(raw.Modelo) : '',
    placas: raw.Placas ?? null,
    numSerie: raw.NumSerie ?? '',
    categoria: (raw.Categoria ?? '').trim() || 'SIN CATEGORÍA',
    tipo: raw.Tipo ?? '',
    activo: raw.Activo === 1,
    baseOperacion: raw.BaseOperacion ?? null,
    status: raw.Status ?? null,
    idRemolque1: raw.ID_Remolque1 ?? null,
    idDolly: raw.ID_Dolly ?? null,
    idRemolque2: raw.ID_Remolque2 ?? null,
    facturaFolio: null,
  };
}

export const TRACTOS: Tracto[] = (tractoCatalog.datos as RawTracto[]).map(normalize);
