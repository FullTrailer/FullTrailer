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
  IconButton,
} from 'this.gui/atoms';
import { Icon, Modal } from 'this.gui';
import { Grid, Stack } from 'this.gui/molecules';
import { useMeAction, useMeValue } from 'this.gui/react';
import { DOLLIES, type Dolly } from '../data/dollies';

const RECORDS_PATH = 'apps.fulltrailer.dollies.records';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1,
  color: '#8A939B',
  marginBottom: 6,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#0E1113',
  border: '1px solid #2A3036',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#E8EBED',
  fontFamily: 'inherit',
  fontSize: 13.5,
  outline: 'none',
};

function nextClave(dollies: Dolly[]): string {
  const max = dollies.reduce((acc, d) => {
    const n = Number(d.clave.replace(/\D/g, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `DLY-${String(max + 1).padStart(3, '0')}`;
}

function emptyDraft(dollies: Dolly[]): Dolly {
  return {
    clave: nextClave(dollies),
    descripcion: '',
    marca: '',
    modelo: '',
    placas: '',
    numSerie: '',
    activo: true,
    baseOperacion: '',
    status: null,
  };
}

function matches(dolly: Dolly, query: string): boolean {
  if (!query) return true;
  const haystack = `${dolly.clave} ${dolly.descripcion} ${dolly.placas ?? ''} ${dolly.numSerie}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function DollyCard({ dolly, onEdit }: { dolly: Dolly; onEdit: () => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'action.selected', color: 'text.primary' }}>
            <span className="material-symbols-rounded" aria-hidden="true">
              rv_hookup
            </span>
          </Avatar>
        }
        title={dolly.clave}
        subheader={[dolly.marca, dolly.modelo].filter(Boolean).join(' · ') || '—'}
        action={
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ marginTop: 0.5, marginRight: 0.5 }}>
            <Chip
              label={dolly.activo ? 'Activo' : 'Inactivo'}
              size="small"
              sx={{
                backgroundColor: dolly.activo ? '#35B36B' : '#7C8390',
                color: '#0E1113',
                fontWeight: 600,
              }}
            />
            <IconButton size="small" aria-label={`Editar ${dolly.clave}`} onClick={onEdit}>
              <Icon name="edit" fontSize="1rem" />
            </IconButton>
          </Stack>
        }
      />
      <CardContent sx={{ paddingTop: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: 1.5, minHeight: 20 }}>
          {dolly.descripcion || '—'}
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Placas: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{dolly.placas || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Serie: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{dolly.numSerie || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Base: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{dolly.baseOperacion || '—'}</Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Dollies() {
  const setRoute = useMeAction('apps.fulltrailer.route');
  const stored = useMeValue<Dolly[]>(RECORDS_PATH);
  const setDollies = useMeAction(RECORDS_PATH);
  const dollies = stored ?? DOLLIES;

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClave, setEditingClave] = useState<string | null>(null);
  const [draft, setDraft] = useState<Dolly>(() => emptyDraft(dollies));

  const goHome = () => setRoute('home');
  const patch = (changes: Partial<Dolly>) => setDraft((d) => ({ ...d, ...changes }));

  const openAdd = () => {
    setEditingClave(null);
    setDraft(emptyDraft(dollies));
    setModalOpen(true);
  };

  const openEdit = (dolly: Dolly) => {
    setEditingClave(dolly.clave);
    setDraft(dolly);
    setModalOpen(true);
  };

  const saveDraft = () => {
    if (!draft.clave.trim()) return;
    if (editingClave) {
      setDollies(dollies.map((d: Dolly) => (d.clave === editingClave ? draft : d)));
    } else {
      setDollies([...dollies, draft]);
    }
    setModalOpen(false);
  };

  const filtered = useMemo(() => dollies.filter((d: Dolly) => matches(d, query)), [dollies, query]);

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Dollies
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 1 }}>
            {filtered.length} de {dollies.length} dollies
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Buscar por clave, placas, serie..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            size="small"
            sx={{ width: 280 }}
          />
          <Button variant="contained" onClick={openAdd}>
            + Nuevo dolly
          </Button>
          <Button variant="outlined" onClick={goHome}>
            Volver
          </Button>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', padding: 6 }}>
          Ningún dolly coincide con "{query}".
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((dolly: Dolly) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dolly.clave}>
              <DollyCard dolly={dolly} onEdit={() => openEdit(dolly)} />
            </Grid>
          ))}
        </Grid>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClave ? 'Editar dolly' : 'Nuevo dolly'}
        width={480}
      >
        <Stack spacing={2}>
          <TextField
            label="Clave"
            value={draft.clave}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ clave: e.target.value })}
            fullWidth
            disabled={!!editingClave}
          />
          <TextField
            label="Descripción"
            value={draft.descripcion}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ descripcion: e.target.value })}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Marca"
                value={draft.marca}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ marca: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Modelo"
                value={draft.modelo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ modelo: e.target.value })}
                fullWidth
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Placas"
                value={draft.placas ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ placas: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Número de serie"
                value={draft.numSerie}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ numSerie: e.target.value })}
                fullWidth
              />
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Base de operación"
                value={draft.baseOperacion ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ baseOperacion: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <label style={labelStyle}>ESTATUS</label>
              <select
                style={selectStyle}
                value={draft.activo ? '1' : '0'}
                onChange={(e) => patch({ activo: e.target.value === '1' })}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button variant="text" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={saveDraft} disabled={!draft.clave.trim()}>
              Guardar
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Box>
  );
}
