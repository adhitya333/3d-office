import { RoomDefinition } from '../types/office';

export const ROOMS: RoomDefinition[] = [
  {
    id: 'web-search',
    name: 'Web & Search Studio',
    shortName: 'Web & Search',
    departmentCode: 'WEB-01',
    accentColor: '#0284C7', // Sky Blue
    glowColor: 'rgba(2, 132, 199, 0.4)',
    floorColor: '#162238',
    bounds: {
      minX: -14,
      maxX: -2.4,
      minZ: -10.5,
      maxZ: -0.2
    },
    doorway: {
      x: -2.4,
      z: -5.2,
      width: 2.8
    },
    description: 'Next.js 15 enterprise architectures, high-conversion landing page design, and Generative Engine Optimization (GEO).'
  },
  {
    id: 'ai-systems',
    name: 'AI & Business Systems Lab',
    shortName: 'AI & Systems',
    departmentCode: 'AIS-02',
    accentColor: '#7C3AED', // Violet / Purple
    glowColor: 'rgba(124, 58, 237, 0.4)',
    floorColor: '#1e183a',
    bounds: {
      minX: -14,
      maxX: -2.4,
      minZ: 0.2,
      maxZ: 10.5
    },
    doorway: {
      x: -2.4,
      z: 5.2,
      width: 2.8
    },
    description: 'Autonomous multi-agent workflows, Gemini 2.0 LLM orchestration, PostgreSQL database schemas, and HubSpot/Stripe CRM sync.'
  },
  {
    id: 'growth',
    name: 'Growth Studio',
    shortName: 'Growth',
    departmentCode: 'GRO-03',
    accentColor: '#059669', // Emerald
    glowColor: 'rgba(5, 150, 105, 0.4)',
    floorColor: '#142924',
    bounds: {
      minX: 2.4,
      maxX: 14,
      minZ: 0.2,
      maxZ: 10.5
    },
    doorway: {
      x: 2.4,
      z: 5.2,
      width: 2.8
    },
    description: 'High-velocity B2B outbound sequences, inbox deliverability health, ICP targeting, and enterprise sales pipeline acceleration.'
  },
  {
    id: 'ceo',
    name: 'CEO Office & Boardroom',
    shortName: 'CEO Office',
    departmentCode: 'CEO-04',
    accentColor: '#F59E0B', // Amber / Gold
    glowColor: 'rgba(245, 158, 11, 0.4)',
    floorColor: '#252018',
    bounds: {
      minX: 2.4,
      maxX: 14,
      minZ: -10.5,
      maxZ: -0.2
    },
    doorway: {
      x: 2.4,
      z: -5.2,
      width: 2.8
    },
    description: 'Visionary leadership, enterprise strategy, capital deployment, team mentorship, and overseeing all company operations across Web, AI, Systems, and Growth.'
  },
  {
    id: 'canteen',
    name: 'Canteen & Executive Lounge',
    shortName: 'Canteen',
    departmentCode: 'CNT-05',
    accentColor: '#06B6D4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.4)',
    floorColor: '#261b14',
    bounds: {
      minX: -4.5,
      maxX: 4.5,
      minZ: -20.5,
      maxZ: -10.5
    },
    doorway: {
      x: 0,
      z: -10.5,
      width: 3.2
    },
    description: 'Artisan espresso bar, organic snack wall, lounge seating with panoramic skyline windows, and communal team breaks.'
  },
  {
    id: 'corridor',
    name: 'Central Spine Corridor',
    shortName: 'Corridor',
    departmentCode: 'COR-00',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    floorColor: '#1a1f2e',
    bounds: {
      minX: -2.4,
      maxX: 2.4,
      minZ: -10.5,
      maxZ: 10.5
    },
    doorway: {
      x: 0,
      z: 10.5,
      width: 3.4
    },
    description: 'Natural oak planked atrium connecting all 4 department wings and the north Canteen Lounge.'
  }
];
