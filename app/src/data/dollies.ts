import dollyCatalog from '../../../blueprints/json/dollies.json';

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

// blueprints/json/dollies.json only carries ID_Dolly + Descripcion — same
// gap as remolques.ts, see that file's comment.
interface RawDolly {
  ID_Dolly: string;
  Descripcion?: string | null;
}

function normalize(raw: RawDolly): Dolly {
  return {
    clave: raw.ID_Dolly,
    descripcion: (raw.Descripcion ?? '').trim(),
    marca: '',
    modelo: '',
    placas: null,
    numSerie: '',
    activo: true,
    baseOperacion: null,
    status: null,
  };
}

export const DOLLIES: Dolly[] = (dollyCatalog as RawDolly[]).map(normalize);
