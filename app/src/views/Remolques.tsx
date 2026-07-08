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
import { REMOLQUES, type Remolque } from '../data/remolques';

const RECORDS_PATH = 'apps.fulltrailer.remolques.records';

const CATEGORIAS = ['CAJA SECA 53', 'CAJA SECA 48', 'CAJA REFRIGERADA', 'PLATAFORMA', 'TOLVA', 'OTRO'];

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1,
  color: '#8A939B',
  marginBottom: 6,
};

function nextClave(remolques: Remolque[]): string {
  const max = remolques.reduce((acc, r) => {
    const n = Number(r.clave.replace(/\D/g, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `REM-${String(max + 1).padStart(3, '0')}`;
}

function emptyDraft(remolques: Remolque[]): Remolque {
  return {
    clave: nextClave(remolques),
    descripcion: '',
    marca: '',
    modelo: '',
    placas: '',
    numSerie: '',
    categoria: CATEGORIAS[0],
    activo: true,
    baseOperacion: '',
    status: null,
  };
}

function matches(remolque: Remolque, query: string): boolean {
  if (!query) return true;
  const haystack = `${remolque.clave} ${remolque.descripcion} ${remolque.placas ?? ''} ${remolque.numSerie}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function RemolqueCard({ remolque, onEdit }: { remolque: Remolque; onEdit: () => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'action.selected', color: 'text.primary' }}>
            <span className="material-symbols-rounded" aria-hidden="true">
              inventory_2
            </span>
          </Avatar>
        }
        title={remolque.clave}
        subheader={[remolque.marca, remolque.modelo].filter(Boolean).join(' · ') || '—'}
        action={
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ marginTop: 0.5, marginRight: 0.5 }}>
            <Chip
              label={remolque.activo ? 'Activo' : 'Inactivo'}
              size="small"
              sx={{
                backgroundColor: remolque.activo ? '#35B36B' : '#7C8390',
                color: '#0E1113',
                fontWeight: 600,
              }}
            />
            <IconButton size="small" aria-label={`Editar ${remolque.clave}`} onClick={onEdit}>
              <Icon name="edit" fontSize="1rem" />
            </IconButton>
          </Stack>
        }
      />
      <CardContent sx={{ paddingTop: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: 1.5, minHeight: 20 }}>
          {remolque.descripcion || '—'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ marginBottom: 1.5, flexWrap: 'wrap' }}>
          <Chip label={remolque.categoria} size="small" variant="outlined" />
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Placas: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{remolque.placas || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Serie: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{remolque.numSerie || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Base: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{remolque.baseOperacion || '—'}</Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Remolques() {
  const setRoute = useMeAction('apps.fulltrailer.route');
  const stored = useMeValue<Remolque[]>(RECORDS_PATH);
  const setRemolques = useMeAction(RECORDS_PATH);
  const remolques = stored ?? REMOLQUES;

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClave, setEditingClave] = useState<string | null>(null);
  const [draft, setDraft] = useState<Remolque>(() => emptyDraft(remolques));

  const goHome = () => setRoute('home');
  const patch = (changes: Partial<Remolque>) => setDraft((d) => ({ ...d, ...changes }));

  const openAdd = () => {
    setEditingClave(null);
    setDraft(emptyDraft(remolques));
    setModalOpen(true);
  };

  const openEdit = (remolque: Remolque) => {
    setEditingClave(remolque.clave);
    setDraft(remolque);
    setModalOpen(true);
  };

  const saveDraft = () => {
    if (!draft.clave.trim()) return;
    if (editingClave) {
      setRemolques(remolques.map((r: Remolque) => (r.clave === editingClave ? draft : r)));
    } else {
      setRemolques([...remolques, draft]);
    }
    setModalOpen(false);
  };

  const filtered = useMemo(() => remolques.filter((r: Remolque) => matches(r, query)), [remolques, query]);

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Remolques
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 1 }}>
            {filtered.length} de {remolques.length} remolques
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
            + Nuevo remolque
          </Button>
          <Button variant="outlined" onClick={goHome}>
            Volver
          </Button>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', padding: 6 }}>
          Ningún remolque coincide con "{query}".
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((remolque: Remolque) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={remolque.clave}>
              <RemolqueCard remolque={remolque} onEdit={() => openEdit(remolque)} />
            </Grid>
          ))}
        </Grid>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClave ? 'Editar remolque' : 'Nuevo remolque'}
        width={480}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Clave"
                value={draft.clave}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ clave: e.target.value })}
                fullWidth
                disabled={!!editingClave}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <label style={labelStyle}>TIPO DE CAJA</label>
              <select
                style={selectStyle}
                value={draft.categoria}
                onChange={(e) => patch({ categoria: e.target.value })}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Box>
          </Stack>
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
