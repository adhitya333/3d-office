import * as THREE from 'three';
import { EMPLOYEES } from '../../data/employees';
import { OFFICE_CONFIG } from '../../config/office.config';
import { DeskFactory, DeskStationController } from './DeskFactory';
import { OfficeTextureGenerator } from './OfficeTextureGenerator';
import { GeometryBatcher } from './GeometryBatcher';
import { ROOM_DESIGNS } from '../../data/roomDesign';

export class OfficeFurniture {
  public group: THREE.Group;
  private textures: { [key: string]: THREE.CanvasTexture } = {};
  private sharedMaterials: { [key: string]: THREE.Material } = {};
  public deskControllers: DeskStationController[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.initSharedMaterials();
    this.initScreenTextures();
    this.buildEmployeeWorkstations();
    this.buildCeoMeetingArea();
    this.buildSpecialDisplays();
    this.buildFiddleLeafTrees();
    this.buildWaterCooler();
    this.buildRoomDetails();
    this.buildExecutiveLounge();
    this.batchStaticFurniture();
  }

  private buildExecutiveLounge() {
    const leather = new THREE.MeshStandardMaterial({ color: ROOM_DESIGNS.ceo.fabric, roughness: 0.92 });
    const cushion = new THREE.MeshStandardMaterial({ color: 0xA3957B, roughness: 0.95 });
    const walnut = this.sharedMaterials['walnutWood'];
    const brass = this.sharedMaterials['goldTrim'];
    const dark = this.sharedMaterials['blackSteel'];
    const box = (root: THREE.Group, size: number[], position: number[], material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size as [number, number, number]), material);
      mesh.position.set(...position as [number, number, number]); mesh.castShadow = true; root.add(mesh); return mesh;
    };
    const sofa = new THREE.Group();
    sofa.name = 'Executive lounge sofa';
    sofa.position.set(12.65, 0, -2.5); sofa.rotation.y = -Math.PI / 2;
    box(sofa, [2.8, 0.14, 0.85], [0, 0.25, 0], walnut);
    for (const x of [-0.64, 0.64]) {
      box(sofa, [1.24, 0.16, 0.78], [x, 0.42, 0], leather);
      box(sofa, [1.24, 0.52, 0.14], [x, 0.71, -0.34], leather);
      const pillow = box(sofa, [0.35, 0.30, 0.12], [x * 1.5, 0.69, -0.18], cushion);
      pillow.rotation.z = x < 0 ? 0.1 : -0.1;
    }
    for (const x of [-1.42, 1.42]) box(sofa, [0.16, 0.52, 0.87], [x, 0.49, 0], leather);
    for (const x of [-1.20, 1.20]) for (const z of [-0.28, 0.28]) box(sofa, [0.055, 0.20, 0.055], [x, 0.10, z], brass);
    this.group.add(sofa);
    const table = new THREE.Group(); table.position.set(11.45, 0, -2.5);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 24), this.sharedMaterials['marbleBacking']);
    top.position.y = 0.53; table.add(top);
    box(table, [0.06, 0.48, 0.06], [0, 0.26, 0], brass);
    box(table, [0.38, 0.035, 0.38], [0, 0.02, 0], dark);
    this.group.add(table);
    // Wall-mounted split AC: static louvers and a small status light, no animated particles.
    const ac = new THREE.Group(); ac.name = 'Executive suite AC';
    ac.position.set(14.05, 2.75, -8.9); ac.rotation.y = -Math.PI / 2;
    const ivory = new THREE.MeshStandardMaterial({ color: 0xE7E4DE, roughness: 0.42 });
    box(ac, [1.65, 0.43, 0.25], [0, 0, 0], ivory);
    box(ac, [1.45, 0.11, 0.015], [0, -0.11, 0.13], dark);
    for (let i = 0; i < 4; i++) box(ac, [1.42, 0.012, 0.025], [0, -0.15 + i * 0.025, 0.15], ivory);
    box(ac, [0.04, 0.018, 0.006], [0.61, 0.01, 0.13], new THREE.MeshBasicMaterial({ color: 0x8FBCA8 }));
    this.group.add(ac);
    // Walnut wall panels frame the lounge and keep the existing roadmap display clear.
    const panels = new THREE.Group();
    for (let i = 0; i < 16; i++) box(panels, [0.075, 2.75, 0.045], [11.15 + i * 0.18, 1.45, -10.30], walnut);
    box(panels, [2.9, 0.018, 0.05], [12.5, 2.85, -10.25], brass);
    this.group.add(panels);
  }

  private batchStaticFurniture() {
    // Workstations stay in place; their screen textures update independently.
    GeometryBatcher.batchStaticGroup(this.group, mesh => mesh.userData?.isDynamic === true);
  }

  public update(time: number) {
    this.deskControllers.forEach(d => d.update(time));
  }

  private initSharedMaterials() {
    const marbleTex = OfficeTextureGenerator.getWhiteMarbleTexture();
    const woodSlatTex = OfficeTextureGenerator.getAcousticSlatTexture();

    this.sharedMaterials['blackSteel'] = new THREE.MeshStandardMaterial({
      color: 0x18181B,
      roughness: 0.35,
      metalness: 0.85
    });

    this.sharedMaterials['chrome'] = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.1,
      metalness: 0.95
    });

    this.sharedMaterials['deskWood'] = new THREE.MeshStandardMaterial({
      color: 0xB58E62,
      roughness: 0.3,
      metalness: 0.05
    });

    this.sharedMaterials['walnutWood'] = new THREE.MeshStandardMaterial({
      color: 0x3E2723,
      roughness: 0.25,
      metalness: 0.08
    });

    this.sharedMaterials['goldTrim'] = new THREE.MeshStandardMaterial({
      color: 0xAF9569,
      roughness: 0.35,
      metalness: 0.7
    });

    this.sharedMaterials['blackStorage'] = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.2
    });

    this.sharedMaterials['ribbedLeather'] = new THREE.MeshStandardMaterial({
      color: 0x1E1E24,
      roughness: 0.45,
      metalness: 0.15
    });

    this.sharedMaterials['marbleBacking'] = new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.18,
      metalness: 0.15
    });

    this.sharedMaterials['woodSlat'] = new THREE.MeshStandardMaterial({
      map: woodSlatTex,
      roughness: 0.4,
      metalness: 0.1
    });

    this.sharedMaterials['lightDiffuser'] = new THREE.MeshBasicMaterial({
      color: 0xFFFDF0
    });
  }

  private initScreenTextures() {
    const createScreenTexture = (title: string, subtitle: string, accentColor: string, type: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 288;
      const ctx = canvas.getContext('2d')!;

      // Crisp dark code editor / dashboard background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 512, 288);

      // Header bar with window controls
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, 512, 24);

      ['#EF4444', '#F59E0B', '#10B981'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(13 + i * 13, 12, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(title, 60, 16);

      if (type === 'code') {
        const lines = [
          'import { autonomousEngine } from "@verlyn/core";',
          '',
          'export async function deployProductionPipeline() {',
          '  const clientWorkspace = await verifyTenantAuth();',
          '  const agents = registerDepartmentFleet(["web", "growth", "crm"]);',
          '  console.log(`[VERLYN HQ] Active pipeline: ${agents.length} nodes connected`);',
          '  return await autonomousEngine.executeCycle({ retryOnError: true });',
          '}'
        ];
        ctx.fillStyle = '#38BDF8';
        ctx.font = '10px monospace';
        lines.forEach((l, i) => {
          ctx.fillText(l, 18, 50 + i * 20);
        });
      } else {
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(subtitle, 18, 55);

        // Chart / metric bars
        const bars = [0.4, 0.75, 0.6, 0.9, 0.85, 0.65, 0.95];
        bars.forEach((b, i) => {
          ctx.fillStyle = accentColor;
          ctx.fillRect(40 + i * 55, 240 - b * 130, 32, b * 130);
          ctx.fillStyle = '#64748B';
          ctx.font = '9px monospace';
          ctx.fillText(`M${i + 1}`, 48 + i * 55, 260);
        });
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    };

    this.textures['code-cyan'] = createScreenTexture('Adhi — Web Architecture Engine', 'Next.js App Engine', '#06B6D4', 'code');
    this.textures['design-teal'] = createScreenTexture('Abbu — Conversion Design', 'Figma CRO Mockup', '#0D9488', 'chart');
    this.textures['chart-indigo'] = createScreenTexture('Prox — GEO & SEO Engine', 'Perplexity Citations', '#6366F1', 'chart');
    this.textures['ai-nodes'] = createScreenTexture('Vaibav — Autonomous AI Agents', 'Agentic Mesh Pipeline', '#8B5CF6', 'code');
    this.textures['crm-blue'] = createScreenTexture('Taha — Enterprise Systems', 'ERP Data Synchronizer', '#3B82F6', 'chart');
    this.textures['growth-emerald'] = createScreenTexture('Rewaant — Growth Outbound', 'Outbound Pipeline', '#10B981', 'chart');
    this.textures['ceo-gold'] = createScreenTexture('Ameen — Executive Command', 'Master Project Roadmap', '#F59E0B', 'chart');
  }

  /**
   * Clean, modern executive workstations without any awkward freestanding room divider walls.
   * Features: Executive timber table, laptop, desk pad, nameplate, executive chair behind desk,
   * and visitor chair facing the employee across the desk table.
   */
  private buildEmployeeWorkstations() {
    OFFICE_CONFIG.employees.forEach(emp => {
      const controller = DeskFactory.createWorkstation(emp);
      this.deskControllers.push(controller);
      this.group.add(controller.group);
    });
  }

  private getScreenTextureForEmployee(id: string): THREE.CanvasTexture {
    switch (id) {
      case 'adhi': return this.textures['code-cyan'];
      case 'abbu': return this.textures['design-teal'];
      case 'prox': return this.textures['chart-indigo'];
      case 'vaibav': return this.textures['ai-nodes'];
      case 'taha': return this.textures['crm-blue'];
      case 'rewaant': return this.textures['growth-emerald'];
      case 'ameen': return this.textures['ceo-gold'];
      default: return this.textures['code-cyan'];
    }
  }

  private createDeskNameplate(name: string, title: string, accentColor: string): THREE.Group {
    const group = new THREE.Group();

    const plateGeo = new THREE.BoxGeometry(0.5, 0.15, 0.06);
    const plate = new THREE.Mesh(plateGeo, this.sharedMaterials['blackSteel']);
    plate.rotation.x = 0.25;
    group.add(plate);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 512, 150);

    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, 16, 150);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(name.toUpperCase(), 36, 68);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(title, 36, 118);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.135),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    label.position.set(0, 0.01, -0.033);
    label.rotation.x = 0.25;
    group.add(label);

    return group;
  }

  private buildCeoMeetingArea() {
    // Executive meeting table in CEO Office at [8.5, 0, -2.5]
    const meetingGroup = new THREE.Group();
    meetingGroup.position.set(8.5, 0, -2.5);

    const batcher = new GeometryBatcher();

    // Oval meeting table in rich walnut timber
    const tableTopGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.08, 32);
    // Fit the tabletop between the existing conference seats without moving any chair.
    tableTopGeo.scale(1.0, 1, 0.43);
    const topMatrix = new THREE.Matrix4().makeTranslation(0, 0.76, 0);
    batcher.addGeometry(tableTopGeo, this.sharedMaterials['deskWood'], topMatrix);
    tableTopGeo.dispose();

    // Chrome pedestal base
    batcher.addCylinder(0.6, 0.7, 0.06, 24, [0, 0.03, 0], this.sharedMaterials['chrome']);
    batcher.addCylinder(0.12, 0.12, 0.7, 16, [0, 0.38, 0], this.sharedMaterials['chrome']);

    // 4 Eames-style ribbed leather conference chairs
    const chairPositions = [
      { x: -1.8, z: 0, rotY: Math.PI / 2 },
      { x: 1.8, z: 0, rotY: -Math.PI / 2 },
      { x: 0, z: -0.9, rotY: 0 },
      { x: 0, z: 0.9, rotY: Math.PI }
    ];

    chairPositions.forEach(pos => {
      const chairMatrix = new THREE.Matrix4()
        .makeTranslation(pos.x, 0, pos.z)
        .multiply(new THREE.Matrix4().makeRotationY(pos.rotY));

      const seatGeo = new THREE.BoxGeometry(0.5, 0.06, 0.5);
      const seatMatrix = chairMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
      batcher.addGeometry(seatGeo, this.sharedMaterials['ribbedLeather'], seatMatrix);
      seatGeo.dispose();

      const backGeo = new THREE.BoxGeometry(0.48, 0.55, 0.05);
      const backMatrix = chairMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.8, -0.22));
      batcher.addGeometry(backGeo, this.sharedMaterials['ribbedLeather'], backMatrix);
      backGeo.dispose();

      const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.47, 8);
      const legMatrix = chairMatrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.25, 0));
      batcher.addGeometry(legGeo, this.sharedMaterials['chrome'], legMatrix);
      legGeo.dispose();
    });

    batcher.buildMeshes(meetingGroup, { castShadow: true, receiveShadow: true });
    this.group.add(meetingGroup);
  }

  private buildSpecialDisplays() {
    // 1. AI Workflow Rack (West wall of AI Lab at [-14.0, 0, 3.5])
    const aiRack = this.createDisplayStand(
      'AI AGENTIC PIPELINES',
      'Autonomous Workflow Mesh',
      0x8B5CF6,
      'ai_flow'
    );
    aiRack.position.set(-14.0, 0, 3.5);
    aiRack.rotation.y = Math.PI / 2;
    this.group.add(aiRack);

    // 2. Business Systems Display (West wall of AI Lab at [-14.0, 0, 7.5])
    const bizDisplay = this.createDisplayStand(
      'ENTERPRISE ERP & CRM',
      'Integration Health Matrix',
      0x3B82F6,
      'biz_flow'
    );
    bizDisplay.position.set(-14.0, 0, 7.5);
    bizDisplay.rotation.y = Math.PI / 2;
    this.group.add(bizDisplay);

    // 3. Campaign & Pipeline Board (East wall of Growth Studio at [14.0, 0, 5.5])
    const growthBoard = this.createDisplayStand(
      'BRAND & CREATIVE DIRECTION',
      'Identity & Visual System',
      0x10B981,
      'growth_flow'
    );
    growthBoard.position.set(14.0, 0, 5.5);
    growthBoard.rotation.y = -Math.PI / 2;
    this.group.add(growthBoard);

    // 4. CEO Strategic Roadmap Board (East wall of CEO Office at [14.0, 0, -6.5])
    const ceoBoard = this.createDisplayStand(
      'VERLYN STRATEGIC ROADMAP',
      'Executive Milestone Tracker',
      0xF59E0B,
      'ceo_flow'
    );
    ceoBoard.position.set(14.0, 0, -6.5);
    ceoBoard.rotation.y = -Math.PI / 2;
    this.group.add(ceoBoard);
  }

  private createDisplayStand(title: string, subtitle: string, accentColor: number, variant: string): THREE.Group {
    const group = new THREE.Group();

    // Sleek wall display mount frame
    const frameGeo = new THREE.BoxGeometry(2.5, 1.5, 0.08);
    const frame = new THREE.Mesh(frameGeo, this.sharedMaterials['blackSteel']);
    frame.position.set(0, 1.8, 0);
    group.add(frame);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#090D1A';
    ctx.fillRect(0, 0, 1024, 600);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#F3F0E9';
    ctx.font = '600 48px Inter, Arial, sans-serif';
    ctx.fillText(title.replace('AI AGENTIC PIPELINES', 'AI WORKFLOWS').replace('BRAND & CREATIVE DIRECTION', 'GROWTH PIPELINE'), 512, 265, 900);
    ctx.fillStyle = '#AAA9A5';
    ctx.font = '400 32px Inter, Arial, sans-serif';
    ctx.fillText(subtitle, 512, 345, 900);
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.anisotropy = 8;

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.32, 1.32), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.set(0, 1.8, 0.047);
    group.add(screen);

    return group;
  }

  private buildFiddleLeafTrees() {
    const treeLocations = [
      [-13.2, 0, -9.5], // Web Studio corner
      [-13.2, 0, 9.5],  // AI Lab corner
      [13.2, 0, 9.5],   // Growth Studio corner
      [13.2, 0, -9.5]   // CEO Office corner
    ];

    const batcher = new GeometryBatcher();
    const potMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.3 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.8 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x226633, roughness: 0.45 });

    treeLocations.forEach(pos => {
      batcher.addCylinder(0.32, 0.28, 0.75, 16, [pos[0], 0.375, pos[2]], potMat);
      batcher.addCylinder(0.3, 0.3, 0.05, 12, [pos[0], 0.74, pos[2]], soilMat);
      batcher.addCylinder(0.04, 0.05, 1.8, 8, [pos[0], 1.6, pos[2]], trunkMat);

      const leafHeights = [1.2, 1.5, 1.8, 2.1, 2.4, 2.6];
      leafHeights.forEach((ly, i) => {
        const leafAngle = i * 1.35;
        const leafGeo = new THREE.CylinderGeometry(0.24, 0.1, 0.02, 8);
        leafGeo.scale(1.2, 1, 1.6);
        const leafMatrix = new THREE.Matrix4()
          .makeTranslation(pos[0] + Math.cos(leafAngle) * 0.25, ly, pos[2] + Math.sin(leafAngle) * 0.25)
          .multiply(new THREE.Matrix4().makeRotationY(leafAngle));
        batcher.addGeometry(leafGeo, leafMat, leafMatrix);
        leafGeo.dispose();
      });
    });

    batcher.buildMeshes(this.group, { castShadow: true, receiveShadow: true });
  }

  private buildWaterCooler() {
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(-2.0, 0, 0); // Corridor recess near center

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.88, 0.42), this.sharedMaterials['blackSteel']);
    base.position.set(0, 0.44, 0);
    coolerGroup.add(base);

    // Dispensing niche
    const niche = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.26, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.3 })
    );
    niche.position.set(0.12, 0.65, 0);
    coolerGroup.add(niche);

    // Cold & Hot Taps
    const blueTap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x06B6D4 })
    );
    blueTap.position.set(0.14, 0.74, -0.04);
    coolerGroup.add(blueTap);

    const redTap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0xEF4444 })
    );
    redTap.position.set(0.14, 0.74, 0.04);
    coolerGroup.add(redTap);

    // Pure Mountain Spring Water Bottle with realistic meniscus
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.46, 20),
      new THREE.MeshStandardMaterial({
        color: 0x38BDF8,
        transparent: true,
        opacity: 0.55,
        roughness: 0.1,
        metalness: 0.1
      })
    );
    bottle.position.set(0, 1.12, 0);
    coolerGroup.add(bottle);

    // Glowing cyan floor indicator ring
    const ringGeo = new THREE.RingGeometry(0.48, 0.60, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    coolerGroup.add(ring);

    this.group.add(coolerGroup);
  }

  private buildRoomDetails() {
    // ================= ROOM 1: WEB & SEARCH STUDIO DETAILS =================
    // Coffee Bar & Refreshment Credenza in Web Studio at [-13.5, 0, -2.5]
    const coffeeCredenza = new THREE.Group();
    coffeeCredenza.position.set(-13.5, 0, -2.5);

    const credenzaGeo = new THREE.BoxGeometry(0.8, 0.85, 1.8);
    const credenza = new THREE.Mesh(credenzaGeo, this.sharedMaterials['blackStorage']);
    credenza.position.set(0, 0.425, 0);
    coffeeCredenza.add(credenza);

    // Marble top
    const credTop = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 1.84), this.sharedMaterials['marbleBacking']);
    credTop.position.set(0, 0.875, 0);
    coffeeCredenza.add(credTop);

    // Espresso Machine
    const espressoMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.1, metalness: 0.95 });
    const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, 0.45), espressoMat);
    espresso.position.set(0, 1.09, 0.3);
    coffeeCredenza.add(espresso);

    // Ceramic cups
    [0.1, -0.1, -0.3].forEach(offsetZ => {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0x06B6D4, roughness: 0.2 })
      );
      cup.position.set(0.1, 0.94, offsetZ);
      coffeeCredenza.add(cup);
    });

    this.group.add(coffeeCredenza);

    // Material library: low cabinetry and physical colour samples replace the glass board.
    const materialLibrary = new THREE.Group();
    materialLibrary.position.set(-13.6, 0, -5.2);
    const libraryBase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.78, 1.8), this.sharedMaterials['walnutWood']);
    libraryBase.position.y = 0.39;
    materialLibrary.add(libraryBase);
    [0xD8D1BE, 0x78847A, 0xB18F70, 0x38434A].forEach((color, index) => {
      const sample = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.035, 0.28), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
      sample.position.set(0, 0.82 + index * 0.018, -0.56 + index * 0.36);
      materialLibrary.add(sample);
    });
    this.group.add(materialLibrary);

    // ================= ROOM 2: AI & SYSTEMS LAB DETAILS =================
    // High-Density Enterprise Server Rack at [-13.5, 0, 9.2]
    const serverRack = new THREE.Group();
    serverRack.position.set(-13.5, 0, 9.2);

    const serverBatcher = new GeometryBatcher();
    serverBatcher.addBox([0.8, 2.6, 1.2], [0, 1.3, 0], this.sharedMaterials['blackSteel']);
    const unitMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.8 });
    const greenLedMat = new THREE.MeshBasicMaterial({ color: 0x10B981 });
    const purpleLedMat = new THREE.MeshBasicMaterial({ color: 0x8B5CF6 });

    for (let u = 0; u < 8; u++) {
      serverBatcher.addBox([0.76, 0.22, 1.14], [0, 0.3 + u * 0.28, 0], unitMat);
      [-0.4, -0.2, 0, 0.2, 0.4].forEach((ledZ, idx) => {
        const mat = (u + idx) % 2 === 0 ? greenLedMat : purpleLedMat;
        serverBatcher.addBox([0.02, 0.02, 0.02], [0.39, 0.3 + u * 0.28, ledZ], mat);
      });
    }
    serverBatcher.buildMeshes(serverRack, { castShadow: true, receiveShadow: true });
    this.group.add(serverRack);

    // A compact hardware bench keeps the systems room grounded in physical tools.
    const hardwareBench = new THREE.Group();
    hardwareBench.position.set(-13.6, 0, 1.3);
    const benchBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.76, 1.35), this.sharedMaterials['blackStorage']);
    benchBody.position.y = 0.38;
    hardwareBench.add(benchBody);
    [0, 1, 2].forEach(index => {
      const device = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.08, 0.25), this.sharedMaterials['chrome']);
      device.position.set(0, 0.82 + index * 0.085, 0);
      hardwareBench.add(device);
    });
    this.group.add(hardwareBench);

    // ================= ROOM 3: GROWTH STUDIO DETAILS =================
    // Modern Client Pitch Lounge (2 Armchairs + Round Glass Table) at [5.5, 0, 8.5]
    const lounge = new THREE.Group();
    lounge.position.set(5.5, 0, 8.5);

    // Round Glass Coffee Table
    const tableGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x10B981, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1 })
    );
    tableGlass.position.set(0, 0.45, 0);
    lounge.add(tableGlass);

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.43, 16), this.sharedMaterials['blackSteel']);
    tableBase.position.set(0, 0.22, 0);
    lounge.add(tableBase);

    // 2 Scandinavian Modern Armchairs
    [-1.2, 1.2].forEach(chairX => {
      const armchair = new THREE.Group();
      armchair.position.set(chairX, 0, 0);
      armchair.rotation.y = chairX < 0 ? Math.PI / 2.5 : -Math.PI / 2.5;

      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.12, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x142924, roughness: 0.6 })
      );
      chairSeat.position.set(0, 0.42, 0);
      armchair.add(chairSeat);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.55, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x607F6D, roughness: 0.8 })
      );
      chairBack.position.set(0, 0.72, -0.28);
      armchair.add(chairBack);

      const legMat = this.sharedMaterials['blackSteel'];
      [-0.26, 0.26].forEach(lx => {
        [-0.26, 0.26].forEach(lz => {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), legMat);
          l.position.set(lx, 0.2, lz);
          armchair.add(l);
        });
      });
      lounge.add(armchair);
    });
    this.group.add(lounge);

    const growthLibrary = new THREE.Group();
    growthLibrary.position.set(13.6, 0, 2.1);
    const bookcase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.1, 1.6), this.sharedMaterials['walnutWood']);
    bookcase.position.y = 0.55;
    growthLibrary.add(bookcase);
    [0xA7B19C, 0xD3C5A8, 0x7C8C93, 0xB38B6B].forEach((color, index) => {
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.4), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
      book.position.set(0, 1.15 + index * 0.055, 0);
      growthLibrary.add(book);
    });
    this.group.add(growthLibrary);

    // ================= ROOM 4: CEO OFFICE DETAILS =================
    // Executive Credenza with Glass Awards behind Ameen's desk at [8.5, 0, -9.8]
    const ceoCredenza = new THREE.Group();
    ceoCredenza.position.set(8.5, 0, -9.8);

    const cBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.85, 0.6), this.sharedMaterials['blackStorage']);
    cBody.position.set(0, 0.425, 0);
    ceoCredenza.add(cBody);

    const cMarble = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.05, 0.65), this.sharedMaterials['marbleBacking']);
    cMarble.position.set(0, 0.875, 0);
    ceoCredenza.add(cMarble);

    [-1.25, 1.25].forEach(x => {
      const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.3, 8), this.sharedMaterials['goldTrim']);
      lampStem.position.set(x, 1.04, 0);
      ceoCredenza.add(lampStem);
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xD9CFB9, roughness: 0.9 }));
      shade.position.set(x, 1.28, 0);
      ceoCredenza.add(shade);
    });

    // Glass Awards & Trophies
    [-0.8, -0.3, 0.3, 0.8].forEach((awardX, idx) => {
      const awardGeo = idx % 2 === 0
        ? new THREE.ConeGeometry(0.08, 0.24, 6)
        : new THREE.BoxGeometry(0.12, 0.22, 0.06);
      const award = new THREE.Mesh(
        awardGeo,
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1 })
      );
      award.position.set(awardX, 1.02, 0);
      ceoCredenza.add(award);
    });

    // Luxury Area Rug under Ameen's desk
    const rugGeo = new THREE.BoxGeometry(5.2, 0.015, 4.4);
    const rug = new THREE.Mesh(
      rugGeo,
      new THREE.MeshStandardMaterial({ color: 0x8C8576, roughness: 0.95 })
    );
    rug.position.set(0, 0.01, 3.3);
    ceoCredenza.add(rug);

    this.group.add(ceoCredenza);
  }
}
