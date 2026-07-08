import { useMemo, useRef, useState } from 'react';
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
import { OPERADORES, type Operador } from '../data/operadores';
import { uploadImage } from '../data/uploads';

const RECORDS_PATH = 'apps.fulltrailer.operadores.records';

const CATEGORIAS = ['LOCAL', 'FORÁNEO', 'INTERNACIONAL'];
const TIPOS_LICENCIA = ['Federal Tipo E', 'Federal Tipo B', 'Estatal'];

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

function nextClave(operadores: Operador[]): string {
  const max = operadores.reduce((acc, o) => {
    const n = Number(o.clave.replace(/\D/g, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `OP-${String(max + 1).padStart(3, '0')}`;
}

function emptyDraft(operadores: Operador[]): Operador {
  return {
    clave: nextClave(operadores),
    nombre: '',
    licencia: '',
    tipoLicencia: TIPOS_LICENCIA[0],
    telefono: '',
    categoria: CATEGORIAS[0],
    baseOperacion: '',
    activo: true,
    fechaIngreso: '',
    status: null,
    foto: null,
  };
}

function matches(operador: Operador, query: string): boolean {
  if (!query) return true;
  const haystack = `${operador.clave} ${operador.nombre} ${operador.licencia} ${operador.baseOperacion ?? ''}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function OperadorCard({ operador, onEdit }: { operador: Operador; onEdit: () => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar src={operador.foto ?? undefined} sx={{ bgcolor: 'action.selected', color: 'text.primary' }}>
            <span className="material-symbols-rounded" aria-hidden="true">
              badge
            </span>
          </Avatar>
        }
        title={operador.nombre}
        subheader={operador.clave}
        action={
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ marginTop: 0.5, marginRight: 0.5 }}>
            <Chip
              label={operador.activo ? 'Activo' : 'Inactivo'}
              size="small"
              sx={{
                backgroundColor: operador.activo ? '#35B36B' : '#7C8390',
                color: '#0E1113',
                fontWeight: 600,
              }}
            />
            <IconButton size="small" aria-label={`Editar ${operador.nombre}`} onClick={onEdit}>
              <Icon name="edit" fontSize="1rem" />
            </IconButton>
          </Stack>
        }
      />
      <CardContent sx={{ paddingTop: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', marginBottom: 1.5, minHeight: 20 }}>
          {operador.tipoLicencia || '—'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ marginBottom: 1.5, flexWrap: 'wrap' }}>
          <Chip label={operador.categoria} size="small" variant="outlined" />
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Licencia: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{operador.licencia || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Teléfono: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{operador.telefono || '—'}</Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Base: <Typography component="span" variant="caption" sx={{ color: 'text.primary' }}>{operador.baseOperacion || '—'}</Typography>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Operadores() {
  const setRoute = useMeAction('apps.fulltrailer.route');
  const stored = useMeValue<Operador[]>(RECORDS_PATH);
  const setOperadores = useMeAction(RECORDS_PATH);
  const operadores = stored ?? OPERADORES;

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClave, setEditingClave] = useState<string | null>(null);
  const [draft, setDraft] = useState<Operador>(() => emptyDraft(operadores));
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const goHome = () => setRoute('home');
  const patch = (changes: Partial<Operador>) => setDraft((d) => ({ ...d, ...changes }));

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFotoError(null);
    setUploadingFoto(true);
    try {
      const url = await uploadImage(file);
      patch({ foto: url });
    } catch (err) {
      setFotoError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploadingFoto(false);
    }
  };

  const openAdd = () => {
    setEditingClave(null);
    setDraft(emptyDraft(operadores));
    setFotoError(null);
    setModalOpen(true);
  };

  const openEdit = (operador: Operador) => {
    setEditingClave(operador.clave);
    setDraft(operador);
    setFotoError(null);
    setModalOpen(true);
  };

  const saveDraft = () => {
    if (!draft.nombre.trim()) return;
    if (editingClave) {
      setOperadores(operadores.map((o: Operador) => (o.clave === editingClave ? draft : o)));
    } else {
      setOperadores([...operadores, draft]);
    }
    setModalOpen(false);
  };

  const filtered = useMemo(() => operadores.filter((o: Operador) => matches(o, query)), [operadores, query]);

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Operadores
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 1 }}>
            {filtered.length} de {operadores.length} operadores
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Buscar por nombre, licencia, base..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            size="small"
            sx={{ width: 280 }}
          />
          <Button variant="contained" onClick={openAdd}>
            + Nuevo operador
          </Button>
          <Button variant="outlined" onClick={goHome}>
            Volver
          </Button>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', padding: 6 }}>
          Ningún operador coincide con "{query}".
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((operador: Operador) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={operador.clave}>
              <OperadorCard operador={operador} onEdit={() => openEdit(operador)} />
            </Grid>
          ))}
        </Grid>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClave ? 'Editar operador' : 'Nuevo operador'}
        width={480}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={draft.foto ?? undefined} sx={{ width: 64, height: 64, bgcolor: 'action.selected', color: 'text.primary' }}>
              <span className="material-symbols-rounded" aria-hidden="true">
                badge
              </span>
            </Avatar>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fotoInputRef.current?.click()}
                  disabled={uploadingFoto}
                >
                  {uploadingFoto ? 'Subiendo...' : draft.foto ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {draft.foto && (
                  <Button variant="text" size="small" onClick={() => patch({ foto: null })} disabled={uploadingFoto}>
                    Quitar
                  </Button>
                )}
              </Stack>
              {fotoError && (
                <Typography variant="caption" sx={{ color: '#E5484D' }}>
                  {fotoError}
                </Typography>
              )}
            </Stack>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFotoChange}
            />
          </Stack>
          <TextField
            label="Nombre completo"
            value={draft.nombre}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ nombre: e.target.value })}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Licencia"
                value={draft.licencia}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ licencia: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <label style={labelStyle}>TIPO DE LICENCIA</label>
              <select
                style={selectStyle}
                value={draft.tipoLicencia}
                onChange={(e) => patch({ tipoLicencia: e.target.value })}
              >
                {TIPOS_LICENCIA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Teléfono"
                value={draft.telefono ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ telefono: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <label style={labelStyle}>CATEGORÍA</label>
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
              <TextField
                label="Fecha de ingreso"
                type="date"
                value={draft.fechaIngreso ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ fechaIngreso: e.target.value })}
                fullWidth
              />
            </Box>
          </Stack>
          <Box>
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

          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button variant="text" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={saveDraft} disabled={!draft.nombre.trim()}>
              Guardar
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Box>
  );
}
