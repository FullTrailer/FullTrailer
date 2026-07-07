import { useState } from 'react';
import { Icon, ThemeModeToggle, ThemesCatalog } from 'this.gui';
import { Box, IconButton } from 'this.gui/atoms';

/**
 * this.gui's own <ThemeLauncher> isn't exported by the installed this.gui
 * package yet, so this rebuilds the same idea (mode toggle + expandable
 * theme catalog) from pieces that are: ThemeModeToggle + ThemesCatalog.
 */
export default function ThemeLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
        <ThemeModeToggle variant="minimal" />
        <IconButton
          size="small"
          aria-label={open ? 'Ocultar temas' : 'Elegir tema'}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'expand_less' : 'palette'} fontSize="1.1rem" />
        </IconButton>
      </Box>
      {open && (
        <ThemesCatalog sidebarView="expanded" minimal hideTitle sx={{ width: '100%', marginTop: 1 }} />
      )}
    </Box>
  );
}
