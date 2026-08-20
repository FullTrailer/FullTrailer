import { createRoot } from 'react-dom/client';
import { createWsMeRuntime } from 'this.gui/runtime';
import { SeedSessionProvider } from 'this.gui/react';
import app from './app';
import RootGate from './RootGate';
import 'this.gui/style.css';
import './index.css';

// Talks to FullTrailer through netget's public /apps/:name route — no
// dedicated subdomain, no new /etc/hosts entry. /apps/fulltrailer is the
// canonical, user-facing address; /monads/fulltrailer (same handler today)
// stays as the internal/infra/debug route. Every .me/NRP read, write, and
// live subscription crosses local.netget/apps/fulltrailer, not a bespoke
// REST API; netget strips the /apps/fulltrailer prefix before it reaches
// the monad process (see monad/.env's MONAD_SELF_TAGS for how the monad
// still resolves the right namespace regardless of which host/alias
// reached it). Override via VITE_MONAD_ORIGIN if your local setup differs.
const monadOrigin = import.meta.env.VITE_MONAD_ORIGIN || 'http://local.netget/apps/fulltrailer';

const el = document.querySelector('#root');
if (!el) throw new Error('main: #root not found');

createRoot(el).render(
  <SeedSessionProvider
    transportOrigin={monadOrigin}
    // createSeedSession() defaults to createMeRuntime(me) — local-only, no
    // network subscribe. Override with the WS-backed adapter so a real
    // SeedSession still gets live cross-client updates over /nrp.
    createRuntime={(me, ctx) => createWsMeRuntime(me, ctx)}
  >
    <RootGate app={app} />
  </SeedSessionProvider>,
);
