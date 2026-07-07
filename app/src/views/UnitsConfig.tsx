import { useState } from 'react';
import { Typography, Button, TextField, Paper, Chip, Box } from 'this.gui/atoms';
import { Table, TableHead, TableBody, TableRow, TableCell, Stack } from 'this.gui/molecules';
import { useMeAction, useMeValue } from 'this.gui/react';
import {
  STATUS,
  TRACTOS,
  REMOLQUES,
  DOLLIES,
  OPERADORES,
  CLIENTES,
  ecoOf,
  newUnitId,
  type Unit,
  type UnitStatus,
  type UnitTipo,
} from '../data/fleetCatalog';

const UNITS_PATH = 'apps.fulltrailer.unidades.units';

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

function emptyDraft(): Unit {
  return {
    id: newUnitId(),
    eco: '',
    tipo: 'sencillo',
    tractoPlaca: '',
    rem1Placa: '',
    dollyPlaca: '',
    rem2Placa: '',
    operadorId: '',
    clienteId: '',
    estatus: 'disponible',
    km: 0,
    gpsSerie: '',
  };
}

export default function UnitsConfig() {
  const units = useMeValue<Unit[]>(UNITS_PATH) || [];
  const setRoute = useMeAction('apps.fulltrailer.route');
  const setUnits = useMeAction(UNITS_PATH);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Unit>(emptyDraft());

  const goHome = () => setRoute('home');

  const patch = (changes: Partial<Unit>) => setDraft((d) => ({ ...d, ...changes }));

  const saveUnit = () => {
    if (!draft.eco.trim() || !draft.tractoPlaca) return;
    setUnits([...units, draft]);
    setDraft(emptyDraft());
    setShowForm(false);
  };

  const removeUnit = (id: string) => {
    setUnits(units.filter((u) => u.id !== id));
  };

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1100, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Configuración de Unidades
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A939B', marginTop: 1 }}>
            Arma conjuntos de tracto, remolques, dolly y operador para cada unidad de la flota.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={goHome}>
            Volver
          </Button>
          <Button variant="contained" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancelar' : '+ Nueva unidad'}
          </Button>
        </Stack>
      </Stack>

      {showForm && (
        <Paper sx={{ padding: 3, marginBottom: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Número económico"
                  placeholder="TRG-030"
                  value={draft.eco}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ eco: e.target.value })}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <label style={labelStyle}>TIPO DE UNIDAD</label>
                <select
                  style={selectStyle}
                  value={draft.tipo}
                  onChange={(e) => patch({ tipo: e.target.value as UnitTipo, dollyPlaca: '', rem2Placa: '' })}
                >
                  <option value="sencillo">Sencillo (tracto + 1 remolque)</option>
                  <option value="full">Full / Doble (tracto + dolly + 2 remolques)</option>
                </select>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <label style={labelStyle}>TRACTOCAMIÓN</label>
                <select
                  style={selectStyle}
                  value={draft.tractoPlaca}
                  onChange={(e) => patch({ tractoPlaca: e.target.value })}
                >
                  <option value="">— seleccionar tracto —</option>
                  {TRACTOS.map((t) => (
                    <option key={t.placa} value={t.placa}>
                      {t.eco} — {t.modelo} · {t.placa}
                    </option>
                  ))}
                </select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <label style={labelStyle}>REMOLQUE 1</label>
                <select
                  style={selectStyle}
                  value={draft.rem1Placa}
                  onChange={(e) => patch({ rem1Placa: e.target.value })}
                >
                  <option value="">— seleccionar remolque —</option>
                  {REMOLQUES.map((r) => (
                    <option key={r.placa} value={r.placa}>
                      {r.eco} — {r.tipo} · {r.placa}
                    </option>
                  ))}
                </select>
              </Box>
            </Stack>

            {draft.tipo === 'full' && (
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <label style={labelStyle}>DOLLY (CONVERTIDOR)</label>
                  <select
                    style={selectStyle}
                    value={draft.dollyPlaca}
                    onChange={(e) => patch({ dollyPlaca: e.target.value })}
                  >
                    <option value="">— seleccionar dolly —</option>
                    {DOLLIES.map((d) => (
                      <option key={d.placa} value={d.placa}>
                        {d.eco} · {d.placa}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <label style={labelStyle}>REMOLQUE 2</label>
                  <select
                    style={selectStyle}
                    value={draft.rem2Placa}
                    onChange={(e) => patch({ rem2Placa: e.target.value })}
                  >
                    <option value="">— seleccionar remolque —</option>
                    {REMOLQUES.map((r) => (
                      <option key={r.placa} value={r.placa}>
                        {r.eco} — {r.tipo} · {r.placa}
                      </option>
                    ))}
                  </select>
                </Box>
              </Stack>
            )}

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <label style={labelStyle}>OPERADOR ASIGNADO</label>
                <select
                  style={selectStyle}
                  value={draft.operadorId}
                  onChange={(e) => patch({ operadorId: e.target.value })}
                >
                  <option value="">— sin operador —</option>
                  {OPERADORES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <label style={labelStyle}>PROGRAMA / CLIENTE</label>
                <select
                  style={selectStyle}
                  value={draft.clienteId}
                  onChange={(e) => patch({ clienteId: e.target.value })}
                >
                  <option value="">— sin programa —</option>
                  {CLIENTES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Kilometraje"
                  type="number"
                  value={draft.km}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ km: Number(e.target.value) || 0 })}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="GPS Samsara · número de serie"
                  value={draft.gpsSerie}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ gpsSerie: e.target.value })}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <label style={labelStyle}>ESTATUS</label>
                <select
                  style={selectStyle}
                  value={draft.estatus}
                  onChange={(e) => patch({ estatus: e.target.value as UnitStatus })}
                >
                  {Object.entries(STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </Box>
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={saveUnit} disabled={!draft.eco.trim() || !draft.tractoPlaca}>
                Guardar unidad
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ECO</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Tracto</TableCell>
              <TableCell>Remolque(s)</TableCell>
              <TableCell>Dolly</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell>Programa</TableCell>
              <TableCell>KM</TableCell>
              <TableCell>GPS Samsara</TableCell>
              <TableCell>Estatus</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {units.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  <Typography variant="body2" sx={{ color: '#8A939B', textAlign: 'center', padding: 3 }}>
                    Todavía no hay unidades configuradas. Usa "+ Nueva unidad" para capturar la primera.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {units.map((u) => {
              const operador = OPERADORES.find((o) => o.id === u.operadorId);
              const cliente = CLIENTES.find((c) => c.id === u.clienteId);
              const remolques = [u.rem1Placa, u.rem2Placa]
                .filter(Boolean)
                .map((placa) => ecoOf(placa, REMOLQUES))
                .join(' + ');
              return (
                <TableRow key={u.id}>
                  <TableCell>{u.eco}</TableCell>
                  <TableCell>{u.tipo === 'full' ? 'Full' : 'Sencillo'}</TableCell>
                  <TableCell>{ecoOf(u.tractoPlaca, TRACTOS)}</TableCell>
                  <TableCell>{remolques || '—'}</TableCell>
                  <TableCell>{u.dollyPlaca ? ecoOf(u.dollyPlaca, DOLLIES) : '—'}</TableCell>
                  <TableCell>{operador?.nombre || 'Sin operador'}</TableCell>
                  <TableCell>{cliente?.nombre || '—'}</TableCell>
                  <TableCell>{u.km.toLocaleString('es-MX')}</TableCell>
                  <TableCell>{u.gpsSerie || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS[u.estatus].label}
                      size="small"
                      sx={{ backgroundColor: STATUS[u.estatus].color, color: '#0E1113', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="text" onClick={() => removeUnit(u.id)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
