/**
 * Verlyn Tech - 3D Walkable Enterprise AI Office Unified Data Configuration
 *
 * Data-Driven Single Source of Truth for:
 * - Employees & Roles: Adhi, Abbu, Prox, VD (Vaibav), Taha, Rewu (Rewaant), Ameen (CEO)
 * - Navigation Waypoint Graph & Clearance (>= 1.2m everywhere)
 * - Automatic Doors & Proximity Sensors ([Q] Toggle + Sensor Auto-Open)
 * - Reusable Interaction Points (Desks, Visitor Chairs, Coffee Machines, Snack Shelves, Sofas, Bar Stools)
 * - Break Schedules, Autonomous Life Durations, and NPC State Machine Settings
 */

export interface InteractionPointConfig {
  id: string;
  type: 'seat' | 'coffee_machine' | 'snack_shelf' | 'food_serving' | 'fridge' | 'sofa' | 'bar_stool' | 'standing_spot' | 'desk';
  position: [number, number, number]; // [x, y, z]
  facingDirection: number; // in radians
  room: string;
  name: string;
  approachNodeId: string;
  userInteractable?: boolean;
}

export interface WaypointNode {
  id: string;
  x: number;
  z: number;
  room: string;
  clearanceRadius: number; // minimum corridor/aisle clearance width in meters
}

export interface WaypointEdge {
  from: string;
  to: string;
  distance: number;
  doorId?: string; // links edge to an automatic door (passable when open or triggering sensor)
}

export interface AutoDoorConfig {
  id: string;
  name: string;
  roomName: string;
  type: 'sliding' | 'swing';
  x: number;
  z: number;
  width: number;
  sensorRadius: number;
  accentColor: number;
  swingDirection?: number; // 1 or -1
}

export interface EmployeeProfileConfig {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  roomName: string;
  roleDescription: string;
  responsibilities: string[];
  capsuleRadius: number; // e.g. CEO = 0.55m, others = 0.30m
  walkSpeed: number; // m/s
  deskPosition: [number, number, number];
  deskRotation: number;
  lookDirection: number;
  seatAnchorId: string;
  visitorSeatAnchorId: string;
  avatarColors: {
    skin: string;
    shirt: string;
    pants: string;
    hair: string;
    accent: string;
  };
  deskStyle: {
    monitorCount: number;
    monitorType: 'dual_horizontal' | 'ultrawide' | 'triple' | 'dual_vertical' | 'curved_presidential';
    chairModel: 'standing_perch' | 'dark_gray_ergo' | 'leather_executive' | 'blue_mesh' | 'ceo_throne';
    deskType: 'standing_timber' | 'sleek_charcoal' | 'walnut_credenza' | 'steel_glass' | 'presidential_walnut';
    personalItems: string[];
    boardTitle: string;
    boardTasks: string[];
  };
  funFact: string;
  teamBonds: {
    friendId: string;
    friendName: string;
    relationship: string;
    collaboration: string;
  }[];
}

export interface OfficeConfig {
  version: string;
  officeName: string;
  schedule: {
    minBreakIntervalSec: number;
    maxBreakIntervalSec: number;
    maxConcurrentBreaks: number;
    coffeeDurationSec: number;
    snackDurationSec: number;
    loungeDurationSec: number;
    deskWorkMinSec: number;
  };
  employees: EmployeeProfileConfig[];
  doors: AutoDoorConfig[];
  waypoints: {
    nodes: WaypointNode[];
    edges: WaypointEdge[];
  };
  interactionPoints: InteractionPointConfig[];
}

