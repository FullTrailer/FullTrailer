import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme, Layout } from 'this.gui';
import { MeRuntimeProvider, useMeAction, useMeValue, useOptionalMeRuntimeContext } from 'this.gui/react';
import type { MeLike } from 'this.gui/react';
import {
  declareApp,
  isSpecViewFactory,
  SpecBoundary,
  writeMeValue,
} from 'this.gui/runtime';
import type { AppDeclaration } from 'this.gui/runtime';
import type { RuntimeAdapter } from 'this.gui/runtime';
import ThemeLauncher from './components/ThemeLauncher';

export type { AppDeclaration };

export interface MountAppOptions {
  me: MeLike;
  app: AppDeclaration;
  target: string;
  /**
   * Optional runtime adapter — e.g. createWsMeRuntime() for a live monad
   * connection. Falls back to MeRuntimeProvider's own default (a local-only
   * createMeRuntime(me)) when omitted, same as before this option existed.
   */
  runtime?: RuntimeAdapter;
}

/**
 * Reads the current route from .me and renders the matching view. Route
 * changes (e.g. from a nav button calling writeMeValue) re-render this
 * automatically since useMeValue subscribes to that path.
 *
 * FullTrailer keeps this custom (the package's own mountApp() picks a view
 * once from window.location.pathname at mount time — it has no equivalent
 * to "route stored in .me, nav highlights the active item" reactivity) but
 * defers to the real isSpecViewFactory()/SpecBoundary for anything tagged
 * with defineSpecView(), the same way the package's own mountApp() does —
 * without this branch, a spec-tree view would be called as `<View/>` and
 * React would receive a plain GuiSpecNode object back instead of an
 * element ("Objects are not valid as a React child").
 *
 * The Suspense wrapper is for app.ts's lazy()-wrapped views (see its own
 * comment) — a plain component doesn't need it (lazy()'s own promise
 * resolves before render either way), but a lazy one throws a promise on
 * first render, and only a Suspense ancestor can catch that.
 *
 * SpecBoundary's `runtime` prop is explicit, not context-aware — passing
 * nothing here silently falls back to the renderer's identity-passthrough
 * defaultAdapter, so a spec view's {read: ...} tokens would just echo the
 * raw path string back instead of resolving. Pull the real adapter (the
 * one createWsMeRuntime() built in main.tsx) out of MeRuntimeProvider's own
 * context and hand it down explicitly.
 */
function ActiveView({ app }: { app: AppDeclaration }) {
  const route = useMeValue<string>(`${app.namespace}.route`);
  const runtimeContext = useOptionalMeRuntimeContext();
  const view = app.views[route ?? ''] ?? app.views.home;
  if (isSpecViewFactory(view)) {
    return <SpecBoundary spec={view()} runtime={runtimeContext?.runtime} />;
  }
  const View = view as React.ComponentType;
  return (
    <Suspense fallback={null}>
      <View />
    </Suspense>
  );
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
 * Declares the app in .me, then mounts it: Theme -> MeRuntimeProvider ->
 * AppShell (nav + Layout) -> active view.
 */
export function mountApp({ me, app, target, runtime }: MountAppOptions): void {
  declareApp(me, app);

  const el = document.querySelector(target);
  if (!el) throw new Error(`mountApp: target "${target}" not found`);

  const initialPath = window.location.pathname.replace(/^\/+/, '') || 'home';
  writeMeValue(me, `${app.namespace}.route`, app.views[initialPath] ? initialPath : 'home');

  createRoot(el).render(
    <Theme initialThemeId={app.theme}>
      <MeRuntimeProvider me={me} runtime={runtime}>
        <AppShell app={app} />
      </MeRuntimeProvider>
    </Theme>,
  );
}

/**
 * App shell: reads the current route to build the LeftBar nav with the
 * active item highlighted, then renders Layout -> active view.
 */
function AppShell({ app }: { app: AppDeclaration }) {
  const route = useMeValue<string>(`${app.namespace}.route`) ?? 'home';
  const setRoute = useMeAction(`${app.namespace}.route`);

  const elements = NAV_ITEMS.map(({ route: r, label, icon }) => ({
    type: 'link' as const,
    props: {
      label,
      icon,
      active: route === r,
      onClick: () => setRoute(r),
    },
  }));

  return (
    <Layout
      LeftBar={{
        initialView: 'expanded',
        elements,
        footerElements: [
          { type: 'action', props: { element: <ThemeLauncher /> } },
        ],
      }}
    >
      <ActiveView app={app} />
    </Layout>
  );
}
