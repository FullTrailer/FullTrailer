// Home.ts — mirrors the original views/Home.tsx exactly, as this.gui's
// first real defineSpecView() consumer (the feature had zero real callers
// anywhere — see this.gui's own review notes). Most of the layout is a
// static spec tree with one live {read: ...} token; the units count (a
// computed .length) and the two buttons' click handlers (navigate to a
// fixed in-app route / an off-app URL) aren't expressible as static
// read/write tokens — the token system has no computed values and no way
// to bind a literal payload to a write token — so those three pieces stay
// small real components, referenced directly by `type` (a real component
// reference, not a string) so no separate registry needs wiring into
// ActiveView's SpecBoundary just to resolve them.
import { defineSpecView } from 'this.gui/runtime';
import type { GuiSpecNode } from 'this.gui/runtime';
import { Button, Chip, Typography } from 'this.gui/atoms';
import { Hero, Stack } from 'this.gui/molecules';
import { useMeAction, useMeValue } from 'this.gui/react';

const HERO_IMAGE = 'https://res.cloudinary.com/dkwnxf6gm/image/upload/v1781493143/entire_vehicle_including_both_the_tractor_and_the_trailer_in_a_unified_minimal_j7nod6.png';
// The `me/` prefix isn't optional decoration — the renderer's read/write
// tokens are deny-by-default against an expression allowlist (default
// roots: me/views/, me/public/, me/, me://, self:, kernel:); an
// unprefixed dotted path gets silently blocked and the raw path string
// renders instead of the resolved value. See renderer.ts's
// isAllowedExpression().
const TITLE_PATH = 'me/apps.fulltrailer.manifest.title';

function UnitsCountChip() {
  const units = useMeValue<unknown[]>('apps.fulltrailer.unidades.units') || [];
  return (
    <Chip
      label={`${units.length} unidades configuradas`}
      variant="outlined"
      sx={{ color: '#fff', borderColor: '#fff' }}
    />
  );
}

function StartButton() {
  const setRoute = useMeAction('apps.fulltrailer.route');
  return (
    <Button variant="contained" size="large" onClick={() => setRoute('unidades')}>
      Iniciar
    </Button>
  );
}

function DesignButton() {
  return (
    <Button
      variant="outlined"
      size="large"
      onClick={() => { window.location.href = '/rafagas-del-golfo.html'; }}
      sx={{ color: '#fff', borderColor: '#fff' }}
    >
      Diseñar
    </Button>
  );
}

function createHomeSpec(): GuiSpecNode {
  return {
    type: Hero,
    props: {
      backgroundSrc: HERO_IMAGE,
      backgroundType: 'image',
      blur: 'heavy',
      height: '100vh',
      mode: 'left',
      padding: { xs: 3, md: 8 },
      contentMaxWidth: 680,
    },
    provenance: { source: 'views/Home.ts' },
    children: {
      type: Stack,
      props: { spacing: 2, alignItems: 'flex-start' },
      children: [
        {
          type: Typography,
          props: { variant: 'h1', sx: { color: '#fff' }, children: { read: TITLE_PATH } },
          provenance: {
            source: 'views/Home.ts#title',
            semanticPath: TITLE_PATH,
            note: 'App title, read live from the kernel manifest written by declareApp().',
          },
        },
        {
          type: Typography,
          props: { variant: 'h5', sx: { color: '#fff' }, children: 'Making Logistics Go Algorithmic.' },
          provenance: { source: 'views/Home.ts#subtitle', note: 'Static copy — no kernel binding.' },
        },
        {
          type: Stack,
          props: { direction: 'row', spacing: 2, alignItems: 'center', sx: { marginTop: 1 } },
          children: [
            { type: StartButton, provenance: { source: 'views/Home.ts#start' } },
            { type: DesignButton, provenance: { source: 'views/Home.ts#design' } },
            { type: UnitsCountChip, provenance: { source: 'views/Home.ts#unitsCount' } },
          ],
        },
      ],
    },
  };
}

export default defineSpecView(createHomeSpec);