export const OFFICE_CONFIG: OfficeConfig = {
  version: '2.0.0',
  officeName: 'Verlyn Tech Enterprise HQ 2.0',

  schedule: {
    minBreakIntervalSec: 120, // Independent randomized breaks
    maxBreakIntervalSec: 360, // Varied shorter work periods
    maxConcurrentBreaks: 2,   // Maximum 2 employees away from desks at once
    coffeeDurationSec: 22,
    snackDurationSec: 24,
    loungeDurationSec: 45,
    deskWorkMinSec: 90
  },

  // ================= 1. VERLYN TECH LEADERSHIP & CORE TEAM =================
  employees: [
    {
      id: 'adhi',
      name: 'Adhi',
      role: 'Senior Website & Architecture Developer',
      departmentId: 'web-search',
      departmentName: 'Web & Search Studio',
      roomName: 'Web & Search Studio',
      roleDescription: 'Next.js 15 architectures, full-stack React components, 3D Canvas integration, client portals, responsive design, and core web vitals.',
      responsibilities: [
        'Architecting high-performance Next.js 15 applications with TypeScript and Tailwind CSS',
        'Engineering interactive 3D WebGL components, canvas viewports, and modern portal UIs',
        'Optimizing Core Web Vitals (LCP, FID, CLS) to achieve 98+ PageSpeed scores',
        'Building modular component design systems that scale across enterprise platforms'
      ],
      capsuleRadius: 0.30,
      walkSpeed: 1.55,
      deskPosition: [-9.5, 0, -7.2],
      deskRotation: Math.PI,
      lookDirection: 0,
      seatAnchorId: 'seat_desk_adhi',
      visitorSeatAnchorId: 'seat_visitor_adhi',
      avatarColors: {
        skin: '#F5D0A9',
        shirt: '#0284C7', // Sky Blue
        pants: '#1E293B',
        hair: '#1E1B18',
        accent: '#38BDF8'
      },
      deskStyle: {
        monitorCount: 2,
        monitorType: 'dual_horizontal',
        chairModel: 'standing_perch',
        deskType: 'standing_timber',
        personalItems: ['mechanical_keyboard', 'spinning_globe', 'nextjs_mug', 'airpods'],
        boardTitle: 'WEB ARCHITECTURE & NEXT.JS REPO',
        boardTasks: [
          'Next.js 15 Server Components Migration',
          'WebGL Canvas Viewport 60FPS Optimization',
          'Client Portal Auth & Stripe Webhooks'
        ]
      },
      funFact: 'Builds custom split mechanical keyboards and has memorized every CSS grid shorthand property.',
      teamBonds: [
        {
          friendId: 'abbu',
          friendName: 'Abbu',
          relationship: 'Frontend & CRO Duo',
          collaboration: 'Turns Abbu’s Figma landing page designs into pixel-perfect, lightning-fast React components.'
        },
        {
          friendId: 'prox',
          friendName: 'Prox',
          relationship: 'Technical SEO Partner',
          collaboration: 'Implements Prox’s structured JSON-LD schemas and SSR caching pipelines for maximum AI search indexing.'
        },
        {
          friendId: 'vaibav',
          friendName: 'VD (Vaibav)',
          relationship: 'AI UI Integrator',
          collaboration: 'Connects VD’s autonomous multi-agent pipelines to rich interactive frontend controls.'
        },
        {
          friendId: 'taha',
          friendName: 'Taha',
          relationship: 'Full-Stack Co-Engineers',
          collaboration: 'Wires frontend client forms directly into Taha’s PostgreSQL backend schemas.'
        },
        {
          friendId: 'rewaant',
          friendName: 'Rewu (Rewaant)',
          relationship: 'Growth Funnel Ally',
          collaboration: 'Builds high-converting landing page variants for Rewu’s outbound campaigns.'
        },
        {
          friendId: 'ameen',
          friendName: 'Ameen',
          relationship: 'Executive Vision Engineer',
          collaboration: 'Ameen trusts Adhi to engineer the digital face and architecture of Verlyn Tech.'
        }
      ]
    },

    {
      id: 'abbu',
      name: 'Abbu',
      role: 'Lead Landing Page & Conversion (CRO) Designer',
      departmentId: 'web-search',
      departmentName: 'Web & Search Studio',
      roomName: 'Web & Search Studio',
      roleDescription: 'High-converting B2B landing pages, Figma design systems, value proposition testing, copywriting hooks, A/B test funnels, and UX psychology.',
      responsibilities: [
        'Designing ultra-modern high-converting SaaS landing pages and interactive Figma prototypes',
        'Analyzing visitor heatmaps, scroll depth, and user drop-off bottlenecks',
        'Writing high-impact value proposition headlines and conversion-driven micro-copy',
        'Pairing with Adhi to turn Figma layouts into pixel-perfect, responsive code'
      ],
      capsuleRadius: 0.30,
      walkSpeed: 1.50,
      deskPosition: [-5.5, 0, -7.2],
      deskRotation: Math.PI,
      lookDirection: 0,
      seatAnchorId: 'seat_desk_abbu',
      visitorSeatAnchorId: 'seat_visitor_abbu',
      avatarColors: {
        skin: '#F7D0B2',
        shirt: '#0D9488', // Teal
        pants: '#1E293B',
        hair: '#27272A',
        accent: '#2DD4BF'
      },
      deskStyle: {
        monitorCount: 2,
        monitorType: 'dual_horizontal',
        chairModel: 'dark_gray_ergo',
        deskType: 'sleek_charcoal',
        personalItems: ['figma_shortcuts_mat', 'stylus_pen', 'matte_desk_lamp', 'pantone_swatches'],
        boardTitle: 'CONVERSION OPTIMIZATION & CRO FUNNELS',
        boardTasks: [
          'B2B Hero Section A/B Test (+24.8% CTR)',
          'Figma Design System v2.4 Token Sync',
          'Interactive Pricing Calculator Wireframe'
        ]
      },
      funFact: 'Can spot a 1-pixel margin misalignment across an entire screen without using a ruler.',
      teamBonds: [
        {
          friendId: 'adhi',
          friendName: 'Adhi',
          relationship: 'Design-Engineering Twins',
          collaboration: 'Shares daily Figma design reviews with Adhi to ensure animations and paddings match mockups.'
        },
        {
          friendId: 'prox',
          friendName: 'Prox',
          relationship: 'Search Intent Aligner',
          collaboration: 'Aligns landing page hero headlines with Prox’s highest-intent commercial keywords.'
        },
        {
          friendId: 'rewaant',
          friendName: 'Rewu (Rewaant)',
          relationship: 'Outbound Landing Partner',
          collaboration: 'Designs dedicated hyper-personalized landing pages for Rewu’s tier-1 enterprise prospects.'
        },
        {
          friendId: 'ameen',
          friendName: 'Ameen',
          relationship: 'Brand Aesthetic Confidant',
          collaboration: 'Ameen loves reviewing Abbu’s latest dark-mode cyberpunk design mockups over morning espresso.'
        }
      ]
    },

    {
      id: 'prox',
      name: 'Prox',
      role: 'Search Intelligence & Generative Engine Optimization (GEO) Lead',
      departmentId: 'web-search',
      departmentName: 'Web & Search Studio',
      roomName: 'Web & Search Studio',
      roleDescription: 'Generative Engine Optimization (Perplexity, ChatGPT, Claude), Technical SEO, AI crawler indexing, semantic authority, and organic citation footprints.',
      responsibilities: [
        'Auditing brand citation frequency and authority across Perplexity, ChatGPT, and Google Gemini',
        'Optimizing structured schema markup (JSON-LD), entity graphs, and technical crawlability',
        'Monitoring keyword ranking velocity and AI search overview placements',
        'Engineering semantic content frameworks that turn search traffic into qualified pipeline'
      ],
      capsuleRadius: 0.30,
      walkSpeed: 1.50,
      deskPosition: [-7.5, 0, -2.8],
      deskRotation: 0,
      lookDirection: Math.PI,
      seatAnchorId: 'seat_desk_prox',
      visitorSeatAnchorId: 'seat_visitor_prox',
      avatarColors: {
        skin: '#E5C09B',
        shirt: '#6366F1', // Indigo
        pants: '#0F172A',
        hair: '#312E81',
        accent: '#A5B4FC'
      },
      deskStyle: {
        monitorCount: 1,
        monitorType: 'ultrawide',
        chairModel: 'leather_executive',
        deskType: 'walnut_credenza',
        personalItems: ['perplexity_citation_tracker', 'vintage_notebook', 'airpods_max', 'espresso_cup'],
        boardTitle: 'GEO & SEARCH INTELLIGENCE MATRIX',
        boardTasks: [
          'Perplexity Citation Share Audit (68.4%)',
          'Schema Markup JSON-LD Knowledge Graph',
          'Competitor AI Overview Displacement Analysis'
        ]
      },
      funFact: 'Can guess the exact search volume and CPC of any tech keyword within a 5% margin.',
      teamBonds: [
        {
          friendId: 'adhi',
          friendName: 'Adhi',
          relationship: 'Technical Crawl Partner',
          collaboration: 'Works with Adhi on server-side rendering headers and sitemap indexing speed.'
        },
        {
          friendId: 'abbu',
          friendName: 'Abbu',
          relationship: 'Content-Design Strategist',
          collaboration: 'Passes top user question queries to Abbu to embed directly in FAQ accordions.'
        },
        {
          friendId: 'rewaant',
          friendName: 'Rewu (Rewaant)',
          relationship: 'Demand Capture Allies',
          collaboration: 'Feeds high-intent keyword discovery to Rewu for target account outreach campaigns.'
        },
        {
          friendId: 'ameen',
          friendName: 'Ameen',
          relationship: 'Authority Counsel',
          collaboration: 'Briefs Ameen on market mindshare and industry AI search prominence.'
        }
      ]
    },

    {
      id: 'vaibav',
      name: 'VD (Vaibav)',
      role: 'Head of Autonomous AI Agents & Workflows',
      departmentId: 'ai-systems',
      departmentName: 'AI & Business Systems Lab',
      roomName: 'AI & Business Systems Lab',
      roleDescription: 'Multi-agent systems, Gemini/OpenRouter LLM orchestration, webhook triggers, prospect enrichment, agentic automation pipelines, and LangGraph meshes.',
      responsibilities: [
        'Building autonomous multi-agent meshes with Gemini 2.0 Flash/Pro and OpenRouter LLMs',
        'Engineering webhook ingestion pipelines that qualify and enrich inbound leads in real-time',
        'Implementing self-healing background automation tasks and failover retry monitors',
        'Connecting agent outputs directly into Taha’s CRM pipelines and Rewaant’s outbound campaigns'
      ],
      capsuleRadius: 0.30,
      walkSpeed: 1.55,
      deskPosition: [-9.5, 0, 4.5],
      deskRotation: 0,
      lookDirection: Math.PI,
      seatAnchorId: 'seat_desk_vaibav',
      visitorSeatAnchorId: 'seat_visitor_vaibav',
      avatarColors: {
        skin: '#F5D0A9',
        shirt: '#7C3AED', // Violet / Purple
        pants: '#0F172A',
        hair: '#18181B',
        accent: '#C084FC'
      },
      deskStyle: {
        monitorCount: 3,
        monitorType: 'triple',
        chairModel: 'dark_gray_ergo',
        deskType: 'steel_glass',
        personalItems: ['agent_node_graph_poster', 'raspberry_pi_cluster', 'cyberpunk_figurine', 'energy_drink'],
        boardTitle: 'AUTONOMOUS AGENT MESH & WORKFLOWS',
        boardTasks: [
          'Inbound Multi-Agent Enrichment Pipeline',
          'Gemini 2.0 Flash Tool-Calling Speedup',
          'Self-Healing Webhook Error Retry Queue'
        ]
      },
      funFact: 'Runs an 8-node local LLM inference cluster in his living room that also heats his apartment.',
      teamBonds: [
        {
          friendId: 'taha',
          friendName: 'Taha',
          relationship: 'AI-Database Infrastructure Duo',
          collaboration: 'Pipes autonomous agent lead scores directly into Taha’s PostgreSQL and HubSpot databases.'
        },
        {
          friendId: 'rewaant',
          friendName: 'Rewu (Rewaant)',
          relationship: 'Outbound Automation Partner',
          collaboration: 'Supplies Rewu with AI-scraped and enriched prospect dossiers before email dispatches.'
        },
        {
          friendId: 'adhi',
          friendName: 'Adhi',
          relationship: 'Agent UI Co-Architect',
          collaboration: 'Provides streaming agent API endpoints to Adhi for live interactive chat components.'
        },
        {
          friendId: 'ameen',
          friendName: 'Ameen',
          relationship: 'AI Strategy Vanguard',
          collaboration: 'Ameen champions VD’s most ambitious autonomous multi-agent operational models.'
        }
      ]
    },

    {
      id: 'taha',
      name: 'Taha',
      role: 'Enterprise Systems & CRM/ERP Integration Architect',
      departmentId: 'ai-systems',
      departmentName: 'AI & Business Systems Lab',
      roomName: 'AI & Business Systems Lab',
      roleDescription: 'PostgreSQL schemas, HubSpot Enterprise and Salesforce CRM sync, Stripe billing integration, enterprise webhooks, and database migrations.',
      responsibilities: [
        'Architecting high-scale PostgreSQL database schemas with strict ACID compliance',
        'Configuring bi-directional HubSpot Enterprise and Salesforce sync engines',
        'Integrating Stripe billing webhooks with automated revenue reconciliation',
        'Securing enterprise customer data access controls, audit logs, and SOC-2 compliance'
      ],
      capsuleRadius: 0.30,
      walkSpeed: 1.50,
      deskPosition: [-5.5, 0, 7.5],
      deskRotation: 0,
      lookDirection: Math.PI,
      seatAnchorId: 'seat_desk_taha',
      visitorSeatAnchorId: 'seat_visitor_taha',
      avatarColors: {
        skin: '#D97706',
        shirt: '#2563EB', // Royal Blue
        pants: '#1E293B',
        hair: '#1C1917',
        accent: '#60A5FA'
      },
      deskStyle: {
        monitorCount: 2,
        monitorType: 'dual_vertical',
        chairModel: 'blue_mesh',
        deskType: 'walnut_credenza',
        personalItems: ['retro_calculator', 'database_schema_printout', 'leather_planner', 'brass_pen'],
        boardTitle: 'ENTERPRISE CRM/ERP & DATABASE MATRIX',
        boardTasks: [
          'HubSpot & Stripe Bi-Directional Webhook Sync',
          'PostgreSQL Schema Indexing & Query Speedup',
          'Enterprise Single-Sign-On (SAML/Okta) Config'
        ]
      },
      funFact: 'Can write complex SQL recursive window functions by hand faster than most ORMs can compile them.',
      teamBonds: [
        {
          friendId: 'vaibav',
          friendName: 'VD (Vaibav)',
          relationship: 'Backend-AI Synapse',
          collaboration: 'Verifies database triggers and schema validations for all autonomous agent writes.'
        },
        {
          friendId: 'rewaant',
          friendName: 'Rewu (Rewaant)',
          relationship: 'CRM Operations Partner',
          collaboration: 'Ensures Rewu’s outbound campaigns seamlessly sync closed-won revenue into Stripe and HubSpot.'
        },
        {
          friendId: 'adhi',
          friendName: 'Adhi',
          relationship: 'Data-View Integrator',
          collaboration: 'Exposes sanitized server API endpoints for Adhi’s client dashboard components.'
        },
        {
          friendId: 'ameen',
          friendName: 'Ameen',
          relationship: 'Enterprise Backbone Confidant',
          collaboration: 'Delivers Ameen real-time revenue and MRR data tables for boardroom executive decks.'
        }
      ]
    },

    {
      id: 'rewaant',
      name: 'Rewu (Rewaant)',
      role: 'Head of Design & Brand Identity',
      departmentId: 'growth',
      departmentName: 'Brand & Design Studio',
      roomName: 'Brand & Design Studio',
      roleDescription: 'Brand identity, creative direction, visual design, typography, color systems and consistent brand experiences.',
      responsibilities: [
        'Developing clear brand strategy, identity and visual direction',
        'Designing typography, color systems, layouts and creative assets',
        'Partnering with Abbu on website design and Adhi on implementation',
        'Reviewing visual consistency, accessibility and quality across each deliverable'
      ],
      capsuleRadius: 0.30,
      walkSpeed: 1.55,
      deskPosition: [8.5, 0, 5.5],
      deskRotation: 0,
      lookDirection: Math.PI,
      seatAnchorId: 'seat_desk_rewaant',
      visitorSeatAnchorId: 'seat_visitor_rewaant',
      avatarColors: {
        skin: '#F7D0B2',
        shirt: '#059669', // Emerald Green
        pants: '#1E293B',
        hair: '#B45309',
        accent: '#34D399'
      },
      deskStyle: {
        monitorCount: 2,
        monitorType: 'dual_horizontal',
        chairModel: 'leather_executive',
        deskType: 'walnut_credenza',
        personalItems: ['outbound_headset', 'monstera_plant', 'lead_qualification_playbook', 'matte_tumbler'],
        boardTitle: 'BRAND IDENTITY & CREATIVE DIRECTION',
        boardTasks: [
          'Brand identity and positioning',
          'Typography, color and visual system',
          'Creative review and asset delivery'
        ]
      },
      funFact: 'Collects typography references and notices inconsistent brand spacing before anyone else.',
      teamBonds: [
        {
          friendId: 'abbu',
          friendName: 'Abbu',
          relationship: 'Growth-Design Cohort',
          collaboration: 'Tests Abbu’s latest landing page copy variants directly in outbound email calls to action.'
        },
        {
          friendId: 'vaibav',
          friendName: 'VD (Vaibav)',
          relationship: 'AI Prospecting Engine',
          collaboration: 'Leverages VD’s automated scrapers to target high-intent B2B founders at scale.'
        },
        {
          friendId: 'taha',
          friendName: 'Taha',
          relationship: 'Pipeline Tracker',
          collaboration: 'Watches deals move from outbound reply to signed contract in Taha’s HubSpot pipelines.'
        },
        {
          friendId: 'ameen',
          friendName: 'Ameen',
          relationship: 'Revenue Expansion Champion',
          collaboration: 'Ameen meets Rewu every week to celebrate deal closures and plan new territory rollouts.'
        }
      ]
    },

    {
      id: 'ameen',
      name: 'Ameen',
      role: 'Chief Executive Officer (CEO)',
      departmentId: 'ceo',
      departmentName: 'Executive Suite & Boardroom',
      roomName: 'CEO Office & Boardroom',
      roleDescription: 'Visionary leadership, enterprise strategy, capital deployment, team mentorship, and OVERSEEING EVERYTHING across Web, AI, Systems, and Growth.',
      responsibilities: [
        'Guiding overall corporate vision, technology strategy, and multi-million dollar investments',
        'Overseeing and uniting all department leads: Adhi (Web), Abbu (CRO), Prox (GEO), VD (AI), Taha (Systems), and Rewu (Growth)',
        'Approving capital allocations, enterprise partnerships, and high-impact initiatives',
        'Fostering a world-class culture of innovation, deep camaraderie, family warmth, and excellence'
      ],
      capsuleRadius: 0.55, // Furniture/path clearance; wider personal space is applied by the brain
      walkSpeed: 1.35,     // Dignified, measured executive walk
      deskPosition: [8.5, 0, -6.5],
      deskRotation: Math.PI,
      lookDirection: 0,
      seatAnchorId: 'seat_desk_ceo',
      visitorSeatAnchorId: 'seat_visitor_ceo',
      avatarColors: {
        skin: '#E5C09B',
        shirt: '#D97706', // Gold / Amber executive blazer
        pants: '#0F172A',
        hair: '#1C1917',
        accent: '#FBBF24'
      },
      deskStyle: {
        monitorCount: 2,
        monitorType: 'curved_presidential',
        chairModel: 'ceo_throne',
        deskType: 'presidential_walnut',
        personalItems: ['gold_nameplate', 'crystal_carafe', 'awards_credenza', 'gold_pen_holder'],
        boardTitle: 'MASTER EXECUTIVE ROADMAP & VISION',
        boardTasks: [
          'Global Enterprise Expansion Roadmap 2026',
          'All-Department Synergy: Web, AI, Systems & Growth',
          'Multi-Year Capital Allocation & Keynote Delivery'
        ]
      },
      funFact: 'The generous heart and soul of the company. Treats every employee like family, orders legendary canteen feasts, and gives energizing high-fives.',
      teamBonds: [
        {
          friendId: 'adhi',
          friendName: 'Adhi',
          relationship: 'Web Architecture Protégé',
          collaboration: 'Empowers Adhi to build state-of-the-art Next.js and 3D web platforms.'
        },
        {
          friendId: 'abbu',
          friendName: 'Abbu',
          relationship: 'Creative Vision Partner',
          collaboration: 'Celebrates Abbu’s stunning design aesthetics and conversion milestones.'
        },
        {
          friendId: 'prox',
          friendName: 'Prox',
          relationship: 'Market Authority Confidant',
          collaboration: 'Relies on Prox’s search intelligence to position Verlyn Tech as the #1 authority in the industry.'
        },
        {
          friendId: 'vaibav',
          friendName: 'VD (Vaibav)',
          relationship: 'AI Innovation Ally',
          collaboration: 'Funds VD’s cutting-edge multi-agent systems and enterprise agent meshes.'
        },
        {
          friendId: 'taha',
          friendName: 'Taha',
          relationship: 'Enterprise Systems Backbone',
          collaboration: 'Counts on Taha to maintain bulletproof CRM, ERP, and database integrity.'
        },
        {
          friendId: 'rewaant',
          friendName: 'Rewu (Rewaant)',
          relationship: 'Growth & Expansion Dynamo',
          collaboration: 'Celebrates Rewu’s outbound wins and strategizes high-value enterprise acquisition.'
        }
      ]
    }
  ],

  // ================= 2. AUTOMATIC DOORS & SENSOR ZONES ([Q] KEY + SENSOR) =================
  doors: [
    {
      id: 'door-web-search',
      name: 'Web & Search Studio Doors',
      roomName: 'Web & Search Studio',
      type: 'swing',
      x: -2.4,
      z: -5.2,
      width: 2.8,
      sensorRadius: 2.4,
      accentColor: 0x0284C7,
      swingDirection: -1
    },
    {
      id: 'door-ai-systems',
      name: 'AI & Business Systems Lab Doors',
      roomName: 'AI & Business Systems Lab',
      type: 'swing',
      x: -2.4,
      z: 5.2,
      width: 2.8,
      sensorRadius: 2.4,
      accentColor: 0x7C3AED,
      swingDirection: -1
    },
    {
      id: 'door-growth',
      name: 'Growth Studio Doors',
      roomName: 'Growth Studio',
      type: 'swing',
      x: 2.4,
      z: 5.2,
      width: 2.8,
      sensorRadius: 2.4,
      accentColor: 0x059669,
      swingDirection: 1
    },
    {
      id: 'door-ceo',
      name: 'CEO Executive Suite Doors',
      roomName: 'CEO Office & Boardroom',
      type: 'swing',
      x: 2.4,
      z: -5.2,
      width: 2.8,
      sensorRadius: 2.4,
      accentColor: 0xF59E0B,
      swingDirection: 1
    },
    {
      id: 'door-canteen',
      name: 'Canteen & Executive Lounge Sliding Doors',
      roomName: 'Canteen & Lounge',
      type: 'sliding',
      x: 0,
      z: -10.5,
      width: 3.2,
      sensorRadius: 2.8,
      accentColor: 0x06B6D4
    },
    {
      id: 'door-main',
      name: 'Main Entrance Glass Doors',
      roomName: 'Entrance Plaza',
      type: 'sliding',
      x: 0,
      z: 10.5,
      width: 3.4,
      sensorRadius: 2.8,
      accentColor: 0x38BDF8
    }
  ],

  // ================= 3. NAVIGATION WAYPOINT GRAPH (>= 1.2m CLEARANCE) =================
  waypoints: {
    nodes: [
      // Central Corridor Spine (North-South)
      { id: 'node_corr_entrance', x: 0, z: 9.5, room: 'corridor', clearanceRadius: 1.8 },
      { id: 'node_corr_south', x: 0, z: 5.2, room: 'corridor', clearanceRadius: 1.8 },
      { id: 'node_corr_mid', x: 0, z: 0.0, room: 'corridor', clearanceRadius: 1.8 },
      { id: 'node_corr_north', x: 0, z: -5.2, room: 'corridor', clearanceRadius: 1.8 },
      { id: 'node_corr_canteen_portal', x: 0, z: -9.5, room: 'corridor', clearanceRadius: 1.8 },

      // Doorway Threshold Nodes (Directly aligned with door centers)
      { id: 'node_door_web_search', x: -2.4, z: -5.2, room: 'web-search', clearanceRadius: 1.4 },
      { id: 'node_door_ai_systems', x: -2.4, z: 5.2, room: 'ai-systems', clearanceRadius: 1.4 },
      { id: 'node_door_growth', x: 2.4, z: 5.2, room: 'growth', clearanceRadius: 1.4 },
      { id: 'node_door_ceo', x: 2.4, z: -5.2, room: 'ceo', clearanceRadius: 1.4 },
      { id: 'node_door_canteen', x: 0, z: -10.5, room: 'canteen', clearanceRadius: 1.6 },

      // Room 1: Web & Search Studio Interior Nodes
      { id: 'node_web_search_center', x: -5.5, z: -5.2, room: 'web-search', clearanceRadius: 1.5 },
      { id: 'node_desk_adhi', x: -9.5, z: -5.5, room: 'web-search', clearanceRadius: 1.3 },
      { id: 'node_desk_abbu', x: -5.5, z: -5.5, room: 'web-search', clearanceRadius: 1.3 },
      { id: 'node_desk_prox', x: -7.5, z: -4.5, room: 'web-search', clearanceRadius: 1.3 },

      // Room 2: AI & Business Systems Lab Interior Nodes
      { id: 'node_ai_systems_center', x: -5.5, z: 5.2, room: 'ai-systems', clearanceRadius: 1.5 },
      { id: 'node_desk_vaibav', x: -9.5, z: 6.0, room: 'ai-systems', clearanceRadius: 1.3 },
      { id: 'node_desk_taha', x: -5.5, z: 6.0, room: 'ai-systems', clearanceRadius: 1.3 },

      // Room 3: Growth Studio Interior Nodes
      { id: 'node_growth_center', x: 5.5, z: 5.2, room: 'growth', clearanceRadius: 1.5 },
      { id: 'node_desk_rewaant', x: 8.5, z: 4.0, room: 'growth', clearanceRadius: 1.3 },

      // Room 4: CEO Interior Nodes (>= 1.5m clearance for Ameen)
      { id: 'node_ceo_center', x: 5.5, z: -5.2, room: 'ceo', clearanceRadius: 1.6 },
      { id: 'node_ceo_desk_front', x: 8.5, z: -4.5, room: 'ceo', clearanceRadius: 1.5 },
      { id: 'node_ceo_throne_approach', x: 8.5, z: -7.6, room: 'ceo', clearanceRadius: 1.5 },

      // Room 5: Canteen & Lounge Interior Nodes
      { id: 'node_canteen_entry', x: 0, z: -12.0, room: 'canteen', clearanceRadius: 1.8 },
      { id: 'node_canteen_hub', x: 0, z: -15.5, room: 'canteen', clearanceRadius: 2.0 },
      { id: 'node_canteen_coffee_bar', x: -1.05, z: -14.5, room: 'canteen', clearanceRadius: 1.5 },
      { id: 'node_canteen_snack_wall', x: 1.9, z: -14.5, room: 'canteen', clearanceRadius: 1.5 },
      { id: 'node_canteen_lounge_aisle', x: -0.45, z: -17.7, room: 'canteen', clearanceRadius: 1.5 },
      { id: 'node_canteen_sofa_zone', x: -2.5, z: -18.10, room: 'canteen', clearanceRadius: 1.6 },
      { id: 'node_canteen_bar_stools', x: 0, z: -19.2, room: 'canteen', clearanceRadius: 1.5 },
      { id: 'node_canteen_dining_south', x: 0.2, z: -17.0, room: 'canteen', clearanceRadius: 1.0 },
      { id: 'node_canteen_dining_north', x: 0.2, z: -18.8, room: 'canteen', clearanceRadius: 1.0 }
    ],

    edges: [
      // Central Corridor Spine
      { from: 'node_corr_entrance', to: 'node_corr_south', distance: 4.3 },
      { from: 'node_corr_south', to: 'node_corr_mid', distance: 5.2 },
      { from: 'node_corr_mid', to: 'node_corr_north', distance: 5.2 },
      { from: 'node_corr_north', to: 'node_corr_canteen_portal', distance: 4.3 },

      // Corridor to Doorways
      { from: 'node_corr_north', to: 'node_door_web_search', distance: 2.4, doorId: 'door-web-search' },
      { from: 'node_corr_south', to: 'node_door_ai_systems', distance: 2.4, doorId: 'door-ai-systems' },
      { from: 'node_corr_south', to: 'node_door_growth', distance: 2.4, doorId: 'door-growth' },
      { from: 'node_corr_north', to: 'node_door_ceo', distance: 2.4, doorId: 'door-ceo' },
      { from: 'node_corr_canteen_portal', to: 'node_door_canteen', distance: 1.0, doorId: 'door-canteen' },

      // Web & Search Door to Interior
      { from: 'node_door_web_search', to: 'node_web_search_center', distance: 3.1 },
      { from: 'node_web_search_center', to: 'node_desk_adhi', distance: 4.0 },
      { from: 'node_web_search_center', to: 'node_desk_abbu', distance: 1.2 },
      { from: 'node_web_search_center', to: 'node_desk_prox', distance: 2.1 },

      // AI & Business Systems Door to Interior
      { from: 'node_door_ai_systems', to: 'node_ai_systems_center', distance: 3.1 },
      { from: 'node_ai_systems_center', to: 'node_desk_vaibav', distance: 4.1 },
      { from: 'node_ai_systems_center', to: 'node_desk_taha', distance: 1.5 },

      // Growth Studio Door to Interior
      { from: 'node_door_growth', to: 'node_growth_center', distance: 3.1 },
      { from: 'node_growth_center', to: 'node_desk_rewaant', distance: 3.2 },

      // CEO Door to Interior
      { from: 'node_door_ceo', to: 'node_ceo_center', distance: 3.1 },
      { from: 'node_ceo_center', to: 'node_ceo_desk_front', distance: 3.0 },
      { from: 'node_ceo_desk_front', to: 'node_ceo_throne_approach', distance: 2.8 },

      { from: 'node_canteen_hub', to: 'node_canteen_dining_south', distance: 1.5 },
      { from: 'node_canteen_dining_south', to: 'node_canteen_dining_north', distance: 1.8 },
      // Canteen Door to Interior Zones (Routing cleanly around coffee table & armchairs)
      { from: 'node_door_canteen', to: 'node_canteen_entry', distance: 1.5 },
      { from: 'node_canteen_entry', to: 'node_canteen_hub', distance: 3.5 },
      { from: 'node_canteen_hub', to: 'node_canteen_coffee_bar', distance: 3.0 },
      { from: 'node_canteen_coffee_bar', to: 'node_canteen_hub', distance: 3.0 },
      { from: 'node_canteen_hub', to: 'node_canteen_snack_wall', distance: 3.0 },
      { from: 'node_canteen_hub', to: 'node_canteen_lounge_aisle', distance: 2.5 },
      { from: 'node_canteen_lounge_aisle', to: 'node_canteen_sofa_zone', distance: 1.8 },
      { from: 'node_canteen_hub', to: 'node_canteen_bar_stools', distance: 3.7 },
    ]
  },

  // ================= 4. REUSABLE INTERACTION POINTS & SEATS =================
  interactionPoints: [
    // --- 1. Adhi (Senior Website & Architecture Developer) ---
    {
      id: 'seat_desk_adhi',
      type: 'desk',
      name: "Adhi's Web Architecture Perch",
      position: [-9.5, 0, -7.95],
      facingDirection: 0, // Faces South toward visitor chair
      room: 'web-search',
      approachNodeId: 'node_desk_adhi',
      userInteractable: true
    },
    {
      id: 'seat_visitor_adhi',
      type: 'seat',
      name: "Adhi's Visitor Chair",
      position: [-9.5, 0, -5.95],
      facingDirection: Math.PI, // Faces North into Adhi's face
      room: 'web-search',
      approachNodeId: 'node_desk_adhi',
      userInteractable: true
    },

    // --- 2. Abbu (Lead Landing Page & Conversion Designer) ---
    {
      id: 'seat_desk_abbu',
      type: 'desk',
      name: "Abbu's CRO Design Chair",
      position: [-5.5, 0, -7.95],
      facingDirection: 0,
      room: 'web-search',
      approachNodeId: 'node_desk_abbu',
      userInteractable: true
    },
    {
      id: 'seat_visitor_abbu',
      type: 'seat',
      name: "Abbu's Visitor Chair",
      position: [-5.5, 0, -5.95],
      facingDirection: Math.PI,
      room: 'web-search',
      approachNodeId: 'node_desk_abbu',
      userInteractable: true
    },

    // --- 3. Prox (Search Intelligence & GEO Lead) ---
    {
      id: 'seat_desk_prox',
      type: 'desk',
      name: "Prox's Search Intelligence Chair",
      position: [-7.5, 0, -2.05],
      facingDirection: Math.PI,
      room: 'web-search',
      approachNodeId: 'node_desk_prox',
      userInteractable: true
    },
    {
      id: 'seat_visitor_prox',
      type: 'seat',
      name: "Prox's Visitor Chair",
      position: [-7.5, 0, -4.05],
      facingDirection: 0,
      room: 'web-search',
      approachNodeId: 'node_desk_prox',
      userInteractable: true
    },

    // --- 4. VD (Vaibav - Head of Autonomous AI Agents & Workflows) ---
    {
      id: 'seat_desk_vaibav',
      type: 'desk',
      name: "VD's Autonomous AI Agent Station",
      position: [-9.5, 0, 5.25],
      facingDirection: Math.PI,
      room: 'ai-systems',
      approachNodeId: 'node_desk_vaibav',
      userInteractable: true
    },
    {
      id: 'seat_visitor_vaibav',
      type: 'seat',
      name: "VD's AI Visitor Chair",
      position: [-9.5, 0, 3.25],
      facingDirection: 0,
      room: 'ai-systems',
      approachNodeId: 'node_desk_vaibav',
      userInteractable: true
    },

    // --- 5. Taha (Enterprise Systems & CRM/ERP Integration Architect) ---
    {
      id: 'seat_desk_taha',
      type: 'desk',
      name: "Taha's Enterprise Systems Desk",
      position: [-5.5, 0, 8.25],
      facingDirection: Math.PI,
      room: 'ai-systems',
      approachNodeId: 'node_desk_taha',
      userInteractable: true
    },
    {
      id: 'seat_visitor_taha',
      type: 'seat',
      name: "Taha's Systems Visitor Chair",
      position: [-5.5, 0, 6.25],
      facingDirection: 0,
      room: 'ai-systems',
      approachNodeId: 'node_desk_taha',
      userInteractable: true
    },

    // --- 6. Rewu (Rewaant - Head of Growth & Outbound Pipeline) ---
    {
      id: 'seat_desk_rewaant',
      type: 'desk',
      name: "Rewu's Outbound Growth Chair",
      position: [8.5, 0, 6.25],
      facingDirection: Math.PI,
      room: 'growth',
      approachNodeId: 'node_desk_rewaant',
      userInteractable: true
    },
    {
      id: 'seat_visitor_rewaant',
      type: 'seat',
      name: "Rewu's Growth Visitor Chair",
      position: [8.5, 0, 4.25],
      facingDirection: 0,
      room: 'growth',
      approachNodeId: 'node_desk_rewaant',
      userInteractable: true
    },

    // --- 7. Ameen (Chief Executive Officer - CEO) ---
    {
      id: 'seat_desk_ceo',
      type: 'desk',
      name: "Ameen's Presidential Throne",
      position: [8.5, 0, -7.55],
      facingDirection: 0, // Faces South toward visitor chair
      room: 'ceo',
      approachNodeId: 'node_ceo_throne_approach',
      userInteractable: true
    },
    {
      id: 'seat_visitor_ceo',
      type: 'seat',
      name: "Ameen's Executive Visitor Chair",
      position: [8.5, 0, -5.25],
      facingDirection: Math.PI, // Faces North directly into Ameen's face across the desk
      room: 'ceo',
      approachNodeId: 'node_ceo_desk_front',
      userInteractable: true
    },

    // --- Canteen Appliances & Dispensers ---
    {
      id: 'canteen_coffee_machine',
      type: 'coffee_machine',
      name: "Canteen Espresso Machine",
      position: [-1.05, 0, -14.5],
      facingDirection: -Math.PI / 2, // Faces West directly into coffee counter
      room: 'canteen',
      approachNodeId: 'node_canteen_coffee_bar',
      userInteractable: true
    },
    {
      id: 'canteen_coffee_queue_1',
      type: 'standing_spot',
      name: 'Coffee bar waiting spot 1',
      position: [0.15, 0, -13.0],
      facingDirection: -Math.PI / 2,
      room: 'canteen',
      approachNodeId: 'node_canteen_hub'
    },
    {
      id: 'canteen_coffee_queue_2',
      type: 'standing_spot',
      name: 'Coffee bar waiting spot 2',
      position: [0.15, 0, -15.0],
      facingDirection: -Math.PI / 2,
      room: 'canteen',
      approachNodeId: 'node_canteen_hub'
    },
    { id: 'canteen_food_pickup_1', type: 'food_serving', name: 'Serving table · pickup 1', position: [1.9, 0, -13], facingDirection: Math.PI / 2, room: 'canteen', approachNodeId: 'node_canteen_hub', userInteractable: true },
    { id: 'canteen_food_pickup_2', type: 'food_serving', name: 'Serving table · pickup 2', position: [1.9, 0, -14.5], facingDirection: Math.PI / 2, room: 'canteen', approachNodeId: 'node_canteen_hub', userInteractable: true },
    { id: 'canteen_food_pickup_3', type: 'food_serving', name: 'Serving table · pickup 3', position: [1.9, 0, -16], facingDirection: Math.PI / 2, room: 'canteen', approachNodeId: 'node_canteen_hub', userInteractable: true },
    // --- Canteen Lounge Seating ---
    {
      id: 'canteen_sofa_seat_1',
      type: 'sofa',
      name: "Lounge Sofa (Left)",
      position: [-3.2, 0, -18.10],
      facingDirection: 0, // Faces South into room
      room: 'canteen',
      approachNodeId: 'node_canteen_sofa_zone',
      userInteractable: true
    },
    {
      id: 'canteen_sofa_seat_2',
      type: 'sofa',
      name: "Lounge Sofa (Center)",
      position: [-2.5, 0, -18.10],
      facingDirection: 0,
      room: 'canteen',
      approachNodeId: 'node_canteen_sofa_zone',
      userInteractable: true
    },
    {
      id: 'canteen_sofa_seat_3',
      type: 'sofa',
      name: "Lounge Sofa (Right)",
      position: [-1.8, 0, -18.10],
      facingDirection: 0,
      room: 'canteen',
      approachNodeId: 'node_canteen_sofa_zone',
      userInteractable: true
    },

    // Armchairs
    {
      id: 'canteen_armchair_1',
      type: 'seat',
      name: "Modern Armchair (West)",
      position: [-3.5, 0, -16.5],
      facingDirection: Math.PI / 4,
      room: 'canteen',
      approachNodeId: 'node_canteen_sofa_zone',
      userInteractable: true
    },
    {
      id: 'canteen_armchair_2',
      type: 'seat',
      name: "Modern Armchair (East)",
      position: [-1.2, 0, -16.5],
      facingDirection: -Math.PI / 4,
      room: 'canteen',
      approachNodeId: 'node_canteen_sofa_zone',
      userInteractable: true
    },

    // Panoramic Skyline Bar Stools
    {
      id: 'canteen_bar_stool_1',
      type: 'bar_stool',
      name: "Skyline Bar Stool 1",
      position: [-1.5, 0, -19.4],
      facingDirection: Math.PI, // Facing North out panoramic window
      room: 'canteen',
      approachNodeId: 'node_canteen_bar_stools',
      userInteractable: true
    },
    {
      id: 'canteen_bar_stool_2',
      type: 'bar_stool',
      name: "Skyline Bar Stool 2",
      position: [-0.5, 0, -19.4],
      facingDirection: Math.PI,
      room: 'canteen',
      approachNodeId: 'node_canteen_bar_stools',
      userInteractable: true
    },
    {
      id: 'canteen_bar_stool_3',
      type: 'bar_stool',
      name: "Skyline Bar Stool 3",
      position: [0.5, 0, -19.4],
      facingDirection: Math.PI,
      room: 'canteen',
      approachNodeId: 'node_canteen_bar_stools',
      userInteractable: true
    },
    {
      id: 'canteen_bar_stool_4',
      type: 'bar_stool',
      name: "Skyline Bar Stool 4",
      position: [1.5, 0, -19.4],
      facingDirection: Math.PI,
      room: 'canteen',
      approachNodeId: 'node_canteen_bar_stools',
      userInteractable: true
    },
    { id: 'canteen_dining_1', type: 'seat', name: 'Dining chair 1', position: [1.4, 0, -17.2], facingDirection: Math.PI, room: 'canteen', approachNodeId: 'node_canteen_dining_south', userInteractable: true },
    { id: 'canteen_dining_2', type: 'seat', name: 'Dining chair 2', position: [2.6, 0, -17.2], facingDirection: Math.PI, room: 'canteen', approachNodeId: 'node_canteen_dining_south', userInteractable: true },
    { id: 'canteen_dining_3', type: 'seat', name: 'Dining chair 3', position: [1.4, 0, -18.8], facingDirection: 0, room: 'canteen', approachNodeId: 'node_canteen_dining_north', userInteractable: true },
    { id: 'canteen_dining_4', type: 'seat', name: 'Dining chair 4', position: [2.6, 0, -18.8], facingDirection: 0, room: 'canteen', approachNodeId: 'node_canteen_dining_north', userInteractable: true }
  ]
};
