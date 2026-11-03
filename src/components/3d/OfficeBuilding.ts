import * as THREE from 'three';
import { ROOMS } from '../../data/rooms';
import { OfficeTextureGenerator } from './OfficeTextureGenerator';
import { GeometryBatcher } from './GeometryBatcher';

export class OfficeBuilding {
  public group: THREE.Group;
  private materials: { [key: string]: THREE.Material } = {};
  private batcher = new GeometryBatcher();

  constructor() {
    this.group = new THREE.Group();
    this.initMaterials();
    this.buildFloors();
    this.buildWalls();
    this.buildDoorwayArches();
    this.buildWindows();
    this.buildDecorations();
    this.buildExteriorPlazaAndFacade();
    this.buildModernCeilingAndLighting();
    this.buildBrandFeatureWalls();

    // Consolidate static geometry batches into single meshes
    this.batcher.buildMeshes(this.group, { castShadow: true, receiveShadow: true });
  }

  private initMaterials() {
    const woodPlankTex = OfficeTextureGenerator.getWoodPlankTexture();
    const stonePaversTex = OfficeTextureGenerator.getStonePaversTexture();
    const asphaltTex = OfficeTextureGenerator.getAsphaltTexture();
    const mulchTex = OfficeTextureGenerator.getMulchTexture();

    // Distinct Department Room Floor Materials
    this.materials['floor-web'] = new THREE.MeshStandardMaterial({
      map: OfficeTextureGenerator.getScandinavianAshTexture(),
      roughness: 0.35
    });

    this.materials['floor-ai'] = new THREE.MeshStandardMaterial({
      color: 0x39434A,
      roughness: 0.7,
      metalness: 0.08
    });

    this.materials['floor-growth'] = new THREE.MeshStandardMaterial({
      map: OfficeTextureGenerator.getHerringboneParquetTexture(),
      roughness: 0.35
    });

    this.materials['floor-ceo'] = new THREE.MeshStandardMaterial({
      map: OfficeTextureGenerator.getWalnutMarbleTexture(),
      roughness: 0.28,
      metalness: 0.15
    });

    // High quality architectural materials
    this.materials['wall'] = new THREE.MeshStandardMaterial({
      color: 0xE1E0D9,
      roughness: 0.8,
      metalness: 0.05
    });

    this.materials['wallTrim'] = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.35,
      metalness: 0.7
    });

    this.materials['pillar'] = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.3,
      metalness: 0.8
    });

    this.materials['glass'] = new THREE.MeshStandardMaterial({
      color: 0xC4D0CB,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1
    });

    this.materials['floor-wood'] = new THREE.MeshStandardMaterial({
      map: woodPlankTex,
      roughness: 0.35,
      metalness: 0.08
    });

    // Exterior facade materials
    this.materials['facadeWhite'] = new THREE.MeshStandardMaterial({
      color: 0xFAFAFA,
      roughness: 0.25,
      metalness: 0.04
    });

    this.materials['curtainGlass'] = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      roughness: 0.08,
      metalness: 0.35,
      opacity: 0.75,
      transparent: true
    });

    this.materials['doorGlass'] = new THREE.MeshStandardMaterial({
      color: 0xE0F2FE,
      transparent: true,
      opacity: 0.40,
      roughness: 0.05,
      metalness: 0.1
    });

    this.materials['curtainMullion'] = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.2,
      metalness: 0.9
    });

    this.materials['stonePavers'] = new THREE.MeshStandardMaterial({
      map: stonePaversTex,
      roughness: 0.65,
      metalness: 0.05
    });

    this.materials['asphalt'] = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.85,
      metalness: 0.02
    });

    this.materials['mulch'] = new THREE.MeshStandardMaterial({
      map: mulchTex,
      roughness: 0.9,
      metalness: 0.0
    });

    this.materials['concreteCurb'] = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.6,
      metalness: 0.05
    });

    this.materials['grassBlade'] = new THREE.MeshStandardMaterial({
      color: 0x15803D,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    this.materials['grassWheat'] = new THREE.MeshStandardMaterial({
      color: 0xD97706,
      roughness: 0.7
    });

    this.materials['shrubFoliage'] = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.7
    });

    this.materials['carBody'] = new THREE.MeshStandardMaterial({
      color: 0x09090B,
      roughness: 0.15,
      metalness: 0.95
    });

    this.materials['carGlass'] = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.75
    });

    this.materials['carChrome'] = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.1,
      metalness: 0.95
    });
  }

  private buildFloors() {
    // 1. Base foundation floor (spanning building bounds: X: -15 to 15, Z: -11 to 11)
    const baseGeo = new THREE.BoxGeometry(31, 0.4, 23);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.9 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -0.21, 0);
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // 2. Central Atrium Corridor Floor: Natural Oak Hardwood Planks
    const corridorGeo = new THREE.BoxGeometry(4.8, 0.1, 21.0);
    const corridorMesh = new THREE.Mesh(corridorGeo, this.materials['floor-wood']);
    corridorMesh.position.set(0, -0.05, 0);
    corridorMesh.receiveShadow = true;
    this.group.add(corridorMesh);

    // 3. Room 1: Web & Search Studio Floor (Scandinavian Light Ash wood)
    const webFloorGeo = new THREE.BoxGeometry(12.0, 0.1, 10.25);
    const webFloorMesh = new THREE.Mesh(webFloorGeo, this.materials['floor-web']);
    webFloorMesh.position.set(-8.4, -0.05, -5.275);
    webFloorMesh.receiveShadow = true;
    this.group.add(webFloorMesh);

    // 4. Room 2: AI & Business Systems Lab Floor (Cyber-Tech Hex Matrix Grid)
    const aiFloorGeo = new THREE.BoxGeometry(12.0, 0.1, 10.25);
    const aiFloorMesh = new THREE.Mesh(aiFloorGeo, this.materials['floor-ai']);
    aiFloorMesh.position.set(-8.4, -0.05, 5.275);
    aiFloorMesh.receiveShadow = true;
    this.group.add(aiFloorMesh);

    // 5. Room 3: Growth Studio Floor (Italian Herringbone Parquet)
    const growthFloorGeo = new THREE.BoxGeometry(12.0, 0.1, 10.25);
    const growthFloorMesh = new THREE.Mesh(growthFloorGeo, this.materials['floor-growth']);
    growthFloorMesh.position.set(8.4, -0.05, 5.275);
    growthFloorMesh.receiveShadow = true;
    this.group.add(growthFloorMesh);

    // 6. Room 4: CEO Office & Boardroom Floor (Espresso Walnut & Calacatta Gold)
    const ceoFloorGeo = new THREE.BoxGeometry(12.0, 0.1, 10.25);
    const ceoFloorMesh = new THREE.Mesh(ceoFloorGeo, this.materials['floor-ceo']);
    ceoFloorMesh.position.set(8.4, -0.05, -5.275);
    ceoFloorMesh.receiveShadow = true;
    this.group.add(ceoFloorMesh);

    // 7. Department perimeter glowing border frames
    ROOMS.forEach(room => {
      if (room.id === 'corridor') return;

      const width = room.bounds.maxX - room.bounds.minX;
      const depth = room.bounds.maxZ - room.bounds.minZ;
      const centerX = (room.bounds.minX + room.bounds.maxX) / 2;
      const centerZ = (room.bounds.minZ + room.bounds.maxZ) / 2;

      const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(width - 0.2, 0.08, depth - 0.2));
      const borderMat = new THREE.LineBasicMaterial({
        color: 0x8A8F87,
        transparent: true,
        opacity: 0.25
      });
      const borderLines = new THREE.LineSegments(borderGeo, borderMat);
      borderLines.position.set(centerX, 0.04, centerZ);
      this.group.add(borderLines);
    });
  }

  /**
   * Builds full-height walls (3.2m) covering the outer perimeter, horizontal room dividers,
   * and corridor partitions, making each room look like a true separate private studio!
   */
  private buildWalls() {
    const wallHeight = 3.2; // Full room height: each studio is an enclosed separate room!

    const addWall = (minX: number, maxX: number, minZ: number, maxZ: number, height = wallHeight) => {
      const width = Math.max(0.1, maxX - minX);
      const depth = Math.max(0.1, maxZ - minZ);
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;

      this.batcher.addBox([width, height, depth], [centerX, height / 2, centerZ], this.materials['wall']);
      this.batcher.addBox([width + 0.04, 0.12, depth + 0.04], [centerX, 0.06, centerZ], this.materials['wallTrim']);
      this.batcher.addBox([width + 0.04, 0.08, depth + 0.04], [centerX, height - 0.04, centerZ], this.materials['wallTrim']);
    };

    // ================= 1. OUTER PERIMETER WALLS (Covering the outer sides of all rooms) =================
    // North outer walls (flanking the Canteen entrance doorway at X: -1.8 to 1.8)
    addWall(-14.5, -1.8, -10.65, -10.35);
    addWall(1.8, 14.5, -10.65, -10.35);

    // ================= CANTEEN & LOUNGE PERIMETER WALLS =================
    // West wall (X = -4.5, Z from -20.5 to -10.5)
    addWall(-4.65, -4.35, -20.5, -10.5);
    // East wall (X = 4.5, Z from -20.5 to -10.5)
    addWall(4.35, 4.65, -20.5, -10.5);
    // North wall with panoramic skyline window sill & header
    addWall(-4.5, 4.5, -20.65, -20.35, 0.9); // Low window sill
    addWall(-4.5, 4.5, -20.65, -20.35, 0.4); // Top transom header
    // South connecting segments flanking the Canteen entrance doorway
    addWall(-4.5, -1.8, -10.65, -10.35);
    addWall(1.8, 4.5, -10.65, -10.35);

    // West outer wall (X = -14.5, Z from -10.5 to 10.5)
    addWall(-14.65, -14.35, -10.5, 10.5);
    // East outer wall (X = 14.5, Z from -10.5 to 10.5)
    addWall(14.35, 14.65, -10.5, 10.5);

    // South outer walls (flanking the open front entrance at X: -1.8 to 1.8)
    // Left Wing South wall (enclosing AI Lab)
    addWall(-14.5, -1.8, 10.35, 10.65);
    // Right Wing South wall (enclosing Growth Studio)
    addWall(1.8, 14.5, 10.35, 10.65);

    // ================= 2. ROOM DIVIDING WALLS (Separating studios horizontally at Z = 0) =================
    // Dividing Web Studio (Room 1) and AI Lab (Room 2) on the West side
    addWall(-14.5, -2.4, -0.15, 0.15);
    // Dividing CEO Office (Room 4) and Growth Studio (Room 3) on the East side
    addWall(2.4, 14.5, -0.15, 0.15);

    // ================= 3. CORRIDOR DIVIDING WALLS (With generous doorways to each studio) =================
    // West corridor wall (at X = -2.4)
    // Doorway 1 to Web Studio is at Z: -6.6 to -3.8 (centered at Z = -5.2, width 2.8m)
    // Doorway 2 to AI Lab is at Z: 3.8 to 6.6 (centered at Z = 5.2, width 2.8m)
    addWall(-2.55, -2.25, -10.5, -6.6); // North segment
    addWall(-2.55, -2.25, -3.8, 3.8);   // Center segment (sealing between Web & AI)
    addWall(-2.55, -2.25, 6.6, 10.5);   // South segment

    // East corridor wall (at X = 2.4)
    // Doorway 4 to CEO Office is at Z: -6.6 to -3.8 (centered at Z = -5.2, width 2.8m)
    // Doorway 3 to Growth Studio is at Z: 3.8 to 6.6 (centered at Z = 5.2, width 2.8m)
    addWall(2.25, 2.55, -10.5, -6.6); // North segment
    addWall(2.25, 2.55, -3.8, 3.8);   // Center segment (sealing between CEO & Growth)
    addWall(2.25, 2.55, 6.6, 10.5);   // South segment
  }

  /**
   * Builds high-end architectural studio entrances with dark steel frames,
   * open commercial glass double doors, and illuminated neon department badges.
   */
  private buildDoorwayArches() {
    const doorways = [
      {
        name: 'WEB & SEARCH STUDIO',
        code: 'WSS-01',
        x: -2.4,
        z: -5.2,
        rotY: Math.PI / 2,
        color: 0x06B6D4,
        width: 2.8
      },
      {
        name: 'AI & BUSINESS SYSTEMS LAB',
        code: 'ABL-02',
        x: -2.4,
        z: 5.2,
        rotY: Math.PI / 2,
        color: 0x8B5CF6,
        width: 2.8
      },
      {
        name: 'CEO SUITE & BOARDROOM',
        code: 'CEO-04',
        x: 2.4,
        z: -5.2,
        rotY: -Math.PI / 2,
        color: 0xF59E0B,
        width: 2.8
      },
      {
        name: 'BRAND & DESIGN',
        code: 'GWS-03',
        x: 2.4,
        z: 5.2,
        rotY: -Math.PI / 2,
        color: 0x10B981,
        width: 2.8
      },
      {
        name: 'CANTEEN & LOUNGE',
        code: 'CTL-05',
        x: 0,
        z: -10.5,
        rotY: 0,
        color: 0x06B6D4,
        width: 3.2
      }
    ];

    doorways.forEach(d => {
      const portal = new THREE.Group();
      portal.position.set(d.x, 0, d.z);
      portal.rotation.y = d.rotY;

      // Vertical door posts (black anodized steel, height 3.2m)
      const postGeo = new THREE.BoxGeometry(0.2, 3.2, 0.24);
      const postMat = this.materials['pillar'];

      const postL = new THREE.Mesh(postGeo, postMat);
      postL.position.set(-d.width / 2, 1.6, 0);
      postL.castShadow = true;
      portal.add(postL);

      const postR = new THREE.Mesh(postGeo, postMat);
      postR.position.set(d.width / 2, 1.6, 0);
      postR.castShadow = true;
      portal.add(postR);

      // Top lintel beam at height 2.85m
      const lintelGeo = new THREE.BoxGeometry(d.width + 0.2, 0.2, 0.26);
      const lintel = new THREE.Mesh(lintelGeo, postMat);
      lintel.position.set(0, 2.85, 0);
      portal.add(lintel);

      // Stainless steel floor transition strip
      const threshold = new THREE.Mesh(
        new THREE.BoxGeometry(d.width, 0.02, 0.28),
        this.materials['curtainMullion']
      );
      threshold.position.set(0, 0.01, 0);
      portal.add(threshold);

      // High-Definition Illuminated Studio Entrance Sign (above door lintel at Y = 3.05m)
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#090D1A';
      ctx.fillRect(0, 0, 1024, 256);

      ctx.strokeStyle = `#${d.color.toString(16).padStart(6, '0')}`;
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 1004, 236);

      ctx.fillStyle = `#${d.color.toString(16).padStart(6, '0')}`;
      ctx.font = 'bold 50px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[ ${d.code} ]`, 512, 85);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(d.name, 512, 185);

      const signTex = new THREE.CanvasTexture(canvas);
      signTex.generateMipmaps = true;
      signTex.anisotropy = 16;

      const signMeshFront = new THREE.Mesh(
        new THREE.PlaneGeometry(d.width - 0.2, 0.45),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
      );
      signMeshFront.position.set(0, 3.1, 0.08);
      portal.add(signMeshFront);

      const signMeshBack = new THREE.Mesh(
        new THREE.PlaneGeometry(d.width - 0.2, 0.45),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
      );
      signMeshBack.position.set(0, 3.1, -0.08);
      signMeshBack.rotation.y = Math.PI;
      portal.add(signMeshBack);

      this.group.add(portal);
    });
  }

  /**
   * Large architectural daylight windows on outer perimeter walls
   */
  private buildWindows() {
    const addWindowSet = (x: number, y: number, z: number, w: number, rotY: number) => {
      this.batcher.addBox([w, 1.6, 0.08], [x, y, z], this.materials['glass'], [0, rotY, 0]);
      this.batcher.addBox([w + 0.1, 0.08, 0.14], [x, y + 0.8, z], this.materials['wallTrim'], [0, rotY, 0]);
    };

    // North outer wall windows
    addWindowSet(-8.5, 1.6, -10.5, 6.5, 0);
    addWindowSet(8.5, 1.6, -10.5, 6.5, 0);

    // West outer wall windows
    addWindowSet(-14.5, 1.6, -5.2, 6.5, Math.PI / 2);
    addWindowSet(-14.5, 1.6, 5.2, 6.5, Math.PI / 2);

    // East outer wall windows
    addWindowSet(14.5, 1.6, -5.2, 6.5, Math.PI / 2);
    addWindowSet(14.5, 1.6, 5.2, 6.5, Math.PI / 2);
  }

  /**
   * Decorative elements across building
   */
  private buildDecorations() {
    // North corridor end is now open to the Canteen & Executive Lounge doorway!
  }

  /**
   * Exterior facade at Z = 10.5 matching user photo:
   * White architectural panels, reflective blue curtain windows, stone walkway,
   * ornamental feather reed grasses, and double glass entrance doors directly into the corridor.
   */
  private buildExteriorPlazaAndFacade() {
    const facadeGroup = new THREE.Group();
    const facadeZ = 10.5;

    // ================= 1. ASPHALT ROADWAY APRON =================
    this.batcher.addBox([36, 0.08, 16], [0, -0.05, 18.0], this.materials['asphalt']);

    // ================= 2. STONE PAVERS WALKWAY =================
    this.batcher.addBox([4.0, 0.1, 10.8], [0, 0.02, 15.6], this.materials['stonePavers']);
    this.batcher.addBox([0.14, 0.14, 10.8], [-2.05, 0.05, 15.6], this.materials['concreteCurb']);
    this.batcher.addBox([0.14, 0.14, 10.8], [2.05, 0.05, 15.6], this.materials['concreteCurb']);

    // ================= 3. LANDSCAPED FLOWERBEDS =================
    const createGardenBed = (centerX: number, isRight: boolean) => {
      const bedWidth = 4.4;
      const bedDepth = 9.0;
      this.batcher.addBox([bedWidth, 0.14, bedDepth], [centerX, 0.04, 15.6], this.materials['mulch']);

      const curbMat = this.materials['concreteCurb'];
      this.batcher.addBox([bedWidth + 0.28, 0.18, 0.18], [centerX, 0.08, 15.6 + bedDepth / 2], curbMat);
      this.batcher.addBox([0.18, 0.18, bedDepth], [centerX + (isRight ? bedWidth / 2 : -bedWidth / 2), 0.08, 15.6], curbMat);

      // Karl Foerster Ornamental Feather Reed Grasses (batched into unified geometry)
      const grassPositions = [
        { x: -0.8, z: -1.2, h: 1.4, stems: 14 },
        { x: 0.6, z: -1.8, h: 1.6, stems: 16 },
        { x: -0.4, z: 0.8, h: 1.5, stems: 15 },
        { x: 0.7, z: 1.6, h: 1.3, stems: 12 },
        { x: -1.0, z: 2.2, h: 1.2, stems: 10 }
      ];

      grassPositions.forEach(gp => {
        const clumpX = centerX + gp.x;
        const clumpZ = 15.6 + gp.z;

        for (let i = 0; i < gp.stems; i++) {
          const angle = (i / gp.stems) * Math.PI * 2;
          const radius = 0.08 + (i % 3) * 0.04;
          const stemH = gp.h * (0.85 + (i % 4) * 0.1);
          const bx = clumpX + Math.cos(angle) * radius;
          const bz = clumpZ + Math.sin(angle) * radius;

          this.batcher.addCylinder(0.008, 0.014, stemH, 4, [bx, stemH / 2, bz], this.materials['grassBlade']);
          this.batcher.addCylinder(0.02, 0.022, stemH * 0.32, 5, [bx, stemH - (stemH * 0.15), bz], this.materials['grassWheat']);
        }
      });
    };

    createGardenBed(-4.5, false);
    createGardenBed(4.5, true);

    // Reserved parking signpost on right
    const signGroup = new THREE.Group();
    signGroup.position.set(6.8, 0, 19.5);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.35), this.materials['curtainMullion']);
    pole.position.set(0, 0.67, 0);
    signGroup.add(pole);
    const signPlate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.02), this.materials['concreteCurb']);
    signPlate.position.set(0, 1.25, 0);
    signGroup.add(signPlate);
    facadeGroup.add(signGroup);

    // Parked executive car on left bay
    const carGroup = new THREE.Group();
    carGroup.position.set(-10.2, 0, 19.5);
    carGroup.rotation.y = 0.22;
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.2), this.materials['carBody']);
    carBody.position.set(0, 0.52, 0);
    carGroup.add(carBody);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 2.2), this.materials['carGlass']);
    cabin.position.set(0, 1.15, -0.3);
    carGroup.add(cabin);
    facadeGroup.add(carGroup);

    // ================= 4. BUILDING EXTERIOR FACADE (Z = 10.5) =================
    // Left Wing Curtain Wall (X: -14.5 to -2.0)
    const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.7, 0.08), this.materials['curtainGlass']);
    leftGlass.position.set(-8.25, 1.65, facadeZ);
    facadeGroup.add(leftGlass);

    const leftParapet = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.55, 0.4), this.materials['facadeWhite']);
    leftParapet.position.set(-8.25, 3.28, facadeZ);
    facadeGroup.add(leftParapet);

    // Right Wing Curtain Wall (X: 2.0 to 14.5)
    const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.7, 0.08), this.materials['curtainGlass']);
    rightGlass.position.set(8.25, 1.65, facadeZ);
    facadeGroup.add(rightGlass);

    const rightParapet = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.55, 0.4), this.materials['facadeWhite']);
    rightParapet.position.set(8.25, 3.28, facadeZ);
    facadeGroup.add(rightParapet);

    // Center Recessed Glass Entrance (X: -2.0 to 2.0, Z = 10.35)
    const entranceZ = 10.35;
    const centerUpperGlass = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.5, 0.08), this.materials['curtainGlass']);
    centerUpperGlass.position.set(0, 2.85, entranceZ);
    facadeGroup.add(centerUpperGlass);

    const centerParapet = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 0.45), this.materials['facadeWhite']);
    centerParapet.position.set(0, 3.28, entranceZ);
    facadeGroup.add(centerParapet);

    // Modern Cantilevered Entrance Glass Canopy
    const canopyGeo = new THREE.BoxGeometry(4.4, 0.06, 1.4);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.2
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 2.85, entranceZ + 0.7);
    facadeGroup.add(canopy);

    const canopyBeam = new THREE.Mesh(
      new THREE.BoxGeometry(4.44, 0.12, 0.06),
      this.materials['curtainMullion']
    );
    canopyBeam.position.set(0, 2.85, entranceZ + 1.4);
    facadeGroup.add(canopyBeam);

    // Double Commercial Entrance Glass Doors (leading directly into central corridor!)
    const doorFrameLintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 0.15), this.materials['curtainMullion']);
    doorFrameLintel.position.set(0, 2.75, entranceZ);
    facadeGroup.add(doorFrameLintel);

    const doorPostL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.15), this.materials['curtainMullion']);
    doorPostL.position.set(-1.65, 1.4, entranceZ);
    facadeGroup.add(doorPostL);

    const doorPostR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.15), this.materials['curtainMullion']);
    doorPostR.position.set(1.65, 1.4, entranceZ);
    facadeGroup.add(doorPostR);

    // Note: Double entrance doors are now dynamically managed by DoorManager
    // so they remain closed by default and smoothly swing open when pressing Q!

    // Build the Majestic 3D "V" Logo above the Building
    this.buildRooftop3DLogo(facadeGroup, entranceZ);

    this.group.add(facadeGroup);
  }

  /**
   * Builds the massive sculptural 3D "V" Monogram Logo from the official Verlyn brand
   * mounted high above the front entrance parapet. Features brushed aerospace titanium facets,
   * glowing cyan backlighting, architectural chrome support pylons, and roof spotlights.
   */
  private buildRooftop3DLogo(facadeGroup: THREE.Group, entranceZ: number) {
    const logoGroup = new THREE.Group();
    // Positioned atop the central parapet facing South towards the entrance walkway
    logoGroup.position.set(0, 4.82, entranceZ + 0.12);

    // 1. Construct 3D Shapes matching the official Verlyn dynamic VT monogram
    // Left sharp diagonal blade
    const leftShape = new THREE.Shape();
    leftShape.moveTo(-2.3, 1.4);
    leftShape.lineTo(-1.4, 1.4);
    leftShape.lineTo(-0.28, -0.6);
    leftShape.lineTo(-0.58, -1.4);
    leftShape.closePath();

    // Right aerodynamic swoosh wing
    const rightShape = new THREE.Shape();
    rightShape.moveTo(-0.24, -1.15);
    rightShape.bezierCurveTo(0.25, -0.7, 0.75, -0.15, 1.05, 0.45);
    rightShape.bezierCurveTo(1.25, 0.85, 1.55, 1.05, 2.2, 1.15);
    rightShape.bezierCurveTo(2.65, 1.2, 2.85, 1.28, 2.9, 1.35);
    rightShape.bezierCurveTo(2.85, 1.42, 2.6, 1.45, 2.2, 1.45);
    rightShape.bezierCurveTo(1.65, 1.45, 1.15, 1.42, 0.7, 1.28);
    rightShape.bezierCurveTo(0.3, 1.12, 0.05, 0.8, -0.05, 0.4);
    rightShape.bezierCurveTo(0.2, 0.45, 0.45, 0.42, 0.52, 0.32);
    rightShape.bezierCurveTo(0.55, 0.15, 0.25, -0.35, -0.24, -1.15);
    rightShape.closePath();

    const extrudeSettings = {
      depth: 0.26,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035
    };

    const leftGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
    const rightGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);

    // Front Metal Material (Brushed Aerospace Chrome/Titanium)
    const titanMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.16,
      metalness: 0.95
    });

    // Emissive Cyan Neon Halo & Backlight
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x06B6D4,
      emissive: 0x06B6D4,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.5
    });

    const emblemSubgroup = new THREE.Group();

    // Front sculptural chrome meshes
    const leftMesh = new THREE.Mesh(leftGeo, titanMat);
    leftMesh.castShadow = true;
    emblemSubgroup.add(leftMesh);

    const rightMesh = new THREE.Mesh(rightGeo, titanMat);
    rightMesh.castShadow = true;
    emblemSubgroup.add(rightMesh);

    // Glowing Cyan Aura Backplate (slightly offset backwards)
    const glowSettings = {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.055,
      bevelThickness: 0.02
    };
    const leftGlowGeo = new THREE.ExtrudeGeometry(leftShape, glowSettings);
    const rightGlowGeo = new THREE.ExtrudeGeometry(rightShape, glowSettings);

    const leftGlowMesh = new THREE.Mesh(leftGlowGeo, glowMat);
    leftGlowMesh.position.z = -0.05;
    emblemSubgroup.add(leftGlowMesh);

    const rightGlowMesh = new THREE.Mesh(rightGlowGeo, glowMat);
    rightGlowMesh.position.z = -0.05;
    emblemSubgroup.add(rightGlowMesh);

    // Center emblem visually and scale to fit rooftop parapet
    emblemSubgroup.scale.setScalar(0.76);
    emblemSubgroup.position.set(-0.25, 0, 0);
    logoGroup.add(emblemSubgroup);

    // 2. Heavy Architectural Chrome Pylon Trusses Anchoring to Roof
    const strutMat = this.materials['carChrome'];
    const pylonGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.45, 16);

    const pylonL = new THREE.Mesh(pylonGeo, strutMat);
    pylonL.position.set(-0.85, -1.0, 0);
    logoGroup.add(pylonL);

    const pylonR = new THREE.Mesh(pylonGeo, strutMat);
    pylonR.position.set(0.75, -1.0, 0);
    logoGroup.add(pylonR);

    // Diagonal stabilizer cross braces
    const braceGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.8, 12);
    const brace1 = new THREE.Mesh(braceGeo, strutMat);
    brace1.rotation.z = 0.55;
    brace1.position.set(-0.05, -1.0, -0.02);
    logoGroup.add(brace1);

    const brace2 = new THREE.Mesh(braceGeo, strutMat);
    brace2.rotation.z = -0.55;
    brace2.position.set(-0.05, -1.0, -0.02);
    logoGroup.add(brace2);

    // Heavy Mounting Base Plates on Parapet Top
    const plateGeo = new THREE.BoxGeometry(0.32, 0.08, 0.32);
    const basePlateL = new THREE.Mesh(plateGeo, this.materials['curtainMullion']);
    basePlateL.position.set(-0.85, -1.5, 0);
    logoGroup.add(basePlateL);

    const basePlateR = new THREE.Mesh(plateGeo, this.materials['curtainMullion']);
    basePlateR.position.set(0.75, -1.5, 0);
    logoGroup.add(basePlateR);

    facadeGroup.add(logoGroup);

    // 3. High-Intensity Architectural Spotlights on Roof pointing up at 3D V Logo
    const spotL = new THREE.PointLight(0x38BDF8, 3.8, 9, 1.2);
    spotL.position.set(-1.4, 3.55, entranceZ + 0.6);
    facadeGroup.add(spotL);

    const spotR = new THREE.PointLight(0x06B6D4, 3.8, 9, 1.2);
    spotR.position.set(1.4, 3.55, entranceZ + 0.6);
    facadeGroup.add(spotR);

    // Central Warm Specular Accent
    const spotC = new THREE.PointLight(0xFFFFFF, 2.0, 7, 1.5);
    spotC.position.set(0, 3.55, entranceZ + 0.8);
    facadeGroup.add(spotC);
  }

  /**
   * Builds the single-story architectural ceiling and modern linear LED lighting system.
   * Gives the office an authentic Silicon Valley / enterprise headquarters look with
   * recessed linear LED fixtures, acoustic panels, and an architectural corridor skylight.
   */
  private buildModernCeilingAndLighting() {
    const ceilingY = 3.25;

    // 1. Acoustic Ceiling Slabs over Wings (Batched into unified geometry)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.85
    });

    this.batcher.addBox([12.2, 0.1, 21.0], [-8.4, ceilingY + 0.05, 0], ceilingMat);
    this.batcher.addBox([12.2, 0.1, 21.0], [8.4, ceilingY + 0.05, 0], ceilingMat);
    this.batcher.addBox([4.6, 0.1, 3.5], [0, ceilingY + 0.05, -8.75], ceilingMat);
    this.batcher.addBox([4.6, 0.1, 3.5], [0, ceilingY + 0.05, 8.75], ceilingMat);

    // 2. Central Corridor Architectural Skylight
    const skylightGeo = new THREE.BoxGeometry(4.2, 0.06, 14.0);
    const skylightMat = new THREE.MeshStandardMaterial({
      color: 0xBAE6FD,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.15
    });
    const skylight = new THREE.Mesh(skylightGeo, skylightMat);
    skylight.position.set(0, ceilingY + 0.1, 0);
    this.group.add(skylight);

    // Skylight Steel Trusses
    for (let tz = -6.0; tz <= 6.0; tz += 2.4) {
      this.batcher.addBox([4.3, 0.1, 0.06], [0, ceilingY + 0.06, tz], this.materials['curtainMullion']);
    }

    // 3. Recessed Linear LED Light Channels
    const ledMatCool = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const ledMatCyan = new THREE.MeshBasicMaterial({ color: 0xCFFAFE });
    const ledMatGold = new THREE.MeshBasicMaterial({ color: 0xFEF3C7 });

    const createLedStrip = (w: number, d: number, x: number, z: number, mat = ledMatCool) => {
      this.batcher.addBox([w, 0.03, d], [x, ceilingY - 0.015, z], mat);
    };

    // Corridor Linear LED Channels (flanking the central skylight)
    createLedStrip(0.08, 17.0, -1.85, 0, ledMatCyan);
    createLedStrip(0.08, 17.0, 1.85, 0, ledMatCyan);

    // Web Studio Linear LED Strips
    createLedStrip(0.12, 8.5, -8.5, -5.2, ledMatCool);
    createLedStrip(0.12, 8.5, -11.5, -5.2, ledMatCool);

    // AI Lab Linear LED Strips
    createLedStrip(0.12, 8.5, -8.5, 5.2, ledMatCyan);
    createLedStrip(0.12, 8.5, -11.5, 5.2, ledMatCyan);

    // CEO Office Warm Architectural Downlight Strips
    createLedStrip(0.12, 8.5, 8.5, -5.2, ledMatGold);
    createLedStrip(0.12, 8.5, 11.5, -5.2, ledMatGold);

    // Growth Studio Linear LED Strips
    createLedStrip(0.12, 8.5, 8.5, 5.2, ledMatCool);
    createLedStrip(0.12, 8.5, 11.5, 5.2, ledMatCool);
  }

  /**
   * Builds high-profile branded architectural feature walls showcasing
   * the official Verlyn Tech logo in the central corridor, CEO executive suite,
   * and reception greeting totem.
   */
  private buildBrandFeatureWalls() {
    const brandGroup = new THREE.Group();

    // ================= 1. CEO EXECUTIVE SUITE FEATURE WALL (Z = -10.35, X = 8.5) =================
    // Luxury dark executive wall directly behind CEO Ameen's desk!
    const ceoWallZ = -10.35;
    const ceoBackGeo = new THREE.BoxGeometry(5.2, 3.15, 0.04);
    const ceoBackMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.85 });
    const ceoBack = new THREE.Mesh(ceoBackGeo, ceoBackMat);
    ceoBack.position.set(8.5, 1.6, ceoWallZ);
    brandGroup.add(ceoBack);

    // Gold/Brass Executive Verlyn Tech Plaque
    const ceoBrandTex = this.createBrandCanvasTexture({
      width: 1024,
      height: 512,
      title: 'VERLYN TECH',
      subtitle: 'EXECUTIVE SUITE & BOARDROOM',
      theme: 'gold',
      logoSize: 210
    });
    const ceoPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshBasicMaterial({ map: ceoBrandTex, side: THREE.DoubleSide })
    );
    ceoPlaque.position.set(8.5, 1.85, ceoWallZ + 0.05);
    brandGroup.add(ceoPlaque);

    // Warm Gold Halo Glow behind CEO plaque
    const ceoGlow = new THREE.Mesh(
      new THREE.BoxGeometry(2.46, 1.26, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.45 })
    );
    ceoGlow.position.set(8.5, 1.85, ceoWallZ + 0.035);
    brandGroup.add(ceoGlow);

    // Vertical Brass Accent Slat Inlays
    const ceoTrimGeo = new THREE.BoxGeometry(0.03, 3.15, 0.02);
    const ceoTrimMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.9, roughness: 0.2 });
    [6.2, 7.0, 10.0, 10.8].forEach(tx => {
      const trim = new THREE.Mesh(ceoTrimGeo, ceoTrimMat);
      trim.position.set(tx, 1.6, ceoWallZ + 0.03);
      brandGroup.add(trim);
    });

    // ================= 3. ENTRANCE DIGITAL WELCOME TOTEM (X = 1.7, Z = 8.5) =================
    // Interactive greeting directory totem standing near entrance
    const totemGroup = new THREE.Group();
    totemGroup.position.set(1.7, 0, 8.5);
    totemGroup.rotation.y = -Math.PI / 4;

    const totemBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x090D16, metalness: 0.9, roughness: 0.2 })
    );
    totemBase.position.set(0, 0.04, 0);
    totemGroup.add(totemBase);

    const totemPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.7, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0F172A, metalness: 0.8, roughness: 0.3 })
    );
    totemPillar.position.set(0, 0.88, 0);
    totemGroup.add(totemPillar);

    const totemTex = this.createBrandCanvasTexture({
      width: 512,
      height: 768,
      title: 'VERLYN TECH',
      subtitle: 'CAMPUS DIRECTORY',
      theme: 'dark',
      logoSize: 180
    });
    const totemScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.72),
      new THREE.MeshBasicMaterial({ map: totemTex })
    );
    totemScreen.position.set(0, 1.15, 0.065);
    totemGroup.add(totemScreen);
    brandGroup.add(totemGroup);

    this.group.add(brandGroup);
  }

  private static brandTexCache: Map<string, THREE.CanvasTexture> = new Map();
  private static sharedLogoImg: HTMLImageElement | null = null;

  /**
   * Generates a high-resolution CanvasTexture incorporating the official Verlyn Tech logo
   * and custom typography for exterior facade signage, central feature walls, and executive plaques.
   */
  private createBrandCanvasTexture(options: {
    width: number;
    height: number;
    title: string;
    subtitle?: string;
    theme: 'dark' | 'light' | 'gold';
    logoSize?: number;
  }): THREE.CanvasTexture {
    const cacheKey = `${options.width}x${options.height}_${options.theme}_${options.title}_${options.subtitle || ''}`;
    if (OfficeBuilding.brandTexCache.has(cacheKey)) {
      return OfficeBuilding.brandTexCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    const ctx = canvas.getContext('2d')!;

    const drawContent = (logoImg?: HTMLImageElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (options.theme === 'dark') {
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#090D16');
        bgGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tech grid lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
      } else if (options.theme === 'gold') {
        ctx.fillStyle = '#0B0F19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 5;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
      } else {
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
      }

      // Draw Logo
      const logoTargetH = options.logoSize || Math.floor(canvas.height * 0.42);
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const logoTargetW = logoTargetH * aspect;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = logoImg.naturalWidth;
        offCanvas.height = logoImg.naturalHeight;
        const offCtx = offCanvas.getContext('2d')!;
        offCtx.drawImage(logoImg, 0, 0);

        try {
          const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
          const data = imgData.data;

          if (options.theme === 'dark' || options.theme === 'gold') {
            for (let i = 0; i < data.length; i += 4) {
              const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (brightness > 205) {
                data[i + 3] = 0; // Transparent background
              } else {
                const darkFactor = 1 - (brightness / 205);
                if (options.theme === 'gold') {
                  data[i] = 245;
                  data[i + 1] = 180;
                  data[i + 2] = 40;
                } else {
                  data[i] = 255;
                  data[i + 1] = 255;
                  data[i + 2] = 255;
                }
                data[i + 3] = Math.min(255, Math.floor(darkFactor * 255));
              }
            }
            offCtx.putImageData(imgData, 0, 0);
          } else {
            // Light theme: transparent white background, crisp dark logo
            for (let i = 0; i < data.length; i += 4) {
              const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (brightness > 215) {
                data[i + 3] = 0;
              }
            }
            offCtx.putImageData(imgData, 0, 0);
          }

          const logoX = (canvas.width - logoTargetW) / 2;
          const logoY = options.subtitle ? canvas.height * 0.12 : (canvas.height - logoTargetH) / 2;
          ctx.drawImage(offCanvas, logoX, logoY, logoTargetW, logoTargetH);
        } catch {
          ctx.drawImage(logoImg, (canvas.width - logoTargetW) / 2, canvas.height * 0.12, logoTargetW, logoTargetH);
        }
      }

      // Draw Title & Subtitle
      if (options.theme === 'dark') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, canvas.width / 2, canvas.height * 0.72);

        if (options.subtitle) {
          ctx.fillStyle = '#06B6D4';
          ctx.font = '600 22px monospace';
          ctx.fillText(options.subtitle, canvas.width / 2, canvas.height * 0.86);
        }
      } else if (options.theme === 'gold') {
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, canvas.width / 2, canvas.height * 0.72);

        if (options.subtitle) {
          ctx.fillStyle = '#FDE68A';
          ctx.font = '600 20px monospace';
          ctx.fillText(options.subtitle, canvas.width / 2, canvas.height * 0.86);
        }
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(options.title, canvas.width / 2, canvas.height * 0.68);

        if (options.subtitle) {
          ctx.fillStyle = '#0284C7';
          ctx.font = 'bold 24px monospace';
          ctx.fillText(options.subtitle, canvas.width / 2, canvas.height * 0.85);
        }
      }

      tex.needsUpdate = true;
    };

    const tex = new THREE.CanvasTexture(canvas);
    OfficeBuilding.brandTexCache.set(cacheKey, tex);

    if (OfficeBuilding.sharedLogoImg && OfficeBuilding.sharedLogoImg.complete) {
      drawContent(OfficeBuilding.sharedLogoImg);
    } else {
      drawContent(); // Render initial styling immediately

      if (!OfficeBuilding.sharedLogoImg) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/verlyn-logo.jpg';
        img.onload = () => {
          OfficeBuilding.sharedLogoImg = img;
          drawContent(img);
        };
      } else {
        OfficeBuilding.sharedLogoImg.addEventListener('load', () => {
          drawContent(OfficeBuilding.sharedLogoImg!);
        });
      }
    }

    return tex;
  }
}
