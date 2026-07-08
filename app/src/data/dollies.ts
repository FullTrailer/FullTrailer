import dollyCatalog from '../../../json/dolly.json';

export interface Dolly {
  clave: string;
  descripcion: string;
  marca: string;
  modelo: string;
  placas: string | null;
  numSerie: string;
  activo: boolean;
  baseOperacion: string | null;
  status: string | null;
}

interface RawDolly {
  Clave: string;
  Descripcion?: string | null;
  Marca?: string | null;
  Modelo?: string | number | null;
  Placas?: string | null;
  NumSerie?: string | null;
  Activo?: number | null;
  BaseOperacion?: string | null;
  Status?: string | null;
}

function normalize(raw: RawDolly): Dolly {
  return {
    clave: raw.Clave,
    descripcion: (raw.Descripcion ?? '').trim(),
    marca: raw.Marca ?? '',
    modelo: raw.Modelo != null ? String(raw.Modelo) : '',
    placas: raw.Placas ?? null,
    numSerie: raw.NumSerie ?? '',
    activo: raw.Activo === 1,
    baseOperacion: raw.BaseOperacion ?? null,
    status: raw.Status ?? null,
  };
}

export const DOLLIES: Dolly[] = (dollyCatalog.datos as RawDolly[]).map(normalize);
