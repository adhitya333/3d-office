import { SittableChair } from '../types/office';
import { OFFICE_CONFIG } from '../config/office.config';

/**
 * Data-Driven Registry of Sittable Chairs from OFFICE_CONFIG
 * Covers all visitor chairs, employee task chairs, canteen sofa seats, armchairs, and skyline bar stools.
 */
const configuredSeats: SittableChair[] = OFFICE_CONFIG.interactionPoints
  .filter(p => p.type === 'seat' || p.type === 'sofa' || p.type === 'bar_stool' || p.type === 'desk')
  .map(p => {
    let employeeId: string | undefined;
    let targetEmployee: string | undefined;

    if (p.id.includes('adhi')) {
      employeeId = 'adhi';
      targetEmployee = 'Adhi';
    } else if (p.id.includes('abbu')) {
      employeeId = 'abbu';
      targetEmployee = 'Abbu';
    } else if (p.id.includes('prox')) {
      employeeId = 'prox';
      targetEmployee = 'Prox';
    } else if (p.id.includes('vaibav')) {
      employeeId = 'vaibav';
      targetEmployee = 'VD (Vaibav)';
    } else if (p.id.includes('taha')) {
      employeeId = 'taha';
      targetEmployee = 'Taha';
    } else if (p.id.includes('rewaant')) {
      employeeId = 'rewaant';
      targetEmployee = 'Rewu (Rewaant)';
    } else if (p.id.includes('ceo')) {
      employeeId = 'ameen';
      targetEmployee = 'Ameen';
    }

    return {
      id: p.id,
      name: p.name,
      position: p.position,
      lookDirection: p.facingDirection,
      employeeId: p.id.startsWith('seat_visitor_') ? employeeId : undefined,
      targetEmployee,
      kind: p.type === 'sofa' ? 'sofa' : p.type === 'bar_stool' ? 'bar_stool' : 'chair',
      seatHeight: p.type === 'bar_stool' ? 0.77 : p.type === 'sofa' ? 0.44 : p.id.startsWith('canteen_armchair') ? 0.47 : 0.5175,
    };
  });

// These match the existing models exactly; no chair geometry or placements are changed.
const additionalSeats: SittableChair[] = [
  { id: 'ceo_lounge_north', name: 'Executive sofa · north', position: [12.65, 0, -1.86], lookDirection: -Math.PI / 2, kind: 'sofa', seatHeight: 0.50 },
  { id: 'ceo_lounge_south', name: 'Executive sofa · south', position: [12.65, 0, -3.14], lookDirection: -Math.PI / 2, kind: 'sofa', seatHeight: 0.50 },
  { id: 'ceo_meeting_west', name: 'Meeting chair · west', position: [6.7, 0, -2.5], lookDirection: Math.PI / 2, kind: 'chair', seatHeight: 0.53 },
  { id: 'ceo_meeting_east', name: 'Meeting chair · east', position: [10.3, 0, -2.5], lookDirection: -Math.PI / 2, kind: 'chair', seatHeight: 0.53 },
  { id: 'ceo_meeting_north', name: 'Meeting chair · north', position: [8.5, 0, -3.4], lookDirection: 0, kind: 'chair', seatHeight: 0.53 },
  { id: 'ceo_meeting_south', name: 'Meeting chair · south', position: [8.5, 0, -1.6], lookDirection: Math.PI, kind: 'chair', seatHeight: 0.53 },
  { id: 'growth_lounge_west', name: 'Growth lounge · west', position: [4.3, 0, 8.5], lookDirection: Math.PI / 2.5, kind: 'chair', seatHeight: 0.48 },
  { id: 'growth_lounge_east', name: 'Growth lounge · east', position: [6.7, 0, 8.5], lookDirection: -Math.PI / 2.5, kind: 'chair', seatHeight: 0.48 },
  { id: 'canteen_dining_1', name: 'Dining chair 1', position: [1.4, 0, -17.2], lookDirection: 0, kind: 'chair', seatHeight: 0.47 },
  { id: 'canteen_dining_2', name: 'Dining chair 2', position: [2.6, 0, -17.2], lookDirection: 0, kind: 'chair', seatHeight: 0.47 },
  { id: 'canteen_dining_3', name: 'Dining chair 3', position: [1.4, 0, -18.8], lookDirection: Math.PI, kind: 'chair', seatHeight: 0.47 },
  { id: 'canteen_dining_4', name: 'Dining chair 4', position: [2.6, 0, -18.8], lookDirection: Math.PI, kind: 'chair', seatHeight: 0.47 },
];

export const SITTABLE_CHAIRS: SittableChair[] = [...configuredSeats, ...additionalSeats];
