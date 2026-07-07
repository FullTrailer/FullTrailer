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
  };
}

export const TRACTOS: Tracto[] = (tractoCatalog.datos as RawTracto[]).map(normalize);
