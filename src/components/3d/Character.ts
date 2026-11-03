import { createFoodPlate, PlateDish } from './Food';
import * as THREE from 'three';
import { EmployeeDefinition } from '../../types/office';
import { OfficeTextureGenerator } from './OfficeTextureGenerator';
import { GeometryBatcher } from './GeometryBatcher';

export interface CharacterMeshController {
  group: THREE.Group;
  billboard?: THREE.Mesh;
  updateAnimation: (time: number, isMoving?: boolean, speedMultiplier?: number, isJumping?: boolean) => void;
  lookAt: (target: THREE.Vector3) => void;
  setSitting?: (isSitting: boolean, isSofa?: boolean, isBarStool?: boolean, seatHeight?: number) => void;
  setHoldingProp?: (prop: 'none' | 'coffee_cup' | 'snack_bar' | 'meal_plate', dish?: PlateDish) => void;
  setMealProgress?: (progress: number) => void;
  triggerDrink?: () => void;
  triggerEat?: (dish?: PlateDish) => void;
  setTalking?: (isTalking: boolean) => void;
}

export class CharacterFactory {
  /**
   * Creates the playable user character avatar with high-polish stylized block aesthetic,
   * ultra-smooth animations, and responsive jumping.
   */
  public static createPlayerAvatar(): CharacterMeshController {
    const group = new THREE.Group();

    // High quality stylized block materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xF7D0B2,
      roughness: 0.45,
      metalness: 0.05
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x18181B,
      roughness: 0.65,
      metalness: 0.1
    });

    // Tech Bomber Jacket (Navy & Royal with Cyan trim)
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1D4ED8,
      roughness: 0.35,
      metalness: 0.2
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x06B6D4,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x06B6D4,
      emissiveIntensity: 0.25
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.55,
      metalness: 0.1
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.35,
      metalness: 0.15
    });

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x06B6D4,
      roughness: 0.3
    });

    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.5,
      metalness: 0.25
    });

    // Hip container for walking bob, jumping, & sitting
    const hipGroup = new THREE.Group();
    hipGroup.position.y = 0.85;
    group.add(hipGroup);

    // Block Torso / Jacket
    const torsoGeo = new THREE.BoxGeometry(0.46, 0.54, 0.30);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 0.27;
    torso.castShadow = true;
    torso.receiveShadow = true;
    hipGroup.add(torso);

    // Glowing Cyan Zipper Trim
    const zipGeo = new THREE.BoxGeometry(0.04, 0.48, 0.02);
    const zip = new THREE.Mesh(zipGeo, trimMat);
    zip.position.set(0, 0.27, 0.155);
    hipGroup.add(zip);

    // Tech Backpack with glowing power bar
    const backpackGeo = new THREE.BoxGeometry(0.32, 0.40, 0.16);
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 0.27, -0.22);
    backpack.castShadow = true;
    hipGroup.add(backpack);

    const bpLightGeo = new THREE.BoxGeometry(0.18, 0.04, 0.02);
    const bpLight = new THREE.Mesh(bpLightGeo, trimMat);
    bpLight.position.set(0, 0.32, -0.305);
    hipGroup.add(bpLight);

    // Head Container
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.62, 0);
    hipGroup.add(headGroup);

    // Player Face Texture (Expressive anime/voxel eyes, catchlights & smile)
    const playerFaceTex = OfficeTextureGenerator.getCharacterFaceTexture({
      skinColor: '#F7D0B2',
      hairColor: '#18181B',
      eyeColor: '#0284C7',
      expression: 'confident'
    });
    const playerFaceMat = new THREE.MeshStandardMaterial({
      map: playerFaceTex,
      roughness: 0.45,
      metalness: 0.05
    });
    const playerHeadMats = [
      skinMat, // +X
      skinMat, // -X
      skinMat, // +Y
      skinMat, // -Y
      playerFaceMat, // +Z (Front)
      skinMat  // -Z
    ];

    // Block Head
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const head = new THREE.Mesh(headGeo, playerHeadMats);
    head.position.y = 0.14;
    head.castShadow = true;
    headGroup.add(head);

    // Stylized Block Hair with side taper
    const hairGeo = new THREE.BoxGeometry(0.30, 0.13, 0.30);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.28;
    headGroup.add(hair);

    const fringeGeo = new THREE.BoxGeometry(0.24, 0.08, 0.06);
    const fringe = new THREE.Mesh(fringeGeo, hairMat);
    fringe.position.set(0, 0.22, 0.15);
    headGroup.add(fringe);

    // Holographic Visor / Glasses with Cyan Glow
    const visorGeo = new THREE.BoxGeometry(0.26, 0.07, 0.07);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06B6D4,
      roughness: 0.1,
      metalness: 0.85,
      emissive: 0x06B6D4,
      emissiveIntensity: 0.4
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.15, 0.145);
    headGroup.add(visor);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.13, 0.46, 0.13);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.30, 0.48, 0);
    const leftArm = new THREE.Mesh(armGeo, jacketMat);
    leftArm.position.y = -0.21;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);

    // Left Hand (skin block)
    const handGeo = new THREE.BoxGeometry(0.11, 0.09, 0.11);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.46;
    leftArmGroup.add(leftHand);
    hipGroup.add(leftArmGroup);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.30, 0.48, 0);
    const rightArm = new THREE.Mesh(armGeo, jacketMat);
    rightArm.position.y = -0.21;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.46;
    rightArmGroup.add(rightHand);
    hipGroup.add(rightArmGroup);

    // Stylized Water Cup for Drinking Animation (attached to right hand)
    const cupGroup = new THREE.Group();
    const cupGeo = new THREE.CylinderGeometry(0.065, 0.045, 0.14, 16);
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.25,
      metalness: 0.1
    });
    const cupMesh = new THREE.Mesh(cupGeo, cupMat);
    cupMesh.position.set(0, -0.06, 0.07);
    cupGroup.add(cupMesh);

    // Glowing pure cyan mountain spring water inside cup
    const waterGeo = new THREE.CircleGeometry(0.06, 16);
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, 0.008, 0.07);
    cupGroup.add(waterMesh);

    cupGroup.visible = false;
    rightHand.add(cupGroup);

    const snackGroup = new THREE.Group();
    const snack = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.045, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xB38B58, roughness: 0.75 })
    );
    snack.position.set(0, -0.05, 0.07);
    snackGroup.add(snack);
    snackGroup.visible = false;
    rightHand.add(snackGroup);

    // Articulated legs keep feet grounded in standing and seated poses.
    const makePlayerLeg = (side: string, x: number) => {
      const leg = new THREE.Group();
      leg.name = 'Player ' + side + ' leg';
      leg.position.x = x;
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.40, 0.17), pantsMat);
      thigh.position.y = -0.20;
      thigh.castShadow = true;
      leg.add(thigh);
      const knee = new THREE.Group();
      knee.name = 'Player ' + side + ' knee';
      knee.position.y = -0.40;
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.38, 0.16), pantsMat);
      shin.position.y = -0.19;
      knee.add(shin);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.065, 0.24), shoeMat);
      shoe.position.set(0, -0.38 - 0.0325 + 0.01, 0.035);
      knee.add(shoe);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.164, 0.018, 0.244), soleMat);
      sole.position.set(0, -0.38 - 0.065 + 0.009, 0.035);
      knee.add(sole);
      leg.add(knee);
      hipGroup.add(leg);
      return { leg, knee };
    };
    const { leg: leftLegGroup, knee: leftKneeGroup } = makePlayerLeg('left', -0.13);
    const { leg: rightLegGroup, knee: rightKneeGroup } = makePlayerLeg('right', 0.13);
    // Pulsing player indicator ring on floor
    const ringGeo = new THREE.RingGeometry(0.38, 0.46, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    const mealPlate = new THREE.Group(); mealPlate.name = 'Held meal plate';
    mealPlate.position.set(0, -0.35, 0.26); mealPlate.visible = false; leftArmGroup.add(mealPlate);
    let mealDish: PlateDish | null = null;
    const setMealDish = (dish: PlateDish = 'rice') => {
      if (mealDish === dish) return;
      mealPlate.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(mat => { if (!mat.userData.sharedFoodMaterial) mat.dispose(); }); } });
      mealPlate.clear(); mealPlate.add(createFoodPlate(dish)); mealDish = dish;
    };
    const setFoodProgress = (progress: number) => {
      const food = mealPlate.children[0];
      food?.children.slice(2).forEach(piece => {
        if (piece.userData.servedScaleY === undefined) piece.userData.servedScaleY = piece.scale.y;
        piece.scale.y = piece.userData.servedScaleY * Math.max(0.02, 1 - progress);
        piece.visible = progress < 1;
      });
    };
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.009), new THREE.MeshStandardMaterial({ color: 0xB8B8AA, metalness: 0.7, roughness: 0.3 }));
    fork.position.set(0, -0.36, 0.12); fork.visible = false; fork.userData.isDynamic = true; rightArmGroup.add(fork);
    let walkCycle = 0;
    let isSeated = false;
    let seatedHipHeight = 0.5275;
    let isDrinking = false;
    let isEating = false;
    let drinkTimer = 0;
    let lastAnimTime = 0;
    const DRINK_DURATION = 2.4; // 2.4s drinking animation cycle

    GeometryBatcher.batchAnimatedParts(group);

    return {
      group,
      triggerDrink: () => {
        isDrinking = true;
        isEating = false;
        drinkTimer = 0;
        cupGroup.visible = true;
        snackGroup.visible = false; mealPlate.visible = false; fork.visible = false;
      },
      triggerEat: (dish: PlateDish = 'rice') => {
        isDrinking = true;
        isEating = true;
        drinkTimer = 0;
        cupGroup.visible = false;
        snackGroup.visible = false;
        setMealDish(dish); setFoodProgress(0); mealPlate.visible = true; fork.visible = true;
      },
      setSitting: (sitting: boolean, isSofa = false, isBarStool = false, seatHeight = 0.5175) => {
        isSeated = sitting;
        seatedHipHeight = seatHeight + 0.085;
        if (sitting) {
          hipGroup.position.y = seatedHipHeight;
          hipGroup.rotation.set(0, 0, 0);
          const thighAngle = isBarStool ? -1.1 : isSofa ? -1.45 : -Math.PI / 2;
          const shinAngle = 0;
          leftLegGroup.rotation.x = rightLegGroup.rotation.x = thighAngle;
          leftKneeGroup.rotation.x = rightKneeGroup.rotation.x = -thighAngle + shinAngle;
          const kneeHeight = seatedHipHeight - 0.4 * Math.cos(thighAngle);
          const shinScale = (kneeHeight - (isBarStool ? 0.25 : 0)) / (0.445 * Math.cos(shinAngle));
          leftKneeGroup.scale.y = rightKneeGroup.scale.y = shinScale;
          leftArmGroup.rotation.x = -Math.PI / 4;
          rightArmGroup.rotation.x = -Math.PI / 4;
          ring.visible = false;
        } else {
          hipGroup.position.y = 0.85; // Standing height
          leftLegGroup.rotation.x = 0;
          rightLegGroup.rotation.x = 0;
          leftKneeGroup.rotation.x = rightKneeGroup.rotation.x = 0;
          leftKneeGroup.scale.y = rightKneeGroup.scale.y = 1;
          leftArmGroup.rotation.x = 0;
          rightArmGroup.rotation.x = 0;
          ring.visible = true;
        }
      },
      updateAnimation: (time: number, isMoving: boolean = false, speedMultiplier: number = 1, isAirborne: boolean = false) => {
        const animDelta = lastAnimTime === 0 ? 0.016 : Math.min(0.04, Math.max(0.005, time - lastAnimTime));
        lastAnimTime = time;

        if (isSeated) {
          hipGroup.position.y = seatedHipHeight + Math.sin(time * 2) * 0.008;
        }

        // ================= DRINKING ANIMATION OVERRIDE =================
        if (isDrinking) {
          if (isEating) { leftArmGroup.rotation.x = -0.95; mealPlate.rotation.x = 0.95; }
          drinkTimer += animDelta;
          const progress = Math.min(1, drinkTimer / DRINK_DURATION);
          if (isEating) setFoodProgress(progress);

          if (progress >= 1) {
            isDrinking = false;
            cupGroup.visible = false;
            snackGroup.visible = false; mealPlate.visible = false; fork.visible = false;
            leftArmGroup.rotation.x = 0;
            headGroup.rotation.set(0, 0, 0);
            rightArmGroup.rotation.set(0, 0, 0);
          } else {
            // Phase 1 (0.0 to 0.25): Raise cup smoothly to mouth
            // Phase 2 (0.25 to 0.75): Tilt head back, sip with animated gulping bobs
            // Phase 3 (0.75 to 1.0): Lower cup back down
            if (progress < 0.25) {
              const t = progress / 0.25;
              const ease = Math.sin((t * Math.PI) / 2);
              rightArmGroup.rotation.x = -Math.PI * 0.72 * ease;
              rightArmGroup.rotation.z = -0.36 * ease;
              rightArmGroup.rotation.y = 0.28 * ease;
              headGroup.rotation.x = (isEating ? -0.06 : -0.22) * ease;
            } else if (progress < 0.75) {
              const sipT = (progress - 0.25) / 0.50;
              const sipBob = Math.sin(sipT * Math.PI * 10) * 0.038;
              rightArmGroup.rotation.x = -Math.PI * 0.75 + sipBob * 0.5;
              rightArmGroup.rotation.z = -0.38;
              rightArmGroup.rotation.y = 0.30;
              headGroup.rotation.x = (isEating ? -0.08 : -0.32) + sipBob;
            } else {
              const t = (progress - 0.75) / 0.25;
              const ease = 1 - Math.cos((t * Math.PI) / 2);
              rightArmGroup.rotation.x = -Math.PI * 0.72 * (1 - ease);
              rightArmGroup.rotation.z = -0.36 * (1 - ease);
              rightArmGroup.rotation.y = 0.28 * (1 - ease);
              headGroup.rotation.x = (isEating ? -0.06 : -0.22) * (1 - ease);
            }
            return;
          }
        }

        if (isSeated) return;
        if (isAirborne) {
          // Dynamic jumping pose: legs swing up, arms raise
          leftLegGroup.rotation.x = -0.45;
          rightLegGroup.rotation.x = -0.35;
          leftArmGroup.rotation.x = -0.6;
          rightArmGroup.rotation.x = -0.6;
          leftArmGroup.rotation.z = 0.25;
          rightArmGroup.rotation.z = -0.25;
          ring.scale.setScalar(0.7);
          return;
        }

        leftArmGroup.rotation.z = 0;
        rightArmGroup.rotation.z = 0;

        if (isMoving) {
          walkCycle += 15.5 * animDelta * speedMultiplier;

          // Silky smooth pendulum leg swing
          leftLegGroup.rotation.x = Math.sin(walkCycle) * 0.72;
          rightLegGroup.rotation.x = -Math.sin(walkCycle) * 0.72;
          leftKneeGroup.rotation.x = Math.max(0, -Math.sin(walkCycle) * 0.55);
          rightKneeGroup.rotation.x = Math.max(0, Math.sin(walkCycle) * 0.55);

          // Counter-phase Arm swing
          leftArmGroup.rotation.x = -Math.sin(walkCycle) * 0.65;
          rightArmGroup.rotation.x = Math.sin(walkCycle) * 0.65;

          // Natural Torso bounce & hip sway
          hipGroup.position.y = 0.85 + Math.abs(Math.sin(walkCycle * 2)) * 0.025;
          hipGroup.rotation.y = Math.sin(walkCycle) * 0.05;
          ring.scale.setScalar(1 + Math.sin(walkCycle * 2) * 0.08);
        } else {
          // Gentle idle breathing pose
          const idleTime = time * 2;
          leftLegGroup.rotation.x = 0;
          rightLegGroup.rotation.x = 0;
          leftKneeGroup.rotation.x = rightKneeGroup.rotation.x = 0;
          leftArmGroup.rotation.x = Math.sin(idleTime) * 0.04;
          rightArmGroup.rotation.x = -Math.sin(idleTime) * 0.04;
          hipGroup.position.y = 0.85 + Math.sin(idleTime) * 0.012;
          hipGroup.rotation.y = 0;
          ring.scale.setScalar(1 + Math.sin(idleTime) * 0.03);
        }
      },
      lookAt: (target: THREE.Vector3) => {
        group.lookAt(target.x, group.position.y, target.z);
      }
    };
  }

  /**
   * Creates an employee block character capable of sitting at desk, walking with velocity-synced stride,
   * taking breaks in the canteen, and displaying an ULTRA-HIGH CONTRAST BILLBOARD.
   */
  public static createEmployeeAvatar(emp: any): CharacterMeshController & { billboard: THREE.Mesh; setHoldingProp?: (prop: 'none' | 'coffee_cup' | 'snack_bar' | 'meal_plate', dish?: PlateDish) => void } {
    const group = new THREE.Group();

    const isCEO = emp.id === 'ameen';
    const chairLocalZ = isCEO ? 1.05 : 0.75;
    const worldX = emp.deskPosition[0] + Math.sin(emp.deskRotation) * chairLocalZ;
    const worldZ = emp.deskPosition[2] + Math.cos(emp.deskRotation) * chairLocalZ;

    group.position.set(worldX, 0, worldZ);
    group.rotation.y = emp.deskRotation + Math.PI;

    // Materials per employee colors
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emp.avatarColors.skin),
      roughness: 0.5,
      metalness: 0.05
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emp.avatarColors.hair),
      roughness: 0.7,
      metalness: 0.1
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emp.avatarColors.shirt),
      roughness: 0.45,
      metalness: 0.1
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emp.avatarColors.pants),
      roughness: 0.6,
      metalness: 0.05
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emp.avatarColors.accent),
      roughness: 0.3,
      metalness: 0.4
    });

    // Hip container (seated height: CEO 0.62m, employees 0.52m; standing height: CEO 0.88m, employees 0.85m)
    const hipGroup = new THREE.Group();
    hipGroup.position.y = isCEO ? 0.62 : 0.52;
    group.add(hipGroup);

    // Block Torso: CEO Ameen is stout, broad-shouldered, and noticeably fatter with prominent presence
    const torsoW = isCEO ? 1.04 : 0.44;
    const torsoH = isCEO ? 0.62 : 0.48;
    const torsoD = isCEO ? 0.44 : 0.28;
    const torsoGeo = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = isCEO ? 0.28 : 0.24;
    torso.castShadow = true;
    hipGroup.add(torso);

    // Department-Specific Attire Details
    if (isCEO) {
      // Broader silhouette with a rounded belly, kept behind the existing tabletop edge.
      const bellyGeo = new THREE.SphereGeometry(1, 16, 12);
      bellyGeo.scale(0.61, 0.34, 0.23);
      const belly = new THREE.Mesh(bellyGeo, shirtMat);
      belly.position.set(0, 0.26, 0);
      belly.castShadow = true;
      hipGroup.add(belly);

      // Executive dark leather belt stretched around belly
      const beltGeo = new THREE.BoxGeometry(1.08, 0.10, 0.44);
      const belt = new THREE.Mesh(
        beltGeo,
        new THREE.MeshStandardMaterial({ color: 0x090D1A, roughness: 0.3 })
      );
      belt.position.set(0, 0.16, 0);
      hipGroup.add(belt);

      // Gleaming luxury gold belt buckle
      const buckleGeo = new THREE.BoxGeometry(0.22, 0.11, 0.04);
      const buckleMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.95,
        roughness: 0.15
      });
      const buckle = new THREE.Mesh(buckleGeo, buckleMat);
      buckle.position.set(0, 0.11, 0.205);
      hipGroup.add(buckle);

      // Executive gold silk tie draped over the shirt front
      const tieGeo = new THREE.BoxGeometry(0.12, 0.26, 0.02);
      const tie = new THREE.Mesh(tieGeo, accentMat);
      tie.position.set(0, 0.37, 0.235);
      hipGroup.add(tie);

      // Crisp white dress shirt collar
      const collar = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.06, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
      );
      collar.position.set(0, 0.54, 0.08);
      hipGroup.add(collar);
    } else {
      // Verlyn ID Lanyard & Badge
      const badgeGeo = new THREE.BoxGeometry(0.08, 0.11, 0.01);
      const badge = new THREE.Mesh(
        badgeGeo,
        new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.2 })
      );
      badge.position.set(0, 0.24, 0.145);
      hipGroup.add(badge);

      const strapGeo = new THREE.BoxGeometry(0.02, 0.20, 0.012);
      const strap = new THREE.Mesh(strapGeo, accentMat);
      strap.position.set(0, 0.38, 0.145);
      hipGroup.add(strap);
    }

    // Head Container
    const headGroup = new THREE.Group();
    headGroup.position.set(0, isCEO ? 0.62 : 0.54, 0);
    hipGroup.add(headGroup);

    // Bespoke expressive face per employee personality
    let eyeColor = '#1E293B';
    let hasGlasses = false;
    let glassesColor = '#0284C7';
    let hasFacialHair = false;
    let expression: 'confident' | 'friendly' | 'analytical' | 'executive' = 'friendly';

    if (emp.id === 'adhi') {
      eyeColor = '#0284C7';
      hasGlasses = true;
      glassesColor = '#0284C7';
      expression = 'analytical';
    } else if (emp.id === 'abbu') {
      eyeColor = '#0D9488';
      expression = 'friendly';
    } else if (emp.id === 'prox') {
      eyeColor = '#6366F1';
      hasGlasses = true;
      glassesColor = '#6366F1';
      expression = 'analytical';
    } else if (emp.id === 'vaibav') {
      eyeColor = '#7C3AED';
      expression = 'confident';
    } else if (emp.id === 'taha') {
      eyeColor = '#2563EB';
      expression = 'analytical';
    } else if (emp.id === 'rewaant') {
      eyeColor = '#059669';
      expression = 'confident';
    } else if (emp.id === 'ameen') {
      eyeColor = '#B45309';
      hasFacialHair = true;
      expression = 'executive';
    }

    const faceTexture = OfficeTextureGenerator.getCharacterFaceTexture({
      skinColor: emp.avatarColors.skin,
      hairColor: emp.avatarColors.hair,
      eyeColor,
      hasGlasses,
      glassesColor,
      hasFacialHair,
      expression
    });

    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.45,
      metalness: 0.05
    });

    const headMaterials = [
      skinMat, // +X (Right)
      skinMat, // -X (Left)
      skinMat, // +Y (Top)
      skinMat, // -Y (Bottom)
      faceMat, // +Z (Front Face!)
      skinMat  // -Z (Back)
    ];

    const headW = isCEO ? 0.36 : 0.26;
    const headH = isCEO ? 0.32 : 0.26;
    const headD = isCEO ? 0.36 : 0.26;
    const headGeo = new THREE.BoxGeometry(headW, headH, headD);
    const head = new THREE.Mesh(headGeo, headMaterials);
    head.position.y = isCEO ? 0.18 : 0.16;
    head.castShadow = true;
    headGroup.add(head);

    // CEO Executive Double Chin & Jolly Jowls (stout, jovial, and hearty)
    if (isCEO) {
      const jowlGeo = new THREE.BoxGeometry(0.32, 0.10, 0.14);
      const jowl = new THREE.Mesh(jowlGeo, skinMat);
      jowl.position.set(0, 0.03, 0.14);
      headGroup.add(jowl);
    }

    // Employee Block Hair
    const hairGeo = new THREE.BoxGeometry(headW + 0.02, 0.10, headD + 0.02);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = isCEO ? 0.28 : 0.24;
    headGroup.add(hair);

    // Arms
    const armW = isCEO ? 0.27 : 0.11;
    const armH = isCEO ? 0.46 : 0.40;
    const armD = isCEO ? 0.20 : 0.11;
    const armGeo = new THREE.BoxGeometry(armW, armH, armD);
    const armSpacingX = isCEO ? 0.65 : 0.25;

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-armSpacingX, isCEO ? 0.58 : 0.42, 0);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(0, -0.16, 0);
    leftArmGroup.add(leftArm);

    // Luxury gold wristwatch on CEO's left wrist
    if (isCEO) {
      const watchGeo = new THREE.BoxGeometry(0.22, 0.06, 0.22);
      const watch = new THREE.Mesh(watchGeo, accentMat);
      watch.position.set(0, -0.22, 0);
      leftArmGroup.add(watch);
    }
    hipGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(armSpacingX, isCEO ? 0.58 : 0.42, 0);
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0, -0.16, 0);
    rightArmGroup.add(rightArm);
    hipGroup.add(rightArmGroup);

    // Hand Props (Ceramic Artisan Coffee Mug / Snack) attached to Right Arm
    const cupGroup = new THREE.Group();
    cupGroup.position.set(0, -0.28, 0.12);

    // Ceramic Mug Body
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.15,
      metalness: 0.05
    });
    const cupMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.08, 16), ceramicMat);
    cupMesh.castShadow = true;
    cupGroup.add(cupMesh);

    // Ceramic Mug Handle
    const handleGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16, Math.PI);
    const handleMesh = new THREE.Mesh(handleGeo, ceramicMat);
    handleMesh.rotation.y = -Math.PI / 2;
    handleMesh.rotation.z = Math.PI / 2;
    handleMesh.position.set(0, 0, 0.046);
    cupGroup.add(handleMesh);

    // Dark Espresso Crema Liquid Fill
    const coffeeMat = new THREE.MeshStandardMaterial({
      color: 0x3E1E09,
      roughness: 0.2
    });
    const coffeeFill = new THREE.Mesh(new THREE.CircleGeometry(0.040, 16), coffeeMat);
    coffeeFill.rotation.x = -Math.PI / 2;
    coffeeFill.position.y = 0.038;
    coffeeFill.userData.isDynamic = true;
    cupGroup.add(coffeeFill);

    cupGroup.visible = false;
    rightArmGroup.add(cupGroup);

    // Foil-Wrapped Organic Energy Snack Bar
    const snackGroup = new THREE.Group();
    snackGroup.position.set(0, -0.28, 0.10);

    // Emerald Metallic Foil Wrapper (partially peeled)
    const wrapperMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      metalness: 0.85,
      roughness: 0.20
    });
    const wrapperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.035), wrapperMat);
    wrapperMesh.castShadow = true;
    snackGroup.add(wrapperMesh);

    // Gold decorative branding band
    const goldBandMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.9,
      roughness: 0.2
    });
    const goldBand = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.03, 0.038), goldBandMat);
    goldBand.position.y = -0.01;
    snackGroup.add(goldBand);

    // Exposed Roasted Almond & Oat Bar (top half exposed)
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x92400E,
      roughness: 0.85
    });
    const barMesh = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.028), barMat);
    barMesh.position.y = 0.065;
    snackGroup.add(barMesh);

    snackGroup.visible = false;
    rightArmGroup.add(snackGroup);

    const mealPlate = new THREE.Group(); mealPlate.name = 'Held meal plate';
    mealPlate.position.set(0, -armH + 0.05, 0.26); mealPlate.visible = false; leftArmGroup.add(mealPlate);
    let mealDish: PlateDish | null = null;
    const setMealDish = (dish: PlateDish = 'rice') => {
      if (mealDish === dish) return;
      mealPlate.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(mat => { if (!mat.userData.sharedFoodMaterial) mat.dispose(); }); } });
      mealPlate.clear(); mealPlate.add(createFoodPlate(dish)); mealDish = dish;
    };
    const setFoodProgress = (progress: number) => {
      const food = mealPlate.children[0];
      food?.children.slice(2).forEach(piece => {
        if (piece.userData.servedScaleY === undefined) piece.userData.servedScaleY = piece.scale.y;
        piece.scale.y = piece.userData.servedScaleY * Math.max(0.02, 1 - progress);
        piece.visible = progress < 1;
      });
    };
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.009), new THREE.MeshStandardMaterial({ color: 0xB8B8AA, metalness: 0.7, roughness: 0.3 }));
    fork.position.set(0, -0.36, 0.12); fork.visible = false; fork.userData.isDynamic = true; rightArmGroup.add(fork);
    // Articulated Legs (Hip Joint -> Thigh -> Knee Joint -> Shin -> Shoe with Rubber Sole)
    const legW = isCEO ? 0.27 : 0.15;
    const legSpacingX = isCEO ? 0.24 : 0.13;
    const thighH = isCEO ? 0.42 : 0.40;
    const shinH = isCEO ? 0.37 : 0.36;
    const footH = 0.065;
    const footL = isCEO ? 0.28 : 0.24;
    const footW = legW * 1.08;

    const shoeMat = new THREE.MeshStandardMaterial({
      color: isCEO ? 0x2A1810 : 0x0F172A,
      roughness: 0.35,
      metalness: 0.15
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8
    });

    // Left Leg Group
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-legSpacingX, 0, 0);

    const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(legW, thighH, legW * 1.05), pantsMat);
    leftThigh.position.y = -thighH / 2;
    leftThigh.castShadow = true;
    leftLegGroup.add(leftThigh);

    const leftKneeGroup = new THREE.Group();
    leftKneeGroup.name = 'Employee left knee';
    leftKneeGroup.position.set(0, -thighH, 0);

    const leftShin = new THREE.Mesh(new THREE.BoxGeometry(legW * 0.95, shinH, legW * 0.95), pantsMat);
    leftShin.position.y = -shinH / 2;
    leftShin.castShadow = true;
    leftKneeGroup.add(leftShin);

    // Left Shoe
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(footW, footH, footL), shoeMat);
    leftShoe.position.set(0, -shinH - footH / 2 + 0.01, footL * 0.22);
    leftShoe.castShadow = true;
    leftKneeGroup.add(leftShoe);

    // Left Rubber Sole
    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(footW * 1.04, 0.018, footL * 1.02), soleMat);
    leftSole.position.set(0, -shinH - footH + 0.009, footL * 0.22);
    leftKneeGroup.add(leftSole);

    leftLegGroup.add(leftKneeGroup);
    hipGroup.add(leftLegGroup);

    // Right Leg Group
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(legSpacingX, 0, 0);

    const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(legW, thighH, legW * 1.05), pantsMat);
    rightThigh.position.y = -thighH / 2;
    rightThigh.castShadow = true;
    rightLegGroup.add(rightThigh);

    const rightKneeGroup = new THREE.Group();
    rightKneeGroup.name = 'Employee right knee';
    rightKneeGroup.position.set(0, -thighH, 0);

    const rightShin = new THREE.Mesh(new THREE.BoxGeometry(legW * 0.95, shinH, legW * 0.95), pantsMat);
    rightShin.position.y = -shinH / 2;
    rightShin.castShadow = true;
    rightKneeGroup.add(rightShin);

    // Right Shoe
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(footW, footH, footL), shoeMat);
    rightShoe.position.set(0, -shinH - footH / 2 + 0.01, footL * 0.22);
    rightShoe.castShadow = true;
    rightKneeGroup.add(rightShoe);

    // Right Rubber Sole
    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(footW * 1.04, 0.018, footL * 1.02), soleMat);
    rightSole.position.set(0, -shinH - footH + 0.009, footL * 0.22);
    rightKneeGroup.add(rightSole);

    rightLegGroup.add(rightKneeGroup);
    hipGroup.add(rightLegGroup);

    // ================= CRISP 2K ULTRA-HD BILLBOARD (2048 x 768) =================
    const billboardCanvas = document.createElement('canvas');
    billboardCanvas.width = 2048;
    billboardCanvas.height = 768;
    const bCtx = billboardCanvas.getContext('2d')!;

    bCtx.imageSmoothingEnabled = true;
    bCtx.imageSmoothingQuality = 'high';

    // Solid dark slate background
    bCtx.fillStyle = '#090D1A';
    bCtx.beginPath();
    bCtx.roundRect(16, 16, 2016, 736, 56);
    bCtx.fill();

    // Bold neon accent border
    bCtx.strokeStyle = emp.avatarColors.accent;
    bCtx.lineWidth = 16;
    bCtx.beginPath();
    bCtx.roundRect(16, 16, 2016, 736, 56);
    bCtx.stroke();

    // Accent block on left edge
    bCtx.fillStyle = emp.avatarColors.accent;
    bCtx.beginPath();
    bCtx.roundRect(32, 32, 32, 704, 16);
    bCtx.fill();

    // Employee Full Name
    bCtx.fillStyle = '#FFFFFF';
    bCtx.font = '900 136px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    bCtx.fillText(emp.name, 110, 210);

    // Department Badge
    bCtx.fillStyle = emp.avatarColors.accent;
    bCtx.beginPath();
    bCtx.roundRect(110, 260, 940, 96, 28);
    bCtx.fill();

    bCtx.fillStyle = '#000000';
    bCtx.font = 'bold 46px monospace';
    bCtx.fillText(`[ ${(emp.departmentName || emp.roomName).toUpperCase()} ]`, 140, 326);

    // Title / Enterprise Role
    bCtx.fillStyle = '#F8FAFC';
    bCtx.font = '700 66px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    bCtx.fillText(emp.role || emp.title, 110, 470);

    // Live AI Connection Status Pill
    bCtx.fillStyle = '#10B981';
    bCtx.beginPath();
    bCtx.roundRect(110, 550, 840, 108, 30);
    bCtx.fill();

    bCtx.fillStyle = '#000000';
    bCtx.font = '900 48px monospace';
    bCtx.fillText('● OPENROUTER AI CONNECTED', 150, 624);

    // Interactive Action Block
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    bCtx.beginPath();
    bCtx.roundRect(1560, 260, 420, 390, 36);
    bCtx.fill();

    bCtx.fillStyle = '#38BDF8';
    bCtx.font = 'bold 44px monospace';
    bCtx.textAlign = 'center';
    bCtx.fillText('PRESS [E]', 1770, 390);
    bCtx.fillStyle = '#FFFFFF';
    bCtx.font = '600 36px sans-serif';
    bCtx.fillText('TO TALK', 1770, 460);
    bCtx.fillStyle = '#F59E0B';
    bCtx.font = 'bold 32px monospace';
    bCtx.fillText('[F] SIT DOWN', 1770, 540);
    bCtx.textAlign = 'left';

    const bbTex = new THREE.CanvasTexture(billboardCanvas);
    bbTex.generateMipmaps = false;
    bbTex.minFilter = THREE.LinearFilter;
    bbTex.magFilter = THREE.LinearFilter;
    bbTex.anisotropy = 16;
    bbTex.needsUpdate = true;

    const bbGeo = new THREE.PlaneGeometry(2.1, 0.78);
    // Note: FrontSide guarantees the text is only seen from the front, never inverted/mirrored
    const bbMat = new THREE.MeshBasicMaterial({
      map: bbTex,
      side: THREE.FrontSide,
      transparent: true
    });
    const billboard = new THREE.Mesh(bbGeo, bbMat);
    // Positioned overhead so employee face is 100% visible
    billboard.position.set(0, isCEO ? 2.85 : 2.55, 0.15);
    group.add(billboard);

    // Pulsing interaction beacon ring under character
    const beaconGeo = new THREE.RingGeometry(0.72, 0.82, 32);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(emp.avatarColors.accent),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.rotation.x = -Math.PI / 2;
    beacon.position.y = 0.02;
    group.add(beacon);

    const seed = Math.random() * 10;
    let isTalking = false;
    let talkBlend = 0;
    let isSeated = true;
    let isSofaSeat = false;
    let isBarStoolSeat = false;
    let seatedHipHeight = 0.5175 + legW * 1.05 / 2;
    let walkCycle = 0;
    let lastAnimTime = 0;

    // Apply exact seated pose depending on furniture type (sofa vs bar stool vs desk chair)
    const applySeatedPose = (seated: boolean, isSofa = false, isBarStool = false, seatHeight = 0.5175) => {
      isSeated = seated;
      isSofaSeat = isSofa;
      isBarStoolSeat = isBarStool;

      hipGroup.rotation.set(0, 0, 0);
      headGroup.rotation.set(0, 0, 0);
      if (seated) {
        // Keep thighs above the cushion and soles on the floor or stool footrest.
        seatedHipHeight = seatHeight + legW * 1.05 / 2 * (isCEO ? 0.70 : 1);
        leftThigh.scale.z = rightThigh.scale.z = isCEO ? 0.70 : 1;
        hipGroup.position.y = seatedHipHeight;
        const thighAngle = isBarStool ? -1.1 : isSofa ? -1.45 : -Math.PI / 2;
        const shinAngle = 0;
        leftLegGroup.rotation.x = rightLegGroup.rotation.x = thighAngle;
        leftKneeGroup.rotation.x = rightKneeGroup.rotation.x = -thighAngle + shinAngle;
        const kneeHeight = seatedHipHeight - thighH * Math.cos(thighAngle);
        const shinScale = (kneeHeight - (isBarStool ? 0.25 : 0)) / ((shinH + footH) * Math.cos(shinAngle));
        leftKneeGroup.scale.y = rightKneeGroup.scale.y = shinScale;
      } else {
        // Standing height: thighs (0.40m) + shins (0.36m) + shoes (0.065m) = 0.82m (soles rest perfectly on floor)
        hipGroup.position.y = isCEO ? 0.85 : 0.82;
        leftLegGroup.rotation.x = 0;
        rightLegGroup.rotation.x = 0;
        leftKneeGroup.rotation.x = 0;
        rightKneeGroup.rotation.x = 0;
        leftKneeGroup.scale.y = rightKneeGroup.scale.y = 1;
        leftThigh.scale.z = rightThigh.scale.z = 1;
      }
    };
    applySeatedPose(true, false, false);

    GeometryBatcher.batchAnimatedParts(group);

    return {
      group,
      billboard,
      setTalking: (talking: boolean) => {
        isTalking = talking;
      },
      setSitting: (sitting: boolean, isSofa = false, isBarStool = false, seatHeight = 0.5175) => {
        applySeatedPose(sitting, isSofa, isBarStool, seatHeight);
      },
      setMealProgress: (progress: number) => { setFoodProgress(progress); coffeeFill.position.y = 0.038 - Math.min(1, progress) * 0.06; },
      setHoldingProp: (prop: 'none' | 'coffee_cup' | 'snack_bar' | 'meal_plate', dish?: PlateDish) => {
        cupGroup.visible = prop === 'coffee_cup';
        snackGroup.visible = prop === 'snack_bar';
        mealPlate.visible = prop === 'meal_plate'; fork.visible = prop === 'meal_plate';
        if (prop === 'meal_plate') { setMealDish(dish); setFoodProgress(0); }
        if (prop === 'coffee_cup') coffeeFill.position.y = 0.038;
      },
      updateAnimation: (time: number, isMoving = false, speedMultiplier = 1.0) => {
        const animDelta = lastAnimTime === 0 ? 0.016 : Math.min(0.04, Math.max(0.005, time - lastAnimTime));
        lastAnimTime = time;
        const t = time + seed;

        talkBlend += ((isTalking ? 1 : 0) - talkBlend) * 0.12;

        // Realistic procedural coffee drinking / sipping cycle when holding a cup
        let sipArmAngle = -0.70;
        let sipHeadAngle = 0;
        let isSipping = false;

        if (cupGroup.visible && isSeated) {
          const sipPeriod = 5.5; // sip every 5.5 seconds
          const sipPhase = (time + seed * 2) % sipPeriod;
          if (sipPhase < 1.1) {
            // Raising cup to mouth
            const p = sipPhase / 1.1;
            const ease = Math.sin((p * Math.PI) / 2);
            sipArmAngle = -0.70 - 0.65 * ease; // lifts smoothly to -1.35 rad (mouth level)
            sipHeadAngle = 0.12 * ease;
            isSipping = true;
          } else if (sipPhase < 2.2) {
            // Savoring coffee at mouth
            sipArmAngle = -1.35;
            sipHeadAngle = 0.12;
            isSipping = true;
          } else if (sipPhase < 3.2) {
            // Lowering cup back down
            const p = (sipPhase - 2.2) / 1.0;
            const ease = 1 - Math.sin((p * Math.PI) / 2);
            sipArmAngle = -0.70 - 0.65 * ease;
            sipHeadAngle = 0.12 * ease;
            isSipping = true;
          } else {
            // Resting cup upright
            sipArmAngle = isSeated ? -0.80 : -0.70;
            sipHeadAngle = 0;
            isSipping = false;
          }
        }

        // Realistic procedural snacking / eating cycle when holding an energy bar
        let snackArmAngle = -0.70;
        let snackHeadAngle = 0;
        let isEating = false;

        if (snackGroup.visible) {
          const eatPeriod = 4.6; // eat cycle every 4.6 seconds
          const eatPhase = (time + seed * 2.3) % eatPeriod;
          if (eatPhase < 1.0) {
            // Raising snack bar to mouth
            const p = eatPhase / 1.0;
            const ease = Math.sin((p * Math.PI) / 2);
            snackArmAngle = -0.70 - 0.55 * ease; // lifts smoothly to -1.25 rad
            snackHeadAngle = 0.14 * ease;
            isEating = true;
          } else if (eatPhase < 2.2) {
            // Taking a bite + gentle chewing head nods
            snackArmAngle = -1.25;
            snackHeadAngle = 0.14 + Math.sin(time * 9) * 0.025;
            isEating = true;
          } else if (eatPhase < 3.2) {
            // Lowering snack back down
            const p = (eatPhase - 2.2) / 1.0;
            const ease = 1 - Math.sin((p * Math.PI) / 2);
            snackArmAngle = -0.70 - 0.55 * ease;
            snackHeadAngle = 0.14 * ease;
            isEating = true;
          } else {
            // Resting bar & chewing peacefully
            snackArmAngle = isSeated ? -0.80 : -0.70;
            snackHeadAngle = Math.sin(time * 6) * 0.015;
            isEating = false;
          }
        }

        if (isSeated) {
          // SEATED ANIMATIONS
          hipGroup.rotation.set(0, 0, 0);
          hipGroup.position.y = seatedHipHeight + (1 + Math.sin(t * 1.8)) * 0.002;

          if (mealPlate.visible) {
            leftArmGroup.rotation.x = -0.95;
            rightArmGroup.rotation.x = -1.1 + Math.sin(t * 2) * 0.22;
            headGroup.rotation.x = 0.08 + Math.sin(t * 2) * 0.025;
          } else if (cupGroup.visible) {
            // Holding and visibly sipping coffee while seated
            rightArmGroup.rotation.x = sipArmAngle;
            headGroup.rotation.x = 0.05 + sipHeadAngle;
            leftArmGroup.rotation.x = -0.65 + Math.sin(t * 1.5) * 0.04;
          } else if (snackGroup.visible) {
            // Holding and visibly eating snack while seated
            rightArmGroup.rotation.x = snackArmAngle;
            headGroup.rotation.x = 0.05 + snackHeadAngle;
            leftArmGroup.rotation.x = -0.65 + Math.sin(t * 1.5) * 0.04;
          } else if (talkBlend > 0.01) {
            headGroup.rotation.y = Math.sin(t * 3.5) * 0.18 * talkBlend;
            headGroup.rotation.x = 0.08 + Math.abs(Math.sin(t * 4)) * 0.12 * talkBlend;
            leftArmGroup.rotation.x = -Math.PI / 4 + Math.sin(t * 4.5) * 0.22 * talkBlend;
            rightArmGroup.rotation.x = -Math.PI / 4 + Math.cos(t * 5.0) * 0.24 * talkBlend;
          } else {
            // Working at desk (typing, looking at monitors)
            leftArmGroup.rotation.x = -Math.PI / 4 + Math.sin(t * 8) * 0.06;
            rightArmGroup.rotation.x = -Math.PI / 4 + Math.cos(t * 9) * 0.06;
            headGroup.rotation.y = Math.sin(t * 0.7) * 0.12;
            headGroup.rotation.x = 0.08 + Math.sin(t * 1.4) * 0.04;
          }
        } else {
          // STANDING & WALKING LOCOMOTION
          if (isMoving) {
            walkCycle += 15.5 * animDelta * speedMultiplier;

            leftLegGroup.rotation.x = Math.sin(walkCycle) * 0.72;
            rightLegGroup.rotation.x = -Math.sin(walkCycle) * 0.72;
            // Natural human knee bend on backswing
            leftKneeGroup.rotation.x = Math.max(0, -Math.sin(walkCycle) * 0.55);
            rightKneeGroup.rotation.x = Math.max(0, Math.sin(walkCycle) * 0.55);

            leftArmGroup.rotation.x = -Math.sin(walkCycle) * 0.65;
            const rightHoldAngle = cupGroup.visible ? sipArmAngle : (snackGroup.visible ? snackArmAngle : Math.sin(walkCycle) * 0.65);
            rightArmGroup.rotation.x = rightHoldAngle;

            hipGroup.position.y = (isCEO ? 0.85 : 0.82) + Math.abs(Math.sin(walkCycle * 2)) * 0.025;
            hipGroup.rotation.y = Math.sin(walkCycle) * 0.05;
          } else {
            // Standing Idle (at coffee machine, snack shelf, or corridor)
            const idleTime = t * 2;
            leftLegGroup.rotation.x = 0;
            rightLegGroup.rotation.x = 0;
            leftKneeGroup.rotation.x = 0;
            rightKneeGroup.rotation.x = 0;

            leftArmGroup.rotation.x = Math.sin(idleTime) * 0.04;
            const rightHoldAngle = cupGroup.visible ? sipArmAngle : (snackGroup.visible ? snackArmAngle : -Math.sin(idleTime) * 0.04);
            rightArmGroup.rotation.x = rightHoldAngle;
            hipGroup.position.y = (isCEO ? 0.85 : 0.82) + Math.sin(idleTime) * 0.01;
            hipGroup.rotation.y = 0;

            if (isSipping) {
              headGroup.rotation.x = 0.05 + sipHeadAngle;
            } else if (isEating) {
              headGroup.rotation.x = 0.05 + snackHeadAngle;
            } else if (talkBlend > 0.01) {
              headGroup.rotation.y = Math.sin(t * 3.5) * 0.18 * talkBlend;
              headGroup.rotation.x = 0.08 + Math.abs(Math.sin(t * 4)) * 0.12 * talkBlend;
            }
          }
        }

        beacon.scale.setScalar(1 + Math.sin(t * 2.5) * 0.05);
        if (mealPlate.visible) {
          if (!isSeated) leftArmGroup.rotation.x = -0.95;
          mealPlate.rotation.x = -leftArmGroup.rotation.x;
        }
        if (cupGroup.visible && !isSeated) cupGroup.rotation.x = -rightArmGroup.rotation.x;
        else cupGroup.rotation.x = 0;
      },
      lookAt: (target: THREE.Vector3) => {
        group.lookAt(target.x, group.position.y, target.z);
      }
    };
  }
}
