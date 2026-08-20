import { AppShell as GenericAppShell } from 'this.gui/runtime';
import type { MeLike } from 'this.gui/react';
import type { AppDeclaration } from 'this.gui/runtime';
import type { RuntimeAdapter } from 'this.gui/runtime';

export type { AppDeclaration };

export interface FullTrailerAppProps {
  me: MeLike;
  app: AppDeclaration;
  runtime?: RuntimeAdapter;
}

const NAV_ITEMS = [
  { route: 'home', label: 'Inicio', icon: 'home' },
  { route: 'unidades', label: 'Unidades', icon: 'view_list' },
  { route: 'tractos', label: 'Tractos', icon: 'local_shipping' },
  { route: 'remolques', label: 'Remolques', icon: 'inventory_2' },
  { route: 'dollies', label: 'Dollies', icon: 'rv_hookup' },
  { route: 'operadores', label: 'Operadores', icon: 'badge' },
  { route: 'facturas', label: 'Facturas', icon: 'receipt_long' },
];

/**
 * The authenticated FullTrailer app. Everything that used to live here
 * (Theme, SelectionProvider/RuntimeInspector, MeRuntimeProvider, the mixed
 * spec-tree/React route renderer, the LeftBar nav wiring) was generic —
 * zero trucks-specific logic — so it's been extracted to `this.gui/runtime`'s
 * `AppShell`. `NAV_ITEMS` is the one thing that's actually FullTrailer's own.
 */
export function FullTrailerApp({ me, app, runtime }: FullTrailerAppProps) {
  return <GenericAppShell app={app} me={me} runtime={runtime} navItems={NAV_ITEMS} />;
}
