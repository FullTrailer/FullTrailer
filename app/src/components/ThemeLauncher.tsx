import { useState } from 'react';
import { Icon, ThemeModeToggle, ThemesCatalog, Modal } from 'this.gui';
import { Box, IconButton } from 'this.gui/atoms';

/**
 * this.gui ships a proper <ThemeLauncher> (popover-from-a-button) in its
 * source repo, but the installed this.gui@2.1.8 package never exports it
 * (dist has no compiled build of it, no subpath reaches it either) — so it
 * can't be imported here. Rendering ThemesCatalog inline in the LeftBar
 * footer doesn't work either: the footer column is only ~220px wide, and
 * every ThemesCatalog layout (grid/list/compact) either crams cards into
 * that width or needs an inline scrollbar to stay contained.
 *
 * this.gui's own docs describe exactly this situation: when content needs
 * more room than an inline slot allows, use <Modal> — "works with any
 * child components". So the catalog opens in a centered Modal instead of
 * expanding inside the sidebar.
 */
export default function ThemeLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
      <ThemeModeToggle variant="minimal" />
      <IconButton size="small" aria-label="Elegir tema" onClick={() => setOpen(true)}>
        <Icon name="palette" fontSize="1.1rem" />
      </IconButton>

      <Modal open={open} onClose={() => setOpen(false)} title="Elegir tema" width={680}>
        <Box sx={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <ThemesCatalog compact minimal />
        </Box>
      </Modal>
    </Box>
  );
}
