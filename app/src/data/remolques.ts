import remolqueCatalog from '../../../json/remolque.json';

export interface Remolque {
  clave: string;
  descripcion: string;
  marca: string;
  modelo: string;
  placas: string | null;
  numSerie: string;
  categoria: string;
  activo: boolean;
  baseOperacion: string | null;
  status: string | null;
}

interface RawRemolque {
  Clave: string;
  Descripcion?: string | null;
  Marca?: string | null;
  Modelo?: string | number | null;
  Placas?: string | null;
  NumSerie?: string | null;
  Categoria?: string | null;
  Activo?: number | null;
  BaseOperacion?: string | null;
  Status?: string | null;
}

function normalize(raw: RawRemolque): Remolque {
  return {
    clave: raw.Clave,
    descripcion: (raw.Descripcion ?? '').trim(),
    marca: raw.Marca ?? '',
    modelo: raw.Modelo != null ? String(raw.Modelo) : '',
    placas: raw.Placas ?? null,
    numSerie: raw.NumSerie ?? '',
    categoria: (raw.Categoria ?? '').trim() || 'SIN CATEGORÍA',
    activo: raw.Activo === 1,
    baseOperacion: raw.BaseOperacion ?? null,
    status: raw.Status ?? null,
  };
}

export const REMOLQUES: Remolque[] = (remolqueCatalog.datos as RawRemolque[]).map(normalize);
