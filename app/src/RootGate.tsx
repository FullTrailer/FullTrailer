import { useSeedSession } from 'this.gui/react';
import { FullTrailerApp } from './runtime';
import type { AppDeclaration } from './runtime';
import Landing from './views/Landing';

export interface RootGateProps {
  app: AppDeclaration;
}

/**
 * The session gate: unauthenticated visitors see Landing (which drives the
 * real claim/open handshake); once authenticated, the real app mounts with
 * the session's own me/runtime — never the reverse.
 *
 * Named RootGate, not App: a file named App.tsx collides with the existing
 * app.ts (AppDeclaration) on a case-insensitive filesystem (default on
 * macOS) — Vite's dev server resolved `./App` to app.ts's default export
 * (a plain object), and React threw "Element type is invalid ... got:
 * object" trying to render it. Real bug, not a fluke — keep this name.
 */
export default function RootGate({ app }: RootGateProps) {
  const { authenticated, session } = useSeedSession();

  if (!authenticated || !session) {
    return <Landing />;
  }

  return <FullTrailerApp me={session.me} app={app} runtime={session.runtime} />;
}
