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
import { TRACTOS, configuracionDe, type Tracto, type Configuracion } from '../data/tractos';
import { REMOLQUES, type Remolque } from '../data/remolques';
import { DOLLIES, type Dolly } from '../data/dollies';
import { useFuelByClave } from '../data/samsaraFuel';

const RECORDS_PATH = 'apps.fulltrailer.tractos.records';
const REMOLQUES_RECORDS_PATH = 'apps.fulltrailer.remolques.records';
const DOLLIES_RECORDS_PATH = 'apps.fulltrailer.dollies.records';

const CATEGORY_ICON: Record<string, string> = {
  TRACTOCAMION: 'local_shipping',
  GRUA: 'construction',
  AUTOBUS: 'directions_bus',
  UTILITARIA: 'directions_car',
  TRACTOR: 'agriculture',
};

const CONFIG_LABEL: Record<Configuracion, string> = {
  solo: 'Solo tracto',
  remolque: 'Con remolque',
  doble: 'Doble',
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1,
  color: '#8A939B',
  marginBottom: 6,
};

function iconFor(categoria: string): string {
  return CATEGORY_ICON[categoria] ?? 'local_shipping';
}

function nextClave(tractos: Tracto[]): string {
  const max = tractos.reduce((acc, t) => {
    const n = Number(t.clave.replace(/\D/g, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `TRG-${String(max + 1).padStart(3, '0')}`;
}

function emptyDraft(tractos: Tracto[]): Tracto {
  return {
    clave: nextClave(tractos),
    descripcion: 'TRACTOCAMION',
    marca: '',
    modelo: '',
    placas: '',
    numSerie: '',
    categoria: 'TRACTOCAMION',
    tipo: '',
    activo: true,
    baseOperacion: '',
    status: null,
    idRemolque1: null,
    idDolly: null,
    idRemolque2: null,
  };
}

function matches(tracto: Tracto, query: string): boolean {
  if (!query) return true;
  const haystack = `${tracto.clave} ${tracto.descripcion} ${tracto.marca} ${tracto.placas ?? ''} ${tracto.numSerie}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function ConfiguracionIcon({ config }: { config: Configuracion }) {
  const trailers = config === 'doble' ? 2 : config === 'remolque' ? 1 : 0;
  return (
    <Stack direction="row" spacing={0} alignItems="center">
      <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 20 }}>
        local_shipping
      </span>
      {Array.from({ length: trailers }).map((_, i) => (
        <span
          key={i}
          className="material-symbols-rounded"
          aria-hidden="true"
          style={{ fontSize: 16, marginLeft: 2, opacity: 0.85 }}
        >
          inventory_2
        </span>
      ))}
    </Stack>
  );
}

function fuelColor(pct: number): string {
  if (pct >= 50) return '#35B36B';
  if (pct >= 20) return '#E8792B';
  return '#E5484D';
}

function TractoCard({ tracto, onEdit, fuelPercent }: { tracto: Tracto; onEdit: () => void; fuelPercent: number | null }) {
  const config = configuracionDe(tracto);
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
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ marginTop: 0.5, marginRight: 0.5 }}>
            <Chip
              label={tracto.activo ? 'Activo' : 'Inactivo'}
              size="small"
              sx={{
                backgroundColor: tracto.activo ? '#35B36B' : '#7C8390',
                color: '#0E1113',
                fontWeight: 600,
              }}
            />
            <IconButton size="small" aria-label={`Editar ${tracto.clave}`} onClick={onEdit}>
              <Icon name="edit" fontSize="1rem" />
            </IconButton>
          </Stack>
        }
      />
      <CardContent sx={{ paddingTop: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: 1.5, minHeight: 20 }}>
          {tracto.descripcion || '—'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ marginBottom: 1.5, flexWrap: 'wrap' }}>
          <ConfiguracionIcon config={config} />
          <Chip label={CONFIG_LABEL[config]} size="small" variant="outlined" />
          {fuelPercent != null ? (
            <Chip
              icon={<span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">local_gas_station</span>}
              label={`${fuelPercent}%`}
              size="small"
              sx={{ backgroundColor: fuelColor(fuelPercent), color: '#0E1113', fontWeight: 600 }}
            />
          ) : (
            <Chip label="Sin GPS" size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
          )}
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
  const stored = useMeValue<Tracto[]>(RECORDS_PATH);
  const setTractos = useMeAction(RECORDS_PATH);
  const tractos = stored ?? TRACTOS;
  const fuelByClave = useFuelByClave();
  const storedRemolques = useMeValue<Remolque[]>(REMOLQUES_RECORDS_PATH);
  const remolques = storedRemolques ?? REMOLQUES;
  const storedDollies = useMeValue<Dolly[]>(DOLLIES_RECORDS_PATH);
  const dollies = storedDollies ?? DOLLIES;

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClave, setEditingClave] = useState<string | null>(null);
  const [draft, setDraft] = useState<Tracto>(() => emptyDraft(tractos));

  const goHome = () => setRoute('home');
  const patch = (changes: Partial<Tracto>) => setDraft((d) => ({ ...d, ...changes }));

  const openAdd = () => {
    setEditingClave(null);
    setDraft(emptyDraft(tractos));
    setModalOpen(true);
  };

  const openEdit = (tracto: Tracto) => {
    setEditingClave(tracto.clave);
    setDraft(tracto);
    setModalOpen(true);
  };

  const saveDraft = () => {
    if (!draft.clave.trim()) return;
    if (editingClave) {
      setTractos(tractos.map((t: Tracto) => (t.clave === editingClave ? draft : t)));
    } else {
      setTractos([...tractos, draft]);
    }
    setModalOpen(false);
  };

  const filtered = useMemo(() => tractos.filter((t: Tracto) => matches(t, query)), [tractos, query]);

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Tractos
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 1 }}>
            {filtered.length} de {tractos.length} tractocamiones
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
          <Button variant="contained" onClick={openAdd}>
            + Nuevo tracto
          </Button>
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
          {filtered.map((tracto: Tracto) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tracto.clave}>
              <TractoCard
                tracto={tracto}
                onEdit={() => openEdit(tracto)}
                fuelPercent={fuelByClave[tracto.clave]?.fuelPercent ?? null}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClave ? 'Editar tracto' : 'Nuevo tracto'}
        width={520}
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
              <TextField
                label="Descripción"
                value={draft.descripcion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ descripcion: e.target.value })}
                fullWidth
              />
            </Box>
          </Stack>
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

          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}>
            CONFIGURACIÓN
          </Typography>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <label style={labelStyle}>REMOLQUE 1</label>
              <select
                style={selectStyle}
                value={draft.idRemolque1 ?? ''}
                onChange={(e) => patch({ idRemolque1: e.target.value || null })}
              >
                <option value="">— sin remolque —</option>
                {remolques.map((r: Remolque) => (
                  <option key={r.clave} value={r.clave}>
                    {r.clave} — {r.categoria}
                  </option>
                ))}
              </select>
            </Box>
            <Box sx={{ flex: 1 }}>
              <label style={labelStyle}>DOLLY (CONVERTIDOR)</label>
              <select
                style={selectStyle}
                value={draft.idDolly ?? ''}
                onChange={(e) => {
                  const idDolly = e.target.value || null;
                  patch({ idDolly, idRemolque2: idDolly ? draft.idRemolque2 : null });
                }}
              >
                <option value="">— sin dolly —</option>
                {dollies.map((d: Dolly) => (
                  <option key={d.clave} value={d.clave}>
                    {d.clave}
                  </option>
                ))}
              </select>
            </Box>
          </Stack>
          {draft.idDolly && (
            <Box>
              <label style={labelStyle}>REMOLQUE 2</label>
              <select
                style={selectStyle}
                value={draft.idRemolque2 ?? ''}
                onChange={(e) => patch({ idRemolque2: e.target.value || null })}
              >
                <option value="">— sin remolque —</option>
                {remolques.map((r: Remolque) => (
                  <option key={r.clave} value={r.clave}>
                    {r.clave} — {r.categoria}
                  </option>
                ))}
              </select>
            </Box>
          )}

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
