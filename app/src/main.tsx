import ME from 'this.me';
import { createWsMeRuntime } from 'this.gui/runtime';
import app from './app';
import { mountApp } from './runtime';
import 'this.gui/style.css';
import './index.css';

const me = ME();

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
const runtime = createWsMeRuntime(me, {
  semanticNamespace: 'fulltrailer.suis-macbook-air.local',
  transportOrigin: monadOrigin,
});

mountApp({ me, app, target: '#root', runtime });
