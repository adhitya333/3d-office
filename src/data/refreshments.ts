export type RefreshmentStationId = 'water' | 'coffee' | 'shelf';
export type RefreshmentKind = 'drink' | 'food';

export interface RefreshmentItem {
  id: string;
  name: string;
  kind: RefreshmentKind;
  station: RefreshmentStationId;
}

export interface RefreshmentStation {
  id: RefreshmentStationId;
  name: string;
  position: [number, number];
  radius: number;
}

export const REFRESHMENT_STATIONS: RefreshmentStation[] = [
  { id: 'water', name: 'Water cooler', position: [-2, 0], radius: 1.8 },
  { id: 'coffee', name: 'Coffee bar', position: [-1.9, -14.5], radius: 2.0 },
  { id: 'shelf', name: 'Snack shelf', position: [3.1, -14.5], radius: 1.9 },
];

export const REFRESHMENT_ITEMS: RefreshmentItem[] = [
  { id: 'spring-water', name: 'Spring water', kind: 'drink', station: 'water' },
  { id: 'espresso', name: 'Espresso', kind: 'drink', station: 'coffee' },
  { id: 'americano', name: 'Americano', kind: 'drink', station: 'coffee' },
  { id: 'flat-white', name: 'Flat white', kind: 'drink', station: 'coffee' },
  { id: 'cold-brew', name: 'Cold brew', kind: 'drink', station: 'coffee' },
  { id: 'oat-milk', name: 'Oat milk', kind: 'drink', station: 'coffee' },
  { id: 'sparkling-water', name: 'Sparkling water', kind: 'drink', station: 'shelf' },
  { id: 'kombucha', name: 'Kombucha', kind: 'drink', station: 'shelf' },
  { id: 'matcha-tea', name: 'Matcha tea', kind: 'drink', station: 'shelf' },
  { id: 'apple', name: 'Apple', kind: 'food', station: 'shelf' },
  { id: 'orange', name: 'Orange', kind: 'food', station: 'shelf' },
  { id: 'protein-bar', name: 'Protein bar', kind: 'food', station: 'shelf' },
  { id: 'almonds', name: 'Almonds', kind: 'food', station: 'shelf' },
];

export const nearestRefreshmentStation = (x: number, z: number): RefreshmentStation | null => {
  let nearest: RefreshmentStation | null = null;
  let nearestDistance = Infinity;
  for (const station of REFRESHMENT_STATIONS) {
    const distance = Math.hypot(x - station.position[0], z - station.position[1]);
    if (distance < station.radius && distance < nearestDistance) {
      nearest = station;
      nearestDistance = distance;
    }
  }
  return nearest;
};
