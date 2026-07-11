import { useMemo, useState } from 'react';
import { Typography, Button, TextField, Chip, Box, Paper } from 'this.gui/atoms';
import { Table, TableHead, TableBody, TableRow, TableCell, Stack } from 'this.gui/molecules';
import { Modal } from 'this.gui';
import { useMeAction, useMeValue } from 'this.gui/react';
import { TRACTOS, type Tracto, type Configuracion } from '../data/tractos';
import { REMOLQUES, type Remolque } from '../data/remolques';
import { DOLLIES, type Dolly } from '../data/dollies';
import {
  buildFacturables,
  importesDe,
  emptyDetalle,
  ESTATUS_LABEL,
  type FacturaDetalle,
  type Facturable,
} from '../data/facturas';

const TRACTOS_RECORDS_PATH = 'apps.fulltrailer.tractos.records';
const REMOLQUES_RECORDS_PATH = 'apps.fulltrailer.remolques.records';
const DOLLIES_RECORDS_PATH = 'apps.fulltrailer.dollies.records';
const FACTURAS_RECORDS_PATH = 'apps.fulltrailer.facturas.records';

const CONFIG_LABEL: Record<Configuracion, string> = {
  solo: 'Solo tracto',
  remolque: 'Con remolque',
  doble: 'Doble',
};

const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

function remolqueLabel(r: Remolque | null): string {
  return r ? `${r.clave} — ${r.categoria}` : '—';
}

function matches(f: Facturable, query: string): boolean {
  if (!query) return true;
  const haystack = `${f.folio} ${f.tracto.clave} ${f.tracto.placas ?? ''} ${f.remolque1?.clave ?? ''} ${f.dolly?.clave ?? ''} ${f.remolque2?.clave ?? ''}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function Facturas() {
  const setRoute = useMeAction('apps.fulltrailer.route');
  const storedTractos = useMeValue<Tracto[]>(TRACTOS_RECORDS_PATH);
  const tractos = storedTractos ?? TRACTOS;
  const storedRemolques = useMeValue<Remolque[]>(REMOLQUES_RECORDS_PATH);
  const remolques = storedRemolques ?? REMOLQUES;
  const storedDollies = useMeValue<Dolly[]>(DOLLIES_RECORDS_PATH);
  const dollies = storedDollies ?? DOLLIES;

  const detalles = useMeValue<Record<string, FacturaDetalle>>(FACTURAS_RECORDS_PATH) ?? {};
  const setDetalles = useMeAction(FACTURAS_RECORDS_PATH);

  const [query, setQuery] = useState('');
  const [modalFolio, setModalFolio] = useState<string | null>(null);
  const [draft, setDraft] = useState<FacturaDetalle | null>(null);

  const goHome = () => setRoute('home');
  const patch = (changes: Partial<FacturaDetalle>) => setDraft((d) => (d ? { ...d, ...changes } : d));

  const facturables = useMemo(() => buildFacturables(tractos, remolques, dollies), [tractos, remolques, dollies]);
  const filtered = useMemo(() => facturables.filter((f) => matches(f, query)), [facturables, query]);

  const openCaptura = (folio: string) => {
    setModalFolio(folio);
    setDraft(detalles[folio] ?? emptyDetalle(folio));
  };

  const saveDraft = () => {
    if (!draft) return;
    setDetalles({ ...detalles, [draft.folio]: draft });
    setModalFolio(null);
    setDraft(null);
  };

  const importes = draft ? importesDe(draft.km, draft.tarifaKm) : null;

  return (
    <Box sx={{ padding: { xs: 3, md: 6 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Facturas
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 1 }}>
            {filtered.length} de {facturables.length} unidades con folio, extraídas de la configuración de cada tracto (tracto + remolque(s) + dolly).
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Buscar por folio, tracto, remolque..."
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

      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Folio</TableCell>
              <TableCell>Tracto</TableCell>
              <TableCell>Configuración</TableCell>
              <TableCell>Remolque(s)</TableCell>
              <TableCell>Dolly</TableCell>
              <TableCell>KM</TableCell>
              <TableCell>Subtotal</TableCell>
              <TableCell>IVA</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estatus</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', padding: 3 }}>
                    Ningún tracto tiene una configuración (remolque o dolly) que genere folio todavía. Arma una en "Tractos".
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((f) => {
              const detalle: FacturaDetalle | undefined = detalles[f.folio];
              const importe = detalle ? importesDe(detalle.km, detalle.tarifaKm) : null;
              return (
                <TableRow key={f.folio}>
                  <TableCell>{f.folio}</TableCell>
                  <TableCell>{f.tracto.clave} — {[f.tracto.marca, f.tracto.modelo].filter(Boolean).join(' ')}</TableCell>
                  <TableCell>{CONFIG_LABEL[f.configuracion]}</TableCell>
                  <TableCell>{[remolqueLabel(f.remolque1), remolqueLabel(f.remolque2)].filter((s) => s !== '—').join(' + ') || '—'}</TableCell>
                  <TableCell>{f.dolly ? f.dolly.clave : '—'}</TableCell>
                  <TableCell>{detalle ? detalle.km.toLocaleString('es-MX') : '—'}</TableCell>
                  <TableCell>{importe ? money(importe.subtotal) : '—'}</TableCell>
                  <TableCell>{importe ? money(importe.iva) : '—'}</TableCell>
                  <TableCell>{importe ? money(importe.total) : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={detalle ? ESTATUS_LABEL[detalle.estatus] : 'Sin capturar'}
                      size="small"
                      sx={{
                        backgroundColor: detalle?.estatus === 'timbrada' ? '#35B36B' : detalle ? '#E8792B' : '#7C8390',
                        color: '#0E1113',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="text" onClick={() => openCaptura(f.folio)}>
                      {detalle ? 'Editar' : 'Capturar'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Modal
        open={!!modalFolio}
        onClose={() => setModalFolio(null)}
        title={`Factura ${modalFolio ?? ''}`}
        width={480}
      >
        {draft && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Fecha"
                  type="date"
                  value={draft.fecha}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ fecha: e.target.value })}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Kilómetros recorridos"
                  type="number"
                  value={draft.km}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ km: Number(e.target.value) || 0 })}
                  fullWidth
                />
              </Box>
            </Stack>
            <TextField
              label="Concepto"
              placeholder="Flete de..."
              value={draft.concepto}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ concepto: e.target.value })}
              fullWidth
            />
            <TextField
              label="Tarifa por km (MXN)"
              type="number"
              value={draft.tarifaKm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patch({ tarifaKm: Number(e.target.value) || 0 })}
              fullWidth
            />

            {importes && (
              <Stack spacing={0.5} sx={{ padding: 2, borderRadius: 2, backgroundColor: 'action.selected' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
                  <Typography variant="body2">{money(importes.subtotal)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>IVA (16%)</Typography>
                  <Typography variant="body2">{money(importes.iva)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{money(importes.total)}</Typography>
                </Stack>
              </Stack>
            )}

            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <input
                  type="checkbox"
                  id="timbrada"
                  checked={draft.estatus === 'timbrada'}
                  onChange={(e) => patch({ estatus: e.target.checked ? 'timbrada' : 'pendiente' })}
                />
                <label htmlFor="timbrada">
                  <Typography variant="body2">Marcar como timbrada</Typography>
                </label>
              </Stack>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
              <Button variant="text" onClick={() => setModalFolio(null)}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={saveDraft}>
                Guardar
              </Button>
            </Stack>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
