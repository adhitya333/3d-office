/** Muted architectural palettes; geometry stays baked and uses existing room footprints. */
export const ROOM_DESIGNS = {
  'web-search': { name: 'Sage atelier', wall: '#DCE1D5', accent: '#667D70', dark: '#304A42', wood: '#B79B73', stone: '#EEE9DF', fabric: '#83968A', metal: '#A49475' },
  'ai-systems': { name: 'Slate workshop', wall: '#D3DCE0', accent: '#59778C', dark: '#304551', wood: '#8B7966', stone: '#DCE3E3', fabric: '#738793', metal: '#9FAEB1' },
  growth: { name: 'Clay design studio', wall: '#EADDD0', accent: '#AD745B', dark: '#754D42', wood: '#B58F6B', stone: '#F0E6D8', fabric: '#C89B82', metal: '#B49A75' },
  ceo: { name: 'Walnut executive suite', wall: '#E9E3D7', accent: '#AD9363', dark: '#493D33', wood: '#74533B', stone: '#F0EBE1', fabric: '#DED5C4', metal: '#B59B6D' },
  canteen: { name: 'Olive social lounge', wall: '#E2E2D1', accent: '#859267', dark: '#3C5042', wood: '#967351', stone: '#F0ECE1', fabric: '#9CA789', metal: '#BCA77D' },
} as const;
