import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 4000;
const SAMSARA_TOKEN = process.env.SAMSARA_API_TOKEN;
const SAMSARA_BASE = 'https://api.samsara.com';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const VEHICLE_MAP_TTL_MS = 5 * 60 * 1000;
const FUEL_CACHE_TTL_MS = 45 * 1000;

let vehicleMapCache = { byClave: new Map(), fetchedAt: 0 };
let fuelCache = { data: {}, fetchedAt: 0 };

function samsaraHeaders() {
  return {
    Authorization: `Bearer ${SAMSARA_TOKEN}`,
    accept: 'application/json',
  };
}

/**
 * Samsara's vehicle "name" matches this fleet's tracto Clave 1:1 for any
 * unit that has a GPS device installed (confirmed empirically, e.g. name
 * "TRG-014" <-> tracto.json Clave "TRG-014" / same plate).
 */
async function refreshVehicleMap() {
  const res = await fetch(`${SAMSARA_BASE}/fleet/vehicles?limit=512`, {
    headers: samsaraHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Samsara /fleet/vehicles failed: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  const byClave = new Map();
  for (const vehicle of body.data ?? []) {
    if (vehicle.name) byClave.set(vehicle.name, vehicle.id);
  }
  vehicleMapCache = { byClave, fetchedAt: Date.now() };
  console.log(`[samsara] vehicle map refreshed: ${byClave.size} vehicles`);
}

async function getVehicleMap() {
  if (Date.now() - vehicleMapCache.fetchedAt > VEHICLE_MAP_TTL_MS) {
    await refreshVehicleMap();
  }
  return vehicleMapCache.byClave;
}

async function fetchFuelByClave() {
  if (Date.now() - fuelCache.fetchedAt < FUEL_CACHE_TTL_MS) {
    return fuelCache.data;
  }

  const byClave = await getVehicleMap();
  const idToClave = new Map();
  for (const [clave, id] of byClave) idToClave.set(id, clave);

  const ids = [...idToClave.keys()];
  if (ids.length === 0) {
    fuelCache = { data: {}, fetchedAt: Date.now() };
    return fuelCache.data;
  }

  const url = `${SAMSARA_BASE}/fleet/vehicles/stats?types=fuelPercents&vehicleIds=${ids.join(',')}`;
  const res = await fetch(url, { headers: samsaraHeaders() });
  if (!res.ok) {
    throw new Error(`Samsara /fleet/vehicles/stats failed: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();

  const data = {};
  for (const stat of body.data ?? []) {
    const clave = idToClave.get(stat.id);
    if (!clave || !stat.fuelPercent) continue;
    data[clave] = { fuelPercent: stat.fuelPercent.value, updatedAt: stat.fuelPercent.time };
  }

  fuelCache = { data, fetchedAt: Date.now() };
  return data;
}

/**
 * Generic image upload used today for operador photos. Stores on local
 * disk under server/uploads and returns a relative /uploads/... URL that
 * gets saved on the record — when this moves to a real server, only the
 * storage backend behind this endpoint needs to change (e.g. S3), the
 * frontend and the "foto" field stay a plain URL string.
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const app = express();
app.use(cors());
app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/upload', (req, res) => {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Solo se aceptan imágenes' });
      return;
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

app.get('/api/fuel', async (_req, res) => {
  if (!SAMSARA_TOKEN) {
    res.status(500).json({ error: 'SAMSARA_API_TOKEN no configurado en server/.env' });
    return;
  }
  try {
    res.json(await fetchFuelByClave());
  } catch (err) {
    console.error('[samsara] /api/fuel error:', err.message);
    res.status(502).json({ error: 'No se pudo obtener datos de Samsara' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Samsara proxy escuchando en http://localhost:${PORT}`);
});
