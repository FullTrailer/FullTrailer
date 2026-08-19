import remolqueCatalog from '../../../blueprints/json/remolques.json';

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

// blueprints/json/remolques.json only carries ID_Remolque + Descripcion —
// none of the richer fields (Marca, Modelo, Placas, Categoria, Activo,
// BaseOperacion, Status) exist in this catalog yet. Views already render
// missing values as '—', so this maps what's real and leaves the rest
// genuinely empty rather than inventing placeholder data.
interface RawRemolque {
  ID_Remolque: string;
  Descripcion?: string | null;
}

function normalize(raw: RawRemolque): Remolque {
  return {
    clave: raw.ID_Remolque,
    descripcion: (raw.Descripcion ?? '').trim(),
    marca: '',
    modelo: '',
    placas: null,
    numSerie: '',
    categoria: 'SIN CATEGORÍA',
    activo: true,
    baseOperacion: null,
    status: null,
  };
}

export const REMOLQUES: Remolque[] = (remolqueCatalog as RawRemolque[]).map(normalize);
