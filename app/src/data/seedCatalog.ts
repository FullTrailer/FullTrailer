import type { SeedSession } from 'this.gui/react';
import { TRACTOS, type Tracto } from './tractos';
import { REMOLQUES } from './remolques';
import { DOLLIES } from './dollies';
import { OPERADORES } from './operadores';

const TRACTOS_PATH = 'apps.fulltrailer.tractos.records';
const REMOLQUES_PATH = 'apps.fulltrailer.remolques.records';
const DOLLIES_PATH = 'apps.fulltrailer.dollies.records';
const OPERADORES_PATH = 'apps.fulltrailer.operadores.records';

// tracto.json carries 4 duplicate Claves (TRG-025, TRG-048, TRG-470,
// TRG-494) — dedupe once here, at the source, instead of leaving every
// future reader of TRACTOS to hit the React key-collision bug.
function dedupeByClave(tractos: Tracto[]): Tracto[] {
  const seen = new Set<string>();
  return tractos.filter((t) => {
    if (seen.has(t.clave)) return false;
    seen.add(t.clave);
    return true;
  });
}

/**
 * One-time migration: imports the bundled JSON mockup catalogs into .me,
 * once per fresh kernel. Idempotent — only writes a path that's still
 * empty, so calling this on every login is safe and cheap once seeded.
 * Views read exclusively from .me after this; the JSON stays only as
 * seed/mockup data consumed here, never imported at render time.
 */
export async function seedFullTrailerCatalog(session: SeedSession): Promise<void> {
  const seeds: Array<[string, unknown[]]> = [
    [TRACTOS_PATH, dedupeByClave(TRACTOS)],
    [REMOLQUES_PATH, REMOLQUES],
    [DOLLIES_PATH, DOLLIES],
    [OPERADORES_PATH, OPERADORES],
  ];

  for (const [path, value] of seeds) {
    const current = session.read(path);
    if (current != null) continue;
    await session.write(path, value);
  }
}
