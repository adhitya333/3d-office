import * as THREE from 'three';
import { EmployeeProfileConfig } from '../../config/office.config';
import { OfficeTextureGenerator } from './OfficeTextureGenerator';
import { GeometryBatcher } from './GeometryBatcher';
import { ROOM_DESIGNS } from '../../data/roomDesign';

export interface DeskStationController {
  group: THREE.Group;
  update: (time: number) => void;
}

export class DeskFactory {
  /**
   * Generates low-frequency animated canvas textures for desk monitors (1Hz update)
   */
  private static screenTextures: { [key: string]: THREE.CanvasTexture } = {};
  private static screenCanvases: { [key: string]: HTMLCanvasElement } = {};

  private static getScreenTexture(
    id: string,
    title: string,
    subtitle: string,
    type: 'dual_horizontal' | 'ultrawide' | 'triple' | 'dual_vertical' | 'curved_presidential'
  ): THREE.CanvasTexture {
    if (this.screenTextures[id]) return this.screenTextures[id];

    const canvas = document.createElement('canvas');
    canvas.width = type === 'dual_vertical' ? 640 : 1024;
    canvas.height = type === 'dual_vertical' ? 1024 : 640;
    this.screenCanvases[id] = canvas;

    this.renderScreenContent(id, title, subtitle, type, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    this.screenTextures[id] = tex;
    return tex;
  }

  public static renderScreenContent(id: string, title: string, subtitle: string, type: string, time: number) {
    const canvas = this.screenCanvases[id];
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const w = canvas.width / 2;
    const h = canvas.height / 2;

    // Dark sleek background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Title bar with macOS / Linux style dots
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, w, 24);

    ['#EF4444', '#F59E0B', '#10B981'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(12 + i * 14, 12, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(title, 62, 16);

    if (id === 'adhi') {
      // Adhi: Web Architecture & Next.js Repo
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(subtitle, 16, 50);

      const items = [
        '▶ Next.js 15 Server Components: READY',
        '▶ Interactive viewport preview',
        '▶ Client Portal Auth & Webhooks: DEPLOYED',
        '▶ Core Web Vitals LCP: 0.8s (Score: 99/100)'
      ];
      ctx.font = '11px monospace';
      items.forEach((item, idx) => {
        ctx.fillStyle = idx === 1 ? '#38BDF8' : '#94A3B8';
        ctx.fillText(item, 16, 78 + idx * 24);
      });

      // Mini code syntax blocks
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(16, h - 35, 120, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('git push origin main', 22, h - 22);

    } else if (id === 'abbu') {
      // Abbu: Conversion Optimization & CRO Funnels
      ctx.fillStyle = '#2DD4BF';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(subtitle, 16, 50);

      const cro = [
        '▶ B2B Hero Section A/B Test (+24.8% CTR)',
        '▶ Figma Design System v2.4 Token Sync',
        '▶ Interactive Pricing Calculator: LIVE',
        '▶ Visitor Heatmap Scroll Depth: 82% Avg'
      ];
      ctx.font = '11px monospace';
      cro.forEach((c, idx) => {
        ctx.fillStyle = idx === 0 ? '#10B981' : '#CBD5E1';
        ctx.fillText(c, 16, 78 + idx * 24);
      });

      // Funnel step bars
      [0.9, 0.72, 0.54, 0.38].forEach((val, idx) => {
        ctx.fillStyle = '#0D9488';
        ctx.fillRect(16 + idx * 60, h - 35, 45, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '9px monospace';
        ctx.fillText(`${(val * 100).toFixed(0)}%`, 22 + idx * 60, h - 22);
      });

    } else if (id === 'prox') {
      // Prox: GEO & Search Intelligence Matrix (Ultrawide)
      ctx.fillStyle = '#A5B4FC';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(subtitle, 20, 52);

      const metrics = [
        { name: 'Perplexity Brand Citation Share', val: '68.4% (#1 RANK)', col: '#10B981' },
        { name: 'ChatGPT / OpenAI Search Footprint', val: '74.2% DOMINANCE', col: '#10B981' },
        { name: 'Google Gemini Overview Inclusions', val: '62.0% COVERAGE', col: '#F59E0B' },
        { name: 'Structured JSON-LD Schema Entities', val: '100% VALIDATED', col: '#38BDF8' }
      ];
      metrics.forEach((m, idx) => {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(20, 72 + idx * 34, w - 40, 26);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '12px monospace';
        ctx.fillText(m.name, 35, 90 + idx * 34);
        ctx.fillStyle = m.col;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(m.val, w - 220, 90 + idx * 34);
      });

    } else if (id === 'vaibav') {
      // VD: Autonomous Agent Mesh & Workflows
      ctx.fillStyle = '#C084FC';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(subtitle, 16, 50);

      const agents = [
        '▶ Gemini 2.0 Multi-Agent Mesh: ONLINE',
        '▶ Inbound Webhook Lead Enrichment: ACTIVE',
        '▶ Autonomous Error Retry Queue: 0 PENDING',
        '▶ Self-Healing Pipeline Health: 99.98%'
      ];
      ctx.font = '11px monospace';
      agents.forEach((a, idx) => {
        ctx.fillStyle = idx === 0 ? '#A855F7' : '#E2E8F0';
        ctx.fillText(a, 16, 78 + idx * 24);
      });

      // Node activity dots
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#7C3AED';
        ctx.beginPath();
        ctx.arc(30 + i * 40, h - 22, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#C084FC';
        ctx.fillRect(40 + i * 40, h - 24, 20, 4);
      }

    } else if (id === 'taha') {
      // Taha: Enterprise CRM/ERP & Database Matrix (Vertical)
      ctx.fillStyle = '#60A5FA';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(subtitle, 16, 50);

      const sys = [
        '§ PostgreSQL ACID Database: OK',
        '§ HubSpot Enterprise Bi-Sync: OK',
        '§ Stripe Billing Webhook Queue: OK',
        '§ Enterprise Okta/SAML SSO: READY',
        '§ SOC-2 Audit Logging: 100% PASS'
      ];
      ctx.font = '10px monospace';
      sys.forEach((s, idx) => {
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(s, 16, 80 + idx * 32);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(16, 92 + idx * 32, w - 32, 1);
      });

    } else if (id === 'rewaant') {
      // Rewu: B2B Growth Pipeline & Outbound Radar
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(subtitle, 16, 50);

      const pipe = [
        '▶ Q4 Outbound Pipeline: $4.2M VALUE',
        '▶ Deliverability Health: 99.2% INBOX',
        '▶ High-Touch ICP Sequences: 14 LIVE',
        '▶ Executive Briefings Booked: 38 THIS WK'
      ];
      ctx.font = '11px monospace';
      pipe.forEach((p, idx) => {
        ctx.fillStyle = idx === 0 ? '#10B981' : '#CBD5E1';
        ctx.fillText(p, 16, 78 + idx * 24);
      });

    } else if (id === 'ameen') {
      // Ameen: Master Executive Roadmap & Corporate Vision
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(subtitle, 16, 50);

      const pillars = [
        '▶ Global Enterprise Expansion Roadmap 2026',
        '▶ All-Department Synergy: Web, AI, Systems & Growth',
        '▶ Multi-Year Capital Allocation: $120M APPROVED',
        '▶ Verlyn Tech Culture: FAMILY & WORLD-CLASS EXCELLENCE'
      ];
      ctx.font = '11px monospace';
      pillars.forEach((p, idx) => {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(p, 16, 82 + idx * 26);
      });
    }
  }

  private static createMonitor(width: number, height: number, screenMaterial: THREE.Material, chassisMaterial: THREE.Material): THREE.Group {
    const monitor = new THREE.Group();
    monitor.name = 'Desk monitor';
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.045), chassisMaterial);
    chassis.castShadow = true;
    monitor.add(chassis);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.035, height - 0.045), screenMaterial);
    display.name = 'Monitor display';
    display.position.set(0, 0.005, 0.0235);
    monitor.add(display);
    if (height > 0.3) {
      const mount = new THREE.Mesh(new THREE.BoxGeometry(width * 0.26, height * 0.30, 0.018), chassisMaterial);
      mount.position.z = -0.03;
      monitor.add(mount);
      const led = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.003), new THREE.MeshBasicMaterial({ color: 0xB2CEB0, toneMapped: false }));
      led.position.set(width * 0.37, -height / 2 + 0.010, 0.024);
      monitor.add(led);
    }
    return monitor;
  }

  /** Builds the workstation; existing chair geometry and positions stay unchanged. */
  public static createWorkstation(emp: EmployeeProfileConfig): DeskStationController {
    const station = new THREE.Group();
    station.position.set(emp.deskPosition[0], 0, emp.deskPosition[2]);
    station.rotation.y = emp.deskRotation;

    const isCEO = emp.id === 'ameen';
    const palette = ROOM_DESIGNS[emp.departmentId as keyof typeof ROOM_DESIGNS] || ROOM_DESIGNS['web-search'];

    // Materials
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.1, metalness: 0.95 });
    const blackSteelMat = new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.35, metalness: 0.85 });
    const woodTimberMat = new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.45, metalness: 0.02 });
    const charcoalMat = new THREE.MeshStandardMaterial({ color: palette.dark, roughness: 0.55, metalness: 0.12 });
    const walnutMat = new THREE.MeshStandardMaterial({ color: palette.wood, roughness: 0.42, metalness: 0.03 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xBAE6FD, transparent: true, opacity: 0.5, roughness: 0.05, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.35, metalness: 0.65 });

    // Screen texture
    const screenTex = this.getScreenTexture(emp.id, `${emp.name} — ${emp.role}`, emp.deskStyle.boardTitle, emp.deskStyle.monitorType);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });

    if (isCEO) {
      // ================= AMEEN: PRESIDENTIAL CEO BOARDROOM DESK =================
      // Massive Espresso Walnut Desk Top (4.0m x 1.6m, height 0.78m)
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.10, 1.6), walnutMat);
      deskTop.position.set(0, 0.78, 0);
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;
      station.add(deskTop);

      const writingSurface = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.012, 1.12), new THREE.MeshStandardMaterial({ map: OfficeTextureGenerator.getWhiteMarbleTexture(), color: palette.stone, roughness: 0.32 }));
      writingSurface.position.set(0, 0.836, 0); station.add(writingSurface);

      // Gold Inlay Perimeter Trim
      const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(4.04, 0.025, 1.64), goldMat);
      goldTrim.position.set(0, 0.73, 0);
      station.add(goldTrim);

      // Twin Monolith Pedestal Bases
      [-1.5, 1.5].forEach(px => {
        const ped = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.72, 1.3), charcoalMat);
        ped.position.set(px, 0.36, 0);
        ped.castShadow = true;
        station.add(ped);

        const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 1.36), goldMat);
        plinth.position.set(px, 0.02, 0);
        station.add(plinth);
      });

      // Modesty panel
      const modesty = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 0.05), walnutMat);
      modesty.position.set(0, 0.42, -0.55);
      station.add(modesty);

      // Desk blotter pad
      const pad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.01, 0.95), charcoalMat);
      pad.position.set(0, 0.835, 0);
      station.add(pad);

      // TWIN WING CURVED MONITORS: Spread wide apart (X = -1.35 and +1.35),
      // angled outward at 38 degrees, leaving the center 100% CLEAR for eye contact!
      [-1.35, 1.35].forEach((sx, idx) => {
        const wingScreen = this.createMonitor(0.92, 0.54, screenMat, blackSteelMat);
        wingScreen.position.set(sx, 1.15, -0.12);
        wingScreen.rotation.y = idx === 0 ? 0.38 : -0.38;
        station.add(wingScreen);

        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42), chromeMat);
        stand.position.set(sx, 0.94, -0.12);
        station.add(stand);
      });

      // SLATE LAPTOP: Positioned on the right wing (X = 0.52), angled flat and low-profile
      // Leaving Ameen's face, smile, wide shoulders, and round belly 100% unblocked across the center!
      const lapBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.012, 0.24), chromeMat);
      lapBase.position.set(0.52, 0.841, 0.08);
      station.add(lapBase);

      const lapScreen = this.createMonitor(0.36, 0.18, screenMat, blackSteelMat);
      lapScreen.position.set(0.52, 0.900, -0.04);
      lapScreen.rotation.x = -0.55; // Low tilt, never blocks sightlines
      station.add(lapScreen);

      // Center desk pad for executive writing
      const centerPad = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.008, 0.42), blackSteelMat);
      centerPad.position.set(0, 0.840, 0.05);
      station.add(centerPad);

      // Gold executive nameplate on wing
      const npGroup = new THREE.Group();
      npGroup.position.set(-1.1, 0.84, -0.55);
      const npBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.08), goldMat);
      npGroup.add(npBase);
      station.add(npGroup);

      // Crystal carafe on far wing
      const carafe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.065, 0.18, 12),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.1 })
      );
      carafe.position.set(-1.55, 0.92, 0.25);
      station.add(carafe);

      // Huimei Office Chair 2125C (Executive Edition) behind desk at local Z = 1.05, facing desk (Math.PI)
      const throne = DeskFactory.createExecutiveChair();
      throne.position.set(0, 0, 1.05);
      throne.rotation.y = Math.PI;
      station.add(throne);

    } else if (emp.id === 'adhi') {
      // ================= ADHI: ERGONOMIC NEXT.JS DEVELOPER DESK =================
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 1.0), woodTimberMat);
      deskTop.position.set(0, 0.76, 0); // Standard ergonomic seated desk height
      deskTop.castShadow = true;
      station.add(deskTop);

      [-0.85, 0.85].forEach(cx => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), blackSteelMat);
        col.position.set(cx, 0.36, 0);
        station.add(col);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.75), blackSteelMat);
        foot.position.set(cx, 0.02, 0);
        station.add(foot);
      });

      // DUAL WING MONITORS: Spread wide apart (X = -0.68 and +0.68), angled inward
      // Leaving the center 100% completely open so Adhi's face is fully visible!
      [-0.68, 0.68].forEach((mx, idx) => {
        const mon = this.createMonitor(0.64, 0.40, screenMat, blackSteelMat);
        mon.position.set(mx, 1.08, -0.16);
        mon.rotation.y = idx === 0 ? 0.35 : -0.35;
        station.add(mon);

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32), blackSteelMat);
        arm.position.set(mx, 0.90, -0.16);
        station.add(arm);
      });

      // Split mechanical keyboard & spinning globe on side
      const globeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.04), goldMat);
      globeBase.position.set(0.95, 0.81, -0.15);
      station.add(globeBase);
      const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3 }));
      globeSphere.position.set(0.95, 0.94, -0.15);
      station.add(globeSphere);

      // Split ergonomic keyboard in center
      const kbMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.4 });
      const leftKb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.14), kbMat);
      leftKb.position.set(-0.14, 0.77, 0.12);
      leftKb.rotation.y = 0.15;
      station.add(leftKb);
      const rightKb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.14), kbMat);
      rightKb.position.set(0.14, 0.77, 0.12);
      rightKb.rotation.y = -0.15;
      station.add(rightKb);

      // Huimei Office Task Chair 2125C
      const chair = DeskFactory.createHuimeiSledChair();
      chair.position.set(0, 0, 0.75);
      chair.rotation.y = Math.PI;
      station.add(chair);

    } else if (emp.id === 'abbu') {
      // ================= ABBU: SLEEK CHARCOAL DESK & FIGMA MONITORS =================
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.0), charcoalMat);
      deskTop.position.set(0, 0.75, 0);
      deskTop.castShadow = true;
      station.add(deskTop);

      [-0.88, 0.88].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.8), charcoalMat);
        leg.position.set(lx, 0.36, 0);
        station.add(leg);
      });

      // Spread monitors wide into side wings, leaving center 100% open for face sightline
      [-0.68, 0.68].forEach((mx, idx) => {
        const mon = this.createMonitor(0.64, 0.40, screenMat, blackSteelMat);
        mon.position.set(mx, 1.08, -0.16);
        mon.rotation.y = idx === 0 ? 0.35 : -0.35;
        station.add(mon);

        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32), blackSteelMat);
        stand.position.set(mx, 0.90, -0.16);
        station.add(stand);
      });

      // Matte desk lamp on far edge
      const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42), blackSteelMat);
      lampArm.position.set(-0.95, 0.96, -0.15);
      station.add(lampArm);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.06), goldMat);
      lampHead.position.set(-0.95, 1.17, -0.05);
      station.add(lampHead);

      // Huimei Office Task Chair 2125C
      const chair = DeskFactory.createHuimeiSledChair();
      chair.position.set(0, 0, 0.75);
      chair.rotation.y = Math.PI;
      station.add(chair);

    } else if (emp.id === 'prox') {
      // ================= PROX: WALNUT CREDENZA & SEARCH INTELLIGENCE SCREENS =================
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), walnutMat);
      deskTop.position.set(0, 0.76, 0);
      deskTop.castShadow = true;
      station.add(deskTop);

      [-0.92, 0.92].forEach(dx => {
        const drawers = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.72, 0.95), walnutMat);
        drawers.position.set(dx, 0.36, 0);
        station.add(drawers);
      });

      // DUAL ANGLED SCREENS: Angled to sides, leaving center clear to see Prox's face
      [-0.64, 0.64].forEach((sx, idx) => {
        const mon = this.createMonitor(0.62, 0.40, screenMat, blackSteelMat);
        mon.position.set(sx, 1.08, -0.16);
        mon.rotation.y = idx === 0 ? 0.32 : -0.32;
        station.add(mon);

        const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32), blackSteelMat);
        monStand.position.set(sx, 0.90, -0.16);
        station.add(monStand);
      });

      // Huimei Office Task Chair 2125C
      const chair = DeskFactory.createHuimeiSledChair();
      chair.position.set(0, 0, 0.75);
      chair.rotation.y = Math.PI;
      station.add(chair);

    } else if (emp.id === 'vaibav') {
      // ================= VD (VAIBAV): STEEL & GLASS DESK & AI SCREENS =================
      const deskFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 1.0), blackSteelMat);
      deskFrame.position.set(0, 0.74, 0);
      station.add(deskFrame);

      const glassTop = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.015, 0.98), glassMat);
      glassTop.position.set(0, 0.765, 0);
      station.add(glassTop);

      [-0.92, 0.92].forEach(sx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.74, 0.9), chromeMat);
        leg.position.set(sx, 0.37, 0);
        station.add(leg);
      });

      // Dual Angled AI Command Screens on wings, center open for VD's face
      [-0.68, 0.68].forEach((sx, idx) => {
        const sideMon = this.createMonitor(0.62, 0.40, screenMat, blackSteelMat);
        sideMon.position.set(sx, 1.08, -0.16);
        sideMon.rotation.y = idx === 0 ? 0.34 : -0.34;
        station.add(sideMon);

        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32), chromeMat);
        stand.position.set(sx, 0.90, -0.16);
        station.add(stand);
      });

      // Raspberry Pi cluster stack on right edge
      const piMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.4 });
      const pi = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.14), piMat);
      pi.position.set(0.95, 0.82, -0.15);
      station.add(pi);

      // Huimei Office Task Chair 2125C
      const chair = DeskFactory.createHuimeiSledChair();
      chair.position.set(0, 0, 0.75);
      chair.rotation.y = Math.PI;
      station.add(chair);

    } else if (emp.id === 'taha') {
      // ================= TAHA: WALNUT CREDENZA & DUAL VERTICAL MONITORS =================
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), walnutMat);
      deskTop.position.set(0, 0.76, 0);
      deskTop.castShadow = true;
      station.add(deskTop);

      [-0.85, 0.85].forEach(dx => {
        const drawers = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.72, 0.85), walnutMat);
        drawers.position.set(dx, 0.36, 0);
        station.add(drawers);
      });

      // Dual Vertical Portrait Monitors on side wings, center 100% open
      [-0.62, 0.62].forEach((vx, idx) => {
        const vMon = this.createMonitor(0.36, 0.54, screenMat, blackSteelMat);
        vMon.position.set(vx, 1.12, -0.18);
        vMon.rotation.y = idx === 0 ? 0.28 : -0.28;
        station.add(vMon);

        const vArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38), chromeMat);
        vArm.position.set(vx, 0.95, -0.18);
        station.add(vArm);
      });

      // Retro mechanical calculator
      const calc = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), blackSteelMat);
      calc.position.set(-0.92, 0.82, 0.2);
      station.add(calc);

      // Huimei Office Task Chair 2125C
      const chair = DeskFactory.createHuimeiSledChair();
      chair.position.set(0, 0, 0.75);
      chair.rotation.y = Math.PI;
      station.add(chair);

    } else if (emp.id === 'rewaant') {
      // ================= REWU: SLEEK TIMBER DESK & CREATIVE RADAR =================
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 1.0), woodTimberMat);
      deskTop.position.set(0, 0.76, 0);
      deskTop.castShadow = true;
      station.add(deskTop);

      [-0.85, 0.85].forEach(lx => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.8), blackSteelMat);
        leg.position.set(lx, 0.36, 0);
        station.add(leg);
      });

      // Dual wing radar monitors, center 100% open
      [-0.68, 0.68].forEach((mx, idx) => {
        const mon = this.createMonitor(0.64, 0.40, screenMat, blackSteelMat);
        mon.position.set(mx, 1.08, -0.16);
        mon.rotation.y = idx === 0 ? 0.35 : -0.35;
        station.add(mon);

        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32), blackSteelMat);
        stand.position.set(mx, 0.90, -0.16);
        station.add(stand);
      });

      // Potted Monstera plant on far right edge
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xB45309 }));
      pot.position.set(0.95, 0.91, -0.22);
      station.add(pot);
      const plantLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.6 }));
      plantLeaf.position.set(0.95, 1.12, -0.22);
      station.add(plantLeaf);

      // Huimei Office Task Chair 2125C
      const chair = DeskFactory.createHuimeiSledChair();
      chair.position.set(0, 0, 0.75);
      chair.rotation.y = Math.PI;
      station.add(chair);
    }

    // ================= HUIMEI OFFICE VISITOR CHAIR 2125C (OPPOSITE DESK) =================
    // Positioned opposite the desk facing the employee
    const visitorChairGroup = DeskFactory.createHuimeiSledChair();
    visitorChairGroup.position.set(0, 0, -1.25);
    // Faces back across the desk toward the employee
    visitorChairGroup.rotation.y = 0;
    station.add(visitorChairGroup);

    // Consolidate static geometry batches into single meshes per material (>85% draw call reduction)
    GeometryBatcher.batchStaticGroup(station, (m) => m.material === screenMat || m.userData?.isDynamic === true);

    return {
      group: station,
      // The desktop pixels are static; avoid reuploading identical high-resolution textures.
      update: () => {}
    };
  }

  /** Wide leather executive chair; the seat anchor and cushion height stay fixed. */
  public static createExecutiveChair(): THREE.Group {
    const chair = new THREE.Group();
    chair.name = 'Ameen executive leather chair';
    const leather = new THREE.MeshStandardMaterial({ color: 0x302921, roughness: 0.72 });
    const walnut = new THREE.MeshStandardMaterial({ color: 0x49362A, roughness: 0.45 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xB49B70, metalness: 0.75, roughness: 0.3 });
    const seam = new THREE.MeshStandardMaterial({ color: 0x6A5945, roughness: 0.9 });
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z); mesh.castShadow = true; chair.add(mesh); return mesh;
    };
    box(1.45, 0.12, 0.74, 0, 0.4575, 0, leather);
    box(1.47, 0.045, 0.72, 0, 0.375, -0.01, walnut);
    box(1.44, 1.12, 0.09, 0, 0.99, -0.37, walnut);
    box(1.34, 1.03, 0.10, 0, 0.99, -0.305, leather);
    box(0.70, 0.16, 0.12, 0, 1.42, -0.24, leather);
    for (const y of [0.72, 0.94, 1.16]) box(1.22, 0.007, 0.006, 0, y, -0.25, seam);
    for (const x of [-0.77, 0.77]) {
      box(0.08, 0.27, 0.07, x, 0.57, 0.13, brass);
      box(0.13, 0.075, 0.65, x, 0.72, 0, leather);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.32, 12), brass);
    stem.position.y = 0.21; chair.add(stem);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const spoke = box(0.055, 0.04, 0.46, Math.sin(angle) * 0.2, 0.06, Math.cos(angle) * 0.2, brass);
      spoke.rotation.y = angle;
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.055, 10), leather);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(angle) * 0.40, 0.042, Math.cos(angle) * 0.40);
      chair.add(wheel);
    }
    return chair;
  }

  /**
   * Builds the Huimei Office Visitor Chair 2125C
   * Features:
   * - Matte black breathable mesh backrest with ergonomic lumbar support frame
   * - High-density black molded foam fabric seat cushion with waterfall front edge
   * - Cantilever sled base with tubular steel floor skids, front loop, and angled risers
   * - Integrated molded nylon loop armrests connecting seat to backrest
   */
  public static createHuimeiSledChair(options?: { isExecutive?: boolean }): THREE.Group {
    const chair = new THREE.Group();
    const isExec = Boolean(options?.isExecutive);

    const w = isExec ? 0.60 : 0.52;
    const d = 0.50;

    // Materials matching the authentic Huimei 2125C
    const meshBackMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.9,
      metalness: 0.1
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0B0D13,
      roughness: 0.35,
      metalness: 0.15
    });
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x111319,
      roughness: 0.85,
      metalness: 0.05
    });
    const steelTubeMat = new THREE.MeshStandardMaterial({
      color: 0x1A1E26,
      roughness: 0.30,
      metalness: 0.85
    });

    // ================= 1. SEAT CUSHION =================
    // Thick molded foam cushion with waterfall front edge
    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.075, d - 0.04),
      cushionMat
    );
    seatCushion.position.set(0, 0.48, 0);
    seatCushion.castShadow = true;
    chair.add(seatCushion);

    // Ergonomic waterfall front edge
    const waterfall = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.04, 0.06),
      cushionMat
    );
    waterfall.position.set(0, 0.455, d / 2 - 0.03);
    waterfall.rotation.x = 0.25;
    chair.add(waterfall);

    // Sub-seat steel mounting frame
    const subFrame = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.84, 0.02, d * 0.75),
      steelTubeMat
    );
    subFrame.position.set(0, 0.435, -0.02);
    chair.add(subFrame);

    // ================= 2. ERGONOMIC MESH BACKREST =================
    // Breathable mesh center panel
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.84, 0.54, 0.02),
      meshBackMat
    );
    backPanel.position.set(0, 0.77, -0.23);
    backPanel.rotation.x = -0.08;
    chair.add(backPanel);

    // Contoured structural perimeter frame
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.90, 0.05, 0.04),
      frameMat
    );
    topRail.position.set(0, 1.03, -0.25);
    chair.add(topRail);

    const bottomRail = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.86, 0.04, 0.04),
      frameMat
    );
    bottomRail.position.set(0, 0.51, -0.21);
    chair.add(bottomRail);

    // Left and right curved back uprights
    [-w * 0.43, w * 0.43].forEach(px => {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.53, 0.04),
        frameMat
      );
      stile.position.set(px, 0.77, -0.23);
      stile.rotation.x = -0.08;
      chair.add(stile);
    });

    // Horizontal lumbar support bar across lower back
    const lumbarBar = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.82, 0.06, 0.035),
      frameMat
    );
    lumbarBar.position.set(0, 0.63, -0.22);
    chair.add(lumbarBar);

    // ================= 3. CANTILEVER SLED BASE =================
    const tubeRadius = 0.016;

    // Floor skids (left and right horizontal tubes resting on floor)
    [-w * 0.42, w * 0.42].forEach(sx => {
      const skid = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, d * 0.95, 12),
        steelTubeMat
      );
      skid.rotation.x = Math.PI / 2;
      skid.position.set(sx, tubeRadius, 0);
      skid.castShadow = true;
      chair.add(skid);

      // Angled riser tube connecting floor skid up to seat bottom
      const riser = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.46, 12),
        steelTubeMat
      );
      riser.position.set(sx, 0.23, d / 2 - 0.08);
      riser.rotation.x = -0.18;
      riser.castShadow = true;
      chair.add(riser);

      // Horizontal support tube under seat cushion
      const underSeatTube = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, d * 0.72, 12),
        steelTubeMat
      );
      underSeatTube.rotation.x = Math.PI / 2;
      underSeatTube.position.set(sx, 0.43, -0.04);
      chair.add(underSeatTube);
    });

    // Front horizontal floor loop connecting left and right skids
    const frontLoop = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeRadius, tubeRadius, w * 0.84, 12),
      steelTubeMat
    );
    frontLoop.rotation.z = Math.PI / 2;
    frontLoop.position.set(0, tubeRadius, d * 0.45);
    chair.add(frontLoop);

    // Rear horizontal floor loop
    const rearLoop = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeRadius, tubeRadius, w * 0.84, 12),
      steelTubeMat
    );
    rearLoop.rotation.z = Math.PI / 2;
    rearLoop.position.set(0, tubeRadius, -d * 0.45);
    chair.add(rearLoop);

    // ================= 4. MOLDED NYLON LOOP ARMRESTS =================
    // Ergonomic loop armrests connecting seat to backrest
    [-w * 0.48, w * 0.48].forEach(ax => {
      // Horizontal armrest pad
      const armPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.03, 0.26),
        frameMat
      );
      armPad.position.set(ax, 0.67, -0.04);
      chair.add(armPad);

      // Front vertical upright from seat
      const frontUpright = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.23, 0.04),
        frameMat
      );
      frontUpright.position.set(ax, 0.54, 0.08);
      frontUpright.rotation.x = 0.12;
      chair.add(frontUpright);

      // Rear support angled into backrest
      const rearSupport = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.21, 0.04),
        frameMat
      );
      rearSupport.position.set(ax, 0.62, -0.16);
      rearSupport.rotation.x = -0.22;
      chair.add(rearSupport);
    });

    return chair;
  }
}
