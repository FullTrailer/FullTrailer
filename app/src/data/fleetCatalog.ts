export type UnitTipo = 'sencillo' | 'full';

export type UnitStatus =
  | 'disponible'
  | 'activo'
  | 'preventivo'
  | 'correctivo'
  | 'accidentado'
  | 'taller'
  | 'rezago';

export interface Unit {
  id: string;
  eco: string;
  tipo: UnitTipo;
  tractoPlaca: string;
  rem1Placa: string;
  dollyPlaca: string;
  rem2Placa: string;
  operadorId: string;
  clienteId: string;
  estatus: UnitStatus;
  km: number;
  gpsSerie: string;
}

export const STATUS: Record<UnitStatus, { label: string; color: string }> = {
  disponible: { label: 'Disponible', color: '#35B36B' },
  activo: { label: 'Activo / En ruta', color: '#2FB8C6' },
  preventivo: { label: 'Mant. preventivo', color: '#3B8EE6' },
  correctivo: { label: 'Mant. correctivo', color: '#E8792B' },
  accidentado: { label: 'Accidentado', color: '#E5484D' },
  taller: { label: 'Taller externo', color: '#9B7BE0' },
  rezago: { label: 'Rezago', color: '#7C8390' },
};

export const TRACTOS = [
  { eco: 'TRG-001', placa: '84-AH-7K', modelo: 'Kenworth T680' },
  { eco: 'TRG-002', placa: '91-BC-2M', modelo: 'Freightliner Cascadia' },
  { eco: 'TRG-003', placa: '77-DG-5P', modelo: 'International LT' },
  { eco: 'TRG-004', placa: '63-FR-9T', modelo: 'Volvo VNL 760' },
  { eco: 'TRG-005', placa: '58-KL-3R', modelo: 'Kenworth T880' },
  { eco: 'TRG-006', placa: '42-MN-8W', modelo: 'Freightliner Cascadia' },
  { eco: 'TRG-007', placa: '95-PQ-1X', modelo: 'Scania R500' },
  { eco: 'TRG-008', placa: '31-TR-6V', modelo: 'Kenworth T680' },
  { eco: 'TRG-009', placa: '19-WX-4Y', modelo: 'International LT' },
];

export const REMOLQUES = [
  { eco: 'TRG-010', placa: '3AH-7742', tipo: 'Caja seca 53"' },
  { eco: 'TRG-011', placa: '3BC-1180', tipo: 'Caja seca 53"' },
  { eco: 'TRG-012', placa: '3DG-9053', tipo: 'Plataforma' },
  { eco: 'TRG-013', placa: '3FR-4471', tipo: 'Caja refrigerada' },
  { eco: 'TRG-014', placa: '3KL-6628', tipo: 'Caja seca 48"' },
  { eco: 'TRG-015', placa: '3MN-3319', tipo: 'Tolva' },
  { eco: 'TRG-016', placa: '3PQ-8890', tipo: 'Caja seca 53"' },
];

export const DOLLIES = [
  { eco: 'TRG-021', placa: 'DLY-101' },
  { eco: 'TRG-022', placa: 'DLY-102' },
  { eco: 'TRG-023', placa: 'DLY-103' },
];

export const OPERADORES = [
  { id: 'o1', nombre: 'Marco A. Peña' },
  { id: 'o2', nombre: 'J. Refugio Salas' },
  { id: 'o3', nombre: 'Ernesto Villareal' },
  { id: 'o4', nombre: 'Ramiro Cázares' },
  { id: 'o5', nombre: 'Hugo Domínguez' },
];

export const CLIENTES = [
  { id: 'c1', nombre: 'ASFK' },
  { id: 'c2', nombre: 'AB Mauri' },
  { id: 'c3', nombre: 'Grupo Sigma' },
  { id: 'c4', nombre: 'Cemex' },
  { id: 'c5', nombre: 'Bachoco' },
];

export function newUnitId(): string {
  return 'u' + Math.random().toString(36).slice(2, 10);
}

export function ecoOf(placa: string, list: { eco: string; placa: string }[]): string {
  return list.find((x) => x.placa === placa)?.eco ?? '';
}
