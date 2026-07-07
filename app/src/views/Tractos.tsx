import { useMemo, useState } from 'react';
import {
  Typography,
  Button,
  TextField,
  Chip,
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
} from 'this.gui/atoms';
import { Grid, Stack } from 'this.gui/molecules';
import { useMeAction } from 'this.gui/react';
import { TRACTOS, type Tracto } from '../data/tractos';

const CATEGORY_ICON: Record<string, string> = {
  TRACTOCAMION: 'local_shipping',
  GRUA: 'construction',
  AUTOBUS: 'directions_bus',
  UTILITARIA: 'directions_car',
  TRACTOR: 'agriculture',
};

function iconFor(categoria: string): string {
  return CATEGORY_ICON[categoria] ?? 'local_shipping';
}

function matches(tracto: Tracto, query: string): boolean {
  if (!query) return true;
  const haystack = `${tracto.clave} ${tracto.descripcion} ${tracto.marca} ${tracto.placas ?? ''} ${tracto.numSerie}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function TractoCard({ tracto }: { tracto: Tracto }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'action.selected', color: 'text.primary' }}>
            <span className="material-symbols-rounded" aria-hidden="true">
              {iconFor(tracto.categoria)}
            </span>
          </Avatar>
        }
        title={tracto.clave}
        subheader={[tracto.marca, tracto.modelo].filter(Boolean).join(' · ') || '—'}
        action={
          <Chip
            label={tracto.activo ? 'Activo' : 'Inactivo'}
            size="small"
            sx={{
              backgroundColor: tracto.activo ? '#35B36B' : '#7C8390',
              color: '#0E1113',
              fontWeight: 600,
              marginTop: 1,
              marginRight: 1,
            }}
          />
        }
      />
      <CardContent sx={{ paddingTop: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: 1.5, minHeight: 20 }}>
          {tracto.descripcion || '—'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ marginBottom: 1.5, flexWrap: 'wrap' }}>
          <Chip label={tracto.categoria} size="small" variant="outlined" />
          {tracto.tipo && <Chip label={tracto.tipo} size="small" variant="outlined" />}
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Placas: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{tracto.placas || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Serie: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{tracto.numSerie || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Base: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{tracto.baseOperacion || '—'}</Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Tractos() {
  const setRoute = useMeAction('apps.fulltrailer.route');
  const [query, setQuery] = useState('');

  const goHome = () => setRoute('home');

  const filtered = useMemo(() => TRACTOS.filter((t) => matches(t, query)), [query]);

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Tractos
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 1 }}>
            {filtered.length} de {TRACTOS.length} tractocamiones
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Buscar por clave, marca, placas..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            size="small"
            sx={{ width: 280 }}
          />
          <Button variant="outlined" onClick={goHome}>
            Volver
          </Button>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', padding: 6 }}>
          Ningún tracto coincide con "{query}".
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((tracto) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tracto.clave}>
              <TractoCard tracto={tracto} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
