import { lazy } from 'react';
import type { AppDeclaration } from 'this.gui/runtime';
import Home from './views/Home';

// Lazy — not a style choice, a fault boundary: each of these still imports
// fleet data (../data/*.ts -> ../../../json/*.json) that's currently
// missing from the working tree. app.ts used to import all 7 views eagerly,
// so ES module resolution failing on any ONE of these broke the whole
// module graph (and thus the whole app, including Home, which has no such
// dependency) before a single view ever rendered. Wrapping each in lazy()
// isolates that failure to whichever view is actually navigated to.
const UnitsConfig = lazy(() => import('./views/UnitsConfig'));
const Tractos = lazy(() => import('./views/Tractos'));
const Operadores = lazy(() => import('./views/Operadores'));
const Remolques = lazy(() => import('./views/Remolques'));
const Dollies = lazy(() => import('./views/Dollies'));
const Facturas = lazy(() => import('./views/Facturas'));

const app: AppDeclaration = {
  id: 'fulltrailer',
  namespace: 'apps.fulltrailer',
  title: 'FullTrailer',
  theme: 'neurons.me',
  views: {
    home: Home,
    // Not just a LazyExoticComponent-vs-ComponentType mismatch — this.gui's
    // own compiled .d.ts resolves ComponentType against ITS @types/react
    // (18.x, from this.gui's own node_modules), a structurally different
    // nominal type from this app's @types/react (19.x, ReactNode gained
    // `bigint`). No cast narrower than `any` bridges two different major
    // React type versions across a package boundary — this is a real,
    // known class of problem (not something specific to lazy()), not
    // something to keep chasing with tighter casts.
    unidades: UnitsConfig as any,
    tractos: Tractos as any,
    operadores: Operadores as any,
    remolques: Remolques as any,
    dollies: Dollies as any,
    facturas: Facturas as any,
  },
};

export default app;
