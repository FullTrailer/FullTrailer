import { createRoot } from 'react-dom/client';
import { Theme, Layout } from 'this.gui';
import { MeRuntimeProvider, useMeAction, useMeValue } from 'this.gui/react';
import { writeMeValue } from 'this.gui/runtime';
import type { MeLike } from 'this.gui/react';
import ThemeLauncher from './components/ThemeLauncher';

export interface AppDeclaration {
  id: string;
  namespace: string;
  title: string;
  theme?: string;
  views: Record<string, React.ComponentType>;
}

/**
 * Writes the app's manifest + view registry into the given .me instance,
 * under its own namespace. Declares that this app exists in this space —
 * does not store executable code, only metadata/references.
 */
export function declareApp(me: MeLike, app: AppDeclaration): void {
  writeMeValue(me, `${app.namespace}.manifest`, {
    id: app.id,
    title: app.title,
    theme: app.theme,
  });
  writeMeValue(me, `${app.namespace}.views`, Object.keys(app.views));
}

export interface MountAppOptions {
  me: MeLike;
  app: AppDeclaration;
  target: string;
}

/**
 * Reads the current route from .me and renders the matching view. Route
 * changes (e.g. from a nav button calling writeMeValue) re-render this
 * automatically since useMeValue subscribes to that path.
 */
function ActiveView({ app }: { app: AppDeclaration }) {
  const route = useMeValue<string>(`${app.namespace}.route`);
  const View = app.views[route ?? ''] ?? app.views.home;
  return <View />;
}

const NAV_ITEMS = [
  { route: 'home', label: 'Inicio', icon: 'home' },
  { route: 'unidades', label: 'Unidades', icon: 'view_list' },
  { route: 'tractos', label: 'Tractos', icon: 'local_shipping' },
];

/**
 * Declares the app in .me, then mounts it: Theme -> MeRuntimeProvider ->
 * AppShell (nav + Layout) -> active view.
 */
export function mountApp({ me, app, target }: MountAppOptions): void {
  declareApp(me, app);

  const el = document.querySelector(target);
  if (!el) throw new Error(`mountApp: target "${target}" not found`);

  const initialPath = window.location.pathname.replace(/^\/+/, '') || 'home';
  writeMeValue(me, `${app.namespace}.route`, app.views[initialPath] ? initialPath : 'home');

  createRoot(el).render(
    <Theme initialThemeId={app.theme}>
      <MeRuntimeProvider me={me}>
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
