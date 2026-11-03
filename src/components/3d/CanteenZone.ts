import { createFoodPlate, PlateDish } from './Food';
import * as THREE from 'three';
import { OfficeTextureGenerator } from './OfficeTextureGenerator';
import { GeometryBatcher } from './GeometryBatcher';

export interface CanteenZoneController {
  group: THREE.Group;
  update: (time: number, delta: number) => void;
  steamGroup: THREE.Group;
}

export class CanteenZone {
  public static create(): CanteenZoneController {
    const group = new THREE.Group();

    // ================= 1. MATERIALS =================
    const warmFloorTex = OfficeTextureGenerator.getScandinavianAshTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: warmFloorTex,
      roughness: 0.35,
      metalness: 0.05
    });

    const counterWoodMat = new THREE.MeshStandardMaterial({
      color: 0x2A1B14, // Dark roasted espresso wood
      roughness: 0.35,
      metalness: 0.1
    });

    const quartzCounterMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.15,
      metalness: 0.1
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.1,
      metalness: 0.95
    });

    const espressoRedMat = new THREE.MeshStandardMaterial({
      color: 0xB91C1C, // Italian red enamel
      roughness: 0.25,
      metalness: 0.3
    });

    const sofaFabricMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate charcoal linen
      roughness: 0.85,
      metalness: 0.05
    });

    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B, // Warm ochre accent cushions
      roughness: 0.8
    });

    const armchairMat = new THREE.MeshStandardMaterial({
      color: 0x0F766E, // Deep teal wool
      roughness: 0.75
    });

    const brassPendantMat = new THREE.MeshStandardMaterial({
      color: 0xD97706,
      roughness: 0.2,
      metalness: 0.9
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      metalness: 0.2
    });

    // ================= 2. CANTEEN FLOOR =================
    // Bounds: X: -4.5 to 4.5, Z: -20.5 to -10.5 (Width: 9.0m, Depth: 10.0m)
    const floorGeo = new THREE.BoxGeometry(9.0, 0.1, 10.0);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.05, -15.5);
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // Warm perimeter glow line on floor
    const glowLineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(8.9, 0.08, 9.9));
    const glowLineMat = new THREE.LineBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.5 });
    const glowLines = new THREE.LineSegments(glowLineGeo, glowLineMat);
    glowLines.position.set(0, 0.02, -15.5);
    group.add(glowLines);

    // ================= 3. PANORAMIC SKYLINE WINDOW (NORTH WALL) =================
    // Window opening at Z = -20.5, X: -4.5 to 4.5, Y: 0.9 to 2.8
    const windowGeo = new THREE.PlaneGeometry(8.9, 1.9);
    const windowMesh = new THREE.Mesh(windowGeo, glassMat);
    windowMesh.position.set(0, 1.85, -20.45);
    group.add(windowMesh);

    // Skyline Backdrop behind glass (City skyline + sunrise glow)
    const skylineCanvas = document.createElement('canvas');
    skylineCanvas.width = 1024;
    skylineCanvas.height = 512;
    const sCtx = skylineCanvas.getContext('2d')!;
    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.5, '#1E293B');
    skyGrad.addColorStop(0.8, '#D97706');
    skyGrad.addColorStop(1, '#FDE68A');
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 1024, 512);

    // Distant skyscraper silhouettes with illuminated windows
    sCtx.fillStyle = '#090D16';
    const bldCount = 28;
    for (let i = 0; i < bldCount; i++) {
      const bx = i * 38;
      const bw = 32 + (i % 3) * 6;
      const bh = 140 + Math.sin(i * 1.5) * 80 + (i % 5) * 35;
      sCtx.fillRect(bx, 512 - bh, bw, bh);

      // Window dots
      sCtx.fillStyle = '#FEF08A';
      for (let wy = 512 - bh + 20; wy < 490; wy += 16) {
        for (let wx = bx + 6; wx < bx + bw - 6; wx += 10) {
          if ((wx + wy) % 7 !== 0) {
            sCtx.fillRect(wx, wy, 4, 6);
          }
        }
      }
      sCtx.fillStyle = '#090D16';
    }

    const skylineTex = new THREE.CanvasTexture(skylineCanvas);
    const skylinePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 6),
      new THREE.MeshBasicMaterial({ map: skylineTex })
    );
    skylinePlane.userData.isDynamic = true;
    skylinePlane.position.set(0, 2.5, -22.5);
    group.add(skylinePlane);

    // ================= 4. ARTISAN BARISTA COFFEE BAR (WEST SIDE) =================
    // Coffee Counter at X = -2.8, Z: -14.5 (Runs North-South from Z = -16.2 to -12.8)
    const counterBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.95, 3.3),
      counterWoodMat
    );
    counterBase.position.set(-2.85, 0.475, -14.5);
    counterBase.castShadow = true;
    counterBase.receiveShadow = true;
    group.add(counterBase);

    // Decorative Fluted Wood Slats on front of counter (facing East into room)
    const slatMat = new THREE.MeshStandardMaterial({ color: 0x3F2618, roughness: 0.4 });
    for (let sz = -1.55; sz <= 1.55; sz += 0.08) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.88, 0.04), slatMat);
      slat.position.set(-2.09, 0.46, -14.5 + sz);
      group.add(slat);
    }

    // Polished Quartz Waterfall Countertop (overhanging front edge)
    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.08, 3.4),
      quartzCounterMat
    );
    counterTop.position.set(-2.85, 0.99, -14.5);
    counterTop.castShadow = true;
    group.add(counterTop);

    // ================= SHOW-STOPPING ITALIAN COMMERCIAL ESPRESSO MACHINE =================
    // Positioned on counter, facing EAST (Math.PI / 2) towards the customer & barista walkway
    const espressoGroup = new THREE.Group();
    espressoGroup.position.set(-2.65, 1.03, -14.5);
    espressoGroup.rotation.y = Math.PI / 2;

    // Heavyweight Italian Commercial Chassis
    const espBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.46, 0.52),
      espressoRedMat
    );
    espBody.position.y = 0.23;
    espBody.castShadow = true;
    espressoGroup.add(espBody);

    // Polished Mirror Chrome Side Panels
    [-0.415, 0.415].forEach(sx => {
      const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.44, 0.50), chromeMat);
      sidePanel.position.set(sx, 0.23, 0);
      espressoGroup.add(sidePanel);
    });

    // Mirror Stainless Top Cup Warmer & Security Rail
    const espChromeTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.05, 0.54),
      chromeMat
    );
    espChromeTop.position.y = 0.485;
    espressoGroup.add(espChromeTop);

    // Chrome Perimeter Guard Rail on Cup Warmer
    const railMat = chromeMat;
    const railFront = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.035, 0.015), railMat);
    railFront.position.set(0, 0.52, 0.24);
    espressoGroup.add(railFront);
    const railBack = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.035, 0.015), railMat);
    railBack.position.set(0, 0.52, -0.24);
    espressoGroup.add(railBack);

    // Neatly Arrayed Stacked Ceramic Cups on Warmer Rack
    const cupWhiteMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.15 });
    const cupNavyMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.2 });
    [-0.30, -0.15, 0, 0.15, 0.30].forEach((cx, idx) => {
      [-0.14, 0.08].forEach(cz => {
        const mat = idx % 2 === 0 ? cupWhiteMat : cupNavyMat;
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.032, 0.065, 12), mat);
        cup.position.set(cx, 0.54, cz);
        espressoGroup.add(cup);
      });
    });

    // Mirror Chrome Perforated Drip Tray with Drain Grid
    const dripTray = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.045, 0.24), chromeMat);
    dripTray.position.set(0, 0.0225, 0.24);
    espressoGroup.add(dripTray);

    const drainGrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.008, 0.20),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    drainGrate.position.set(0, 0.048, 0.24);
    espressoGroup.add(drainGrate);

    // Dual Commercial E61 Group Heads & Walnut Portafilters
    [-0.18, 0.18].forEach(ghX => {
      // E61 Chrome Bell Group Head
      const groupHead = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.09, 14), chromeMat);
      groupHead.position.set(ghX, 0.24, 0.26);
      espressoGroup.add(groupHead);

      // Ergonomic Walnut Portafilter Handle angled outward
      const portafilter = new THREE.Group();
      portafilter.position.set(ghX, 0.20, 0.26);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06), chromeMat);
      neck.rotation.x = Math.PI / 2;
      neck.position.set(0, 0, 0.04);
      portafilter.add(neck);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.14, 12), counterWoodMat);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0, 0, 0.14);
      portafilter.add(handle);
      espressoGroup.add(portafilter);
    });

    // Dual Professional Stainless Steel Steam Wands
    [-0.34, 0.34].forEach(swX => {
      const wand = new THREE.Group();
      wand.position.set(swX, 0.32, 0.24);
      const wandArm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.008, 0.22, 8), chromeMat);
      wandArm.rotation.x = Math.PI / 4;
      wandArm.rotation.z = swX > 0 ? -0.2 : 0.2;
      wandArm.position.set(0, -0.06, 0.06);
      wand.add(wandArm);

      // Steam valve knob (Walnut)
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), counterWoodMat);
      valve.rotation.x = Math.PI / 2;
      valve.position.set(0, 0.05, 0.01);
      wand.add(valve);
      espressoGroup.add(wand);
    });

    // Vintage Dual Luminescent Barometers (Brew Pressure 9.0 Bar & Boiler 1.5 Bar)
    [-0.08, 0.08].forEach((bx, idx) => {
      const gauge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.015, 16),
        chromeMat
      );
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(bx, 0.36, 0.265);

      const dial = new THREE.Mesh(
        new THREE.CircleGeometry(0.036, 16),
        new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x38BDF8 : 0x10B981 })
      );
      dial.position.set(0, 0, 0.009);
      gauge.add(dial);
      espressoGroup.add(gauge);
    });

    // Illuminated Brand Badge ("VERLYN ESPRESSO")
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.015),
      new THREE.MeshBasicMaterial({ color: 0xF59E0B })
    );
    badge.position.set(0, 0.43, 0.265);
    espressoGroup.add(badge);

    group.add(espressoGroup);

    // Commercial Conical Burr Coffee Bean Grinder (beside espresso machine at Z = -13.8)
    const grinderGroup = new THREE.Group();
    grinderGroup.position.set(-2.65, 1.03, -13.8);

    const grinderBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.38, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.3, metalness: 0.6 })
    );
    grinderBase.position.y = 0.19;
    grinderGroup.add(grinderBase);

    // Transparent Acrylic Bean Hopper with Roasted Coffee Beans inside
    const hopper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.07, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x3E1E09, roughness: 0.3, metalness: 0.2 })
    );
    hopper.position.y = 0.48;
    grinderGroup.add(hopper);

    const hopperLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.02, 16),
      chromeMat
    );
    hopperLid.position.y = 0.59;
    grinderGroup.add(hopperLid);

    // Chrome Portafilter Fork Cradle
    const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.02, 0.12), chromeMat);
    cradle.position.set(0.12, 0.10, 0);
    grinderGroup.add(cradle);
    group.add(grinderGroup);

    // Walnut Knock Box with Rubber Bar (Z = -15.2)
    const knockBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.24),
      counterWoodMat
    );
    knockBox.position.set(-2.60, 1.09, -15.25);
    group.add(knockBox);

    const knockBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0x090D1A, roughness: 0.8 })
    );
    knockBar.rotation.x = Math.PI / 2;
    knockBar.position.set(-2.60, 1.14, -15.25);
    group.add(knockBar);

    // Chrome Milk Frothing Pitcher on Drip Tray
    const pitcher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.052, 0.11, 14),
      chromeMat
    );
    pitcher.position.set(-2.45, 1.08, -14.65);
    group.add(pitcher);

    // Glass Artisan Flavor Syrup Station (Vanilla, Caramel, Hazelnut)
    [-15.6, -15.75, -15.9].forEach((sz, idx) => {
      const bottleMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0xFBBF24 : (idx === 1 ? 0xB45309 : 0x78350F),
        transparent: true,
        opacity: 0.75,
        roughness: 0.1
      });
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.22, 12), bottleMat);
      bottle.position.set(-2.60, 1.14, sz);
      group.add(bottle);

      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08), chromeMat);
      spout.position.set(-2.60, 1.28, sz);
      group.add(spout);
    });

    // Animated Steam Particles over the Espresso Group Heads
    const steamGroup = new THREE.Group();
    steamGroup.position.set(-2.42, 1.40, -14.5);
    const steamParticles: { mesh: THREE.Mesh; seed: number; speed: number }[] = [];
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.30,
      depthWrite: false
    });
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), steamMat);
      p.userData.isDynamic = true;
      p.position.set(
        (Math.random() - 0.5) * 0.18,
        Math.random() * 0.45,
        (Math.random() - 0.5) * 0.25
      );
      steamGroup.add(p);
      steamParticles.push({
        mesh: p,
        seed: Math.random() * 10,
        speed: 0.35 + Math.random() * 0.25
      });
    }
    group.add(steamGroup);

    // Undercounter Milk & Beverage Refrigerator (Glass Door with drinks inside)
    const milkFridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.82, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8, roughness: 0.2 })
    );
    milkFridge.position.set(-2.8, 0.41, -13.2);
    group.add(milkFridge);

    const fridgeGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.72),
      glassMat
    );
    fridgeGlass.position.set(-2.8, 0.41, -12.87);
    group.add(fridgeGlass);

    // ================= 5. RIGHT-HAND SERVING TABLE =================
    const servingTable = new THREE.Group(); servingTable.name = 'Canteen serving table';
    servingTable.position.set(3.2, 0, -14.5);
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 4.0), quartzCounterMat);
    tableTop.position.y = 0.90; tableTop.castShadow = true; servingTable.add(tableTop);
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.12, 3.86), chromeMat);
    apron.position.y = 0.80; servingTable.add(apron);
    for (const x of [-0.39, 0.39]) for (const z of [-1.8, 1.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.83, 0.055), chromeMat);
      leg.position.set(x, 0.415, z); servingTable.add(leg);
    }
    const dishes: PlateDish[] = ['rice', 'salad', 'pasta', 'sandwich', 'fruit', 'nuts'];
    dishes.forEach((dish, index) => {
      const plate = createFoodPlate(dish); plate.position.set(index % 2 ? 0.22 : -0.22, 0.956, -1.45 + Math.floor(index / 2) * 1.45);
      servingTable.add(plate);
    });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xEDE9DD, roughness: 0.35 });
    for (let i = 0; i < 5; i++) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.018, 20), plateMat);
      plate.position.set(0, 0.955 + i * 0.02, 0.72); servingTable.add(plate);
    }
    // Drinks stay available beside the meal dishes.
    for (const z of [-0.75, 0.65]) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 12), new THREE.MeshStandardMaterial({ color: z < 0 ? 0x8D9B67 : 0xB88A55, roughness: 0.45 }));
      bottle.position.set(0.25, 1.035, z); servingTable.add(bottle);
    }
    group.add(servingTable);

    // ================= 6. MODERN SCANDINAVIAN SOFA LOUNGE =================
    // Sofa at X: -2.5, Z: -18.2 (Facing South, direction 0)
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(-2.5, 0, -18.2);

    // Base Seat Cushion (2.2m wide, 0.68m deep, top surface at Y = 0.44m)
    const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.24, 0.68), sofaFabricMat);
    sofaSeat.position.set(0, 0.32, 0.04);
    sofaSeat.castShadow = true;
    sofaGroup.add(sofaSeat);

    // Sofa Backrest
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 0.20), sofaFabricMat);
    sofaBack.position.set(0, 0.66, -0.28);
    sofaBack.castShadow = true;
    sofaGroup.add(sofaBack);

    // Side Arms
    [-1.02, 1.02].forEach(ax => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.72), sofaFabricMat);
      arm.position.set(ax, 0.48, 0.02);
      sofaGroup.add(arm);
    });

    // Modern tapered wooden legs
    const woodLegMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.4 });
    [[-0.95, -0.28], [0.95, -0.28], [-0.95, 0.32], [0.95, 0.32]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.20), woodLegMat);
      leg.position.set(lx, 0.10, lz);
      sofaGroup.add(leg);
    });

    // Decorative Ochre Accent Pillows
    [-0.65, 0.65].forEach(px => {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.14), cushionMat);
      pillow.position.set(px, 0.52, -0.18);
      pillow.rotation.x = -0.15;
      sofaGroup.add(pillow);
    });

    group.add(sofaGroup);

    // Low Modern Coffee Table in front of sofa at X: -2.5, Z: -17.1
    const coffeeTable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.04, 24),
      counterWoodMat
    );
    coffeeTable.position.set(-2.5, 0.38, -17.1);
    coffeeTable.castShadow = true;
    group.add(coffeeTable);

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.25, 0.36, 16), chromeMat);
    tableBase.position.set(-2.5, 0.18, -17.1);
    group.add(tableBase);

    // Magazines & small succulent on coffee table
    const magMat = new THREE.MeshStandardMaterial({ color: 0x0284C7 });
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.32), magMat);
    mag.position.set(-2.55, 0.41, -17.1);
    mag.rotation.y = 0.35;
    group.add(mag);

    // Two Modern Teal Armchairs flanking the lounge
    const createArmchair = (x: number, z: number, rotY: number) => {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(x, 0, z);
      chairGroup.rotation.y = rotY;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.68), armchairMat);
      seat.position.set(0, 0.38, 0);
      seat.castShadow = true;
      chairGroup.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.46, 0.14), armchairMat);
      back.position.set(0, 0.65, -0.26);
      back.rotation.x = -0.1;
      chairGroup.add(back);

      [[-0.28, -0.25], [0.28, -0.25], [-0.28, 0.25], [0.28, 0.25]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.28), woodLegMat);
        leg.position.set(lx, 0.14, lz);
        chairGroup.add(leg);
      });

      return chairGroup;
    };

    group.add(createArmchair(-3.5, -16.5, Math.PI / 4));
    group.add(createArmchair(-1.2, -16.5, -Math.PI / 4));

    // ================= 7. PANORAMIC WINDOW BAR COUNTER & STOOLS =================
    // High bar counter table along North window at Z = -20.0, X: -2.0 to 2.0
    const barTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.06, 0.55),
      counterWoodMat
    );
    barTop.position.set(0, 1.05, -20.0);
    barTop.castShadow = true;
    group.add(barTop);

    // Bar support brackets
    [-1.8, 0, 1.8].forEach(bx => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.45), chromeMat);
      bracket.position.set(bx, 0.525, -20.0);
      group.add(bracket);
    });

    // 4 High Bar Stools at X = -1.5, -0.5, 0.5, 1.5, facing North (Math.PI)
    [-1.5, -0.5, 0.5, 1.5].forEach(stX => {
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(stX, 0, -19.4);

      // Padded round seat
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.06, 16), counterWoodMat);
      seat.position.y = 0.74;
      stoolGroup.add(seat);

      // Chrome column and base
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72), chromeMat);
      col.position.y = 0.36;
      stoolGroup.add(col);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16), chromeMat);
      base.position.y = 0.01;
      stoolGroup.add(base);

      // Footrest ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 20), chromeMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.25;
      stoolGroup.add(ring);

      group.add(stoolGroup);
    });

    // ================= 8. COMMUNAL DINING & BRAINSTORMING TABLE =================
    // Large communal table at X = 2.0, Z = -18.0 (2.4m x 1.1m)
    const comTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.08, 1.1),
      counterWoodMat
    );
    comTable.position.set(2.0, 0.75, -18.0);
    comTable.castShadow = true;
    group.add(comTable);

    // Trestle legs
    [-0.9, 0.9].forEach(tx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.71, 0.9), chromeMat);
      leg.position.set(2.0 + tx, 0.355, -18.0);
      group.add(leg);
    });

    // 4 Communal Chairs around the table
    const createDiningChair = (x: number, z: number, facing: number) => {
      const chair = new THREE.Group();
      chair.position.set(x, 0, z);
      chair.rotation.y = facing;

      const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), counterWoodMat);
      cSeat.position.y = 0.45;
      chair.add(cSeat);

      const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.40, 0.03), counterWoodMat);
      cBack.position.set(0, 0.67, -0.20);
      chair.add(cBack);

      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.43), chromeMat);
        leg.position.set(lx, 0.215, lz);
        chair.add(leg);
      });

      return chair;
    };

    group.add(createDiningChair(1.4, -17.2, Math.PI));
    group.add(createDiningChair(2.6, -17.2, Math.PI));
    group.add(createDiningChair(1.4, -18.8, 0));
    group.add(createDiningChair(2.6, -18.8, 0));

    // ================= 9. QUIET CANTEEN MENU & ANALOG CLOCK =================
    // A static black menu replaces the animated feed. Text remains legible from the lounge.
    const menuCanvas = document.createElement('canvas');
    menuCanvas.width = 1024;
    menuCanvas.height = 576;
    const menuCtx = menuCanvas.getContext('2d')!;
    menuCtx.fillStyle = '#08090B';
    menuCtx.fillRect(0, 0, 1024, 576);
    menuCtx.textAlign = 'center';
    menuCtx.fillStyle = '#F3F0E9';
    menuCtx.font = '600 64px Inter, Arial, sans-serif';
    menuCtx.fillText('CANTEEN', 512, 150);
    menuCtx.fillStyle = '#B9B6AF';
    menuCtx.font = '400 35px Inter, Arial, sans-serif';
    menuCtx.fillText('Coffee  ·  Cold drinks', 512, 265);
    menuCtx.fillText('Rice bowls  ·  Pasta  ·  Salads', 512, 335);
    menuCtx.font = '400 27px Inter, Arial, sans-serif';
    menuCtx.fillText('Serving table on your right  ·  Take a plate', 512, 460);

    const menuTexture = new THREE.CanvasTexture(menuCanvas);
    menuTexture.colorSpace = THREE.SRGBColorSpace;
    menuTexture.anisotropy = 4;
    const menuFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.25, 2.18),
      new THREE.MeshStandardMaterial({ color: 0x090A0C, roughness: 0.5, metalness: 0.25 })
    );
    menuFrame.position.set(4.34, 1.85, -18.0);
    group.add(menuFrame);
    const menuFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.18),
      new THREE.MeshBasicMaterial({ map: menuTexture, toneMapped: false })
    );
    menuFace.userData.isDynamic = true;
    menuFace.position.set(4.29, 1.85, -18.0);
    menuFace.rotation.y = -Math.PI / 2;
    group.add(menuFace);

    // Real-Time Analog Wall Clock mounted on West Wall at X = -4.32, Z = -14.5
    const clockCanvas = document.createElement('canvas');
    clockCanvas.width = 512;
    clockCanvas.height = 512;
    const clkCtx = clockCanvas.getContext('2d')!;

    const renderClock = () => {
      clkCtx.clearRect(0, 0, 512, 512);
      clkCtx.fillStyle = '#FFFFFF';
      clkCtx.beginPath();
      clkCtx.arc(256, 256, 240, 0, Math.PI * 2);
      clkCtx.fill();

      // Outer bezel
      clkCtx.strokeStyle = '#0F172A';
      clkCtx.lineWidth = 18;
      clkCtx.stroke();

      // Hour ticks
      clkCtx.strokeStyle = '#334155';
      clkCtx.lineWidth = 6;
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        const x1 = 256 + Math.cos(ang) * 190;
        const y1 = 256 + Math.sin(ang) * 190;
        const x2 = 256 + Math.cos(ang) * 220;
        const y2 = 256 + Math.sin(ang) * 220;
        clkCtx.beginPath();
        clkCtx.moveTo(x1, y1);
        clkCtx.lineTo(x2, y2);
        clkCtx.stroke();
      }

      // Hands from current real time
      const now = new Date();
      const hrs = now.getHours() % 12;
      const min = now.getMinutes();
      const sec = now.getSeconds() + now.getMilliseconds() / 1000;

      // Hour hand
      const hrAng = ((hrs + min / 60) * Math.PI) / 6 - Math.PI / 2;
      clkCtx.strokeStyle = '#0F172A';
      clkCtx.lineWidth = 14;
      clkCtx.lineCap = 'round';
      clkCtx.beginPath();
      clkCtx.moveTo(256, 256);
      clkCtx.lineTo(256 + Math.cos(hrAng) * 120, 256 + Math.sin(hrAng) * 120);
      clkCtx.stroke();

      // Minute hand
      const minAng = ((min + sec / 60) * Math.PI) / 30 - Math.PI / 2;
      clkCtx.strokeStyle = '#1E293B';
      clkCtx.lineWidth = 9;
      clkCtx.beginPath();
      clkCtx.moveTo(256, 256);
      clkCtx.lineTo(256 + Math.cos(minAng) * 170, 256 + Math.sin(minAng) * 170);
      clkCtx.stroke();

      // Second hand (Red)
      const secAng = (sec * Math.PI) / 30 - Math.PI / 2;
      clkCtx.strokeStyle = '#DC2626';
      clkCtx.lineWidth = 4;
      clkCtx.beginPath();
      clkCtx.moveTo(256, 256);
      clkCtx.lineTo(256 + Math.cos(secAng) * 200, 256 + Math.sin(secAng) * 200);
      clkCtx.stroke();

      // Center pin
      clkCtx.fillStyle = '#DC2626';
      clkCtx.beginPath();
      clkCtx.arc(256, 256, 10, 0, Math.PI * 2);
      clkCtx.fill();
    };
    renderClock();

    const clockTex = new THREE.CanvasTexture(clockCanvas);
    const clockMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 32),
      new THREE.MeshBasicMaterial({ map: clockTex })
    );
    clockMesh.userData.isDynamic = true;
    clockMesh.position.set(-4.32, 2.2, -14.5);
    clockMesh.rotation.y = Math.PI / 2;
    group.add(clockMesh);

    // ================= 10. NEON ENTRANCE SIGNAGE =================
    // "CANTEEN & LOUNGE" Sign over South entrance doorway (at Z = -10.6, facing South)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const signCtx = signCanvas.getContext('2d')!;
    signCtx.fillStyle = '#090D1A';
    signCtx.fillRect(0, 0, 1024, 256);
    signCtx.strokeStyle = '#06B6D4';
    signCtx.lineWidth = 8;
    signCtx.strokeRect(10, 10, 1004, 236);

    signCtx.fillStyle = '#38BDF8';
    signCtx.font = 'bold 72px sans-serif';
    signCtx.textAlign = 'center';
    signCtx.fillText('☕ CANTEEN & LOUNGE', 512, 110);
    signCtx.fillStyle = '#94A3B8';
    signCtx.font = '600 36px monospace';
    signCtx.fillText('RELAX • REFUEL • RECHARGE', 512, 180);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.7),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.userData.isDynamic = true;
    signMesh.position.set(0, 2.65, -10.6);
    group.add(signMesh);

    // ================= 11. WARM CEILING LIGHT PENDANTS =================
    [-2.0, 2.0].forEach(px => {
      [-13.5, -17.5].forEach(pz => {
        const pendant = new THREE.Group();
        pendant.position.set(px, 3.1, pz);

        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.6), chromeMat);
        wire.position.y = -0.3;
        pendant.add(wire);

        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 16, 1, true), brassPendantMat);
        shade.position.y = -0.65;
        pendant.add(shade);

        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xFDE68A })
        );
        bulb.position.y = -0.68;
        pendant.add(bulb);

        group.add(pendant);
      });
    });

    // Consolidate all static furniture, walls, counters, armchairs & sofa into merged geometry batches (>85% draw call reduction)
    GeometryBatcher.batchStaticGroup(group);

    let lastClockUpdate = 0;

    return {
      group,
      steamGroup,
      update: (time: number, delta: number) => {
        // Animate steam particles gently rising and fading
        steamParticles.forEach(p => {
          p.mesh.position.y += p.speed * delta;
          p.mesh.position.x += Math.sin(time * 3 + p.seed) * 0.05 * delta;
          if (p.mesh.position.y > 0.65) {
            p.mesh.position.y = 0;
            p.mesh.position.x = (Math.random() - 0.5) * 0.25;
          }
        });

        // 1Hz low-frequency real-time clock update (zero CPU overhead)
        if (time - lastClockUpdate >= 1.0) {
          lastClockUpdate = time;
          renderClock();
          clockTex.needsUpdate = true;
        }

      }
    };
  }
}
