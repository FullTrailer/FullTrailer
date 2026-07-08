import operadorCatalog from '../../../json/operador.json';

export interface Operador {
  clave: string;
  nombre: string;
  licencia: string;
  tipoLicencia: string;
  telefono: string | null;
  categoria: string;
  baseOperacion: string | null;
  activo: boolean;
  fechaIngreso: string | null;
  status: string | null;
  foto: string | null;
}

interface RawOperador {
  Clave: string;
  Nombre?: string | null;
  Licencia?: string | null;
  TipoLicencia?: string | null;
  Telefono?: string | null;
  Categoria?: string | null;
  BaseOperacion?: string | null;
  Activo?: number | null;
  FechaIngreso?: string | null;
  Status?: string | null;
  Foto?: string | null;
}

function normalize(raw: RawOperador): Operador {
  return {
    clave: raw.Clave,
    nombre: (raw.Nombre ?? '').trim(),
    licencia: raw.Licencia ?? '',
    tipoLicencia: raw.TipoLicencia ?? '',
    telefono: raw.Telefono ?? null,
    categoria: (raw.Categoria ?? '').trim() || 'SIN CATEGORÍA',
    baseOperacion: raw.BaseOperacion ?? null,
    activo: raw.Activo === 1,
    fechaIngreso: raw.FechaIngreso ?? null,
    status: raw.Status ?? null,
    foto: raw.Foto ?? null,
  };
}

export const OPERADORES: Operador[] = (operadorCatalog.datos as RawOperador[]).map(normalize);
