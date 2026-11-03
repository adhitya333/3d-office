import * as THREE from 'three';
import { CollisionManager } from './CollisionManager';
import { SoundEffects } from '../../services/audio';
import { OFFICE_CONFIG, AutoDoorConfig } from '../../config/office.config';

export interface InteractiveDoor {
  id: string;
  name: string;
  roomName: string;
  type: 'sliding' | 'swing';
  position: [number, number, number]; // center of doorway
  isOpen: boolean;
  currentAngle: number;
  targetAngle: number;
  currentSlide: number;
  targetSlide: number;
  leftHinge: THREE.Group;
  rightHinge: THREE.Group;
  leftLeaf: THREE.Group;
  rightLeaf: THREE.Group;
  indicator: THREE.Mesh;
  orientation: 'alongZ' | 'alongX';
  sensorRadius: number;
  holdTimer: number; // seconds remaining before closing after zone is empty
  swingDirection: number; // 1 or -1
  isAutoTriggered?: boolean; // true if opened by an autonomous NPC
  leafHalfWidth?: number; // half width of a single door leaf for sliding doors
}

export class DoorManager {
  public group: THREE.Group;
  public doors: InteractiveDoor[] = [];
  private collisionManager: CollisionManager;

  // Shared reusable materials
  private frameMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private handleMat: THREE.MeshStandardMaterial;

  constructor(collisionManager: CollisionManager) {
    this.group = new THREE.Group();
    this.collisionManager = collisionManager;

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0x18181B,
      roughness: 0.35,
      metalness: 0.85
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x93C5FD,
      transparent: true,
      opacity: 0.55,
      roughness: 0.20,
      metalness: 0.2
    });

    this.handleMat = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.1,
      metalness: 0.95
    });

    this.initDoors();
  }

  private initDoors() {
    OFFICE_CONFIG.doors.forEach(cfg => {
      if (cfg.type === 'sliding') {
        this.buildSlidingDoor(cfg);
      } else {
        this.buildSwingDoor(cfg);
      }
    });
  }

  private buildSwingDoor(cfg: AutoDoorConfig) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(cfg.x, 0, cfg.z);
    this.group.add(doorGroup);

    const doorWidth = 1.34; // Each swing leaf is 1.34m wide along Z
    const doorHeight = 2.65;
    const doorThickness = 0.055;

    const frostedBandMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88
    });

    // In local swing leaf space:
    // X is door thickness (0.022m - 0.055m)
    // Y is door height (2.65m)
    // Z is door width along the corridor wall opening (1.34m)
    const glassGeo = new THREE.BoxGeometry(doorThickness * 0.4, doorHeight - 0.12, doorWidth - 0.12);
    const bandGeo = new THREE.BoxGeometry(doorThickness * 0.45, 0.48, doorWidth - 0.10);
    const stileGeo = new THREE.BoxGeometry(doorThickness, doorHeight, 0.055);
    const railGeo = new THREE.BoxGeometry(doorThickness, 0.055, doorWidth);

    // 1. Left Door Leaf (Hinge at Z - 1.36)
    const leftHinge = new THREE.Group();
    leftHinge.position.set(0, 0, -1.36);
    doorGroup.add(leftHinge);

    const leftLeaf = new THREE.Group();
    leftLeaf.position.set(0, doorHeight / 2, doorWidth / 2);
    leftHinge.add(leftLeaf);

    const leftGlass = new THREE.Mesh(glassGeo, this.glassMat);
    leftGlass.castShadow = true;
    leftLeaf.add(leftGlass);

    const leftBand = new THREE.Mesh(bandGeo, frostedBandMat);
    leftBand.position.y = 0.05;
    leftLeaf.add(leftBand);

    // Inner meeting stile (at Z = +doorWidth/2 - 0.028)
    const leftStileInner = new THREE.Mesh(stileGeo, this.frameMat);
    leftStileInner.position.set(0, 0, doorWidth / 2 - 0.028);
    leftLeaf.add(leftStileInner);

    // Outer hinge stile (at Z = -doorWidth/2 + 0.028)
    const leftStileOuter = new THREE.Mesh(stileGeo, this.frameMat);
    leftStileOuter.position.set(0, 0, -doorWidth / 2 + 0.028);
    leftLeaf.add(leftStileOuter);

    const railTopL = new THREE.Mesh(railGeo, this.frameMat);
    railTopL.position.set(0, doorHeight / 2 - 0.028, 0);
    leftLeaf.add(railTopL);

    const railBotL = new THREE.Mesh(railGeo, this.frameMat);
    railBotL.position.set(0, -doorHeight / 2 + 0.028, 0);
    leftLeaf.add(railBotL);

    // Handles: vertical tubular pull bars placed at the inner meeting stile
    [-1, 1].forEach(side => {
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 16);
      const handle = new THREE.Mesh(handleGeo, this.handleMat);
      handle.position.set(side * 0.045, 0.05, doorWidth / 2 - 0.09);
      leftLeaf.add(handle);
    });

    // 2. Right Door Leaf (Hinge at Z + 1.36)
    const rightHinge = new THREE.Group();
    rightHinge.position.set(0, 0, 1.36);
    doorGroup.add(rightHinge);

    const rightLeaf = new THREE.Group();
    rightLeaf.position.set(0, doorHeight / 2, -doorWidth / 2);
    rightHinge.add(rightLeaf);

    const rightGlass = new THREE.Mesh(glassGeo, this.glassMat);
    rightGlass.castShadow = true;
    rightLeaf.add(rightGlass);

    const rightBand = new THREE.Mesh(bandGeo, frostedBandMat);
    rightBand.position.y = 0.05;
    rightLeaf.add(rightBand);

    // Inner meeting stile (at Z = -doorWidth/2 + 0.028)
    const rightStileInner = new THREE.Mesh(stileGeo, this.frameMat);
    rightStileInner.position.set(0, 0, -doorWidth / 2 + 0.028);
    rightLeaf.add(rightStileInner);

    // Outer hinge stile (at Z = +doorWidth/2 - 0.028)
    const rightStileOuter = new THREE.Mesh(stileGeo, this.frameMat);
    rightStileOuter.position.set(0, 0, doorWidth / 2 - 0.028);
    rightLeaf.add(rightStileOuter);

    const railTopR = new THREE.Mesh(railGeo, this.frameMat);
    railTopR.position.set(0, doorHeight / 2 - 0.028, 0);
    rightLeaf.add(railTopR);

    const railBotR = new THREE.Mesh(railGeo, this.frameMat);
    railBotR.position.set(0, -doorHeight / 2 + 0.028, 0);
    rightLeaf.add(railBotR);

    // Handles: vertical tubular pull bars placed at the inner meeting stile
    [-1, 1].forEach(side => {
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 16);
      const handle = new THREE.Mesh(handleGeo, this.handleMat);
      handle.position.set(side * 0.045, 0.05, -doorWidth / 2 + 0.09);
      rightLeaf.add(handle);
    });

    // Floor threshold
    const thresh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 2.76), this.frameMat);
    thresh.position.set(0, 0.01, 0);
    doorGroup.add(thresh);

    // Indicator ring
    const ringGeo = new THREE.RingGeometry(0.45, 0.58, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const indicator = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: cfg.accentColor, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    indicator.position.set(0, 0.025, 0);
    doorGroup.add(indicator);

    // Initial closed collision box
    const boxLabel = `Door-${cfg.id}`;
    this.collisionManager.addBox(
      cfg.x - 0.25,
      cfg.x + 0.25,
      cfg.z - 1.4,
      cfg.z + 1.4,
      boxLabel,
      0,
      3.2
    );

    this.doors.push({
      id: cfg.id,
      name: cfg.name,
      roomName: cfg.roomName,
      type: 'swing',
      position: [cfg.x, 0, cfg.z],
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      currentSlide: 0,
      targetSlide: 0,
      leftHinge,
      rightHinge,
      leftLeaf,
      rightLeaf,
      indicator,
      orientation: 'alongZ',
      sensorRadius: cfg.sensorRadius,
      holdTimer: 0,
      swingDirection: cfg.swingDirection || 1
    });
  }

  private buildSlidingDoor(cfg: AutoDoorConfig) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(cfg.x, 0, cfg.z);
    this.group.add(doorGroup);

    const doorW = cfg.width / 2; // Each leaf is half width (e.g. 1.6m for a 3.2m opening)
    const leafHalfWidth = doorW / 2; // Half width of one leaf (e.g. 0.8m)
    const doorH = 2.65;
    const doorThick = 0.055;

    const frostedMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88
    });

    const glassGeo = new THREE.BoxGeometry(doorW - 0.08, doorH - 0.12, doorThick * 0.4);
    const bandGeo = new THREE.BoxGeometry(doorW - 0.06, 0.48, doorThick * 0.48);
    const stileGeo = new THREE.BoxGeometry(0.055, doorH, doorThick);
    const railGeo = new THREE.BoxGeometry(doorW, 0.055, doorThick);

    // Left Leaf (Slides left along X from -leafHalfWidth)
    const leftHinge = new THREE.Group();
    leftHinge.position.set(-leafHalfWidth, 0, 0);
    doorGroup.add(leftHinge);

    const leftLeaf = new THREE.Group();
    leftLeaf.position.set(0, doorH / 2, 0);
    leftHinge.add(leftLeaf);

    const lGlass = new THREE.Mesh(glassGeo, this.glassMat);
    lGlass.castShadow = true;
    leftLeaf.add(lGlass);

    const lBand = new THREE.Mesh(bandGeo, frostedMat);
    lBand.position.y = 0.05;
    leftLeaf.add(lBand);

    const lStileL = new THREE.Mesh(stileGeo, this.frameMat);
    lStileL.position.x = -doorW / 2 + 0.028;
    leftLeaf.add(lStileL);

    const lStileR = new THREE.Mesh(stileGeo, this.frameMat);
    lStileR.position.x = doorW / 2 - 0.028;
    leftLeaf.add(lStileR);

    const lRailTop = new THREE.Mesh(railGeo, this.frameMat);
    lRailTop.position.y = doorH / 2 - 0.028;
    leftLeaf.add(lRailTop);

    const lRailBot = new THREE.Mesh(railGeo, this.frameMat);
    lRailBot.position.y = -doorH / 2 + 0.028;
    leftLeaf.add(lRailBot);

    // Left door handles (inner meeting stile)
    [-1, 1].forEach(side => {
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 16);
      const handle = new THREE.Mesh(handleGeo, this.handleMat);
      handle.position.set(doorW / 2 - 0.08, 0.05, side * 0.045);
      leftLeaf.add(handle);
    });

    // Right Leaf (Slides right along X from +leafHalfWidth)
    const rightHinge = new THREE.Group();
    rightHinge.position.set(leafHalfWidth, 0, 0);
    doorGroup.add(rightHinge);

    const rightLeaf = new THREE.Group();
    rightLeaf.position.set(0, doorH / 2, 0);
    rightHinge.add(rightLeaf);

    const rGlass = new THREE.Mesh(glassGeo, this.glassMat);
    rGlass.castShadow = true;
    rightLeaf.add(rGlass);

    const rBand = new THREE.Mesh(bandGeo, frostedMat);
    rBand.position.y = 0.05;
    rightLeaf.add(rBand);

    const rStileL = new THREE.Mesh(stileGeo, this.frameMat);
    rStileL.position.x = -doorW / 2 + 0.028;
    rightLeaf.add(rStileL);

    const rStileR = new THREE.Mesh(stileGeo, this.frameMat);
    rStileR.position.x = doorW / 2 - 0.028;
    rightLeaf.add(rStileR);

    const rRailTop = new THREE.Mesh(railGeo, this.frameMat);
    rRailTop.position.y = doorH / 2 - 0.028;
    rightLeaf.add(rRailTop);

    const rRailBot = new THREE.Mesh(railGeo, this.frameMat);
    rRailBot.position.y = -doorH / 2 + 0.028;
    rightLeaf.add(rRailBot);

    // Right door handles (inner meeting stile)
    [-1, 1].forEach(side => {
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.65, 16);
      const handle = new THREE.Mesh(handleGeo, this.handleMat);
      handle.position.set(-doorW / 2 + 0.08, 0.05, side * 0.045);
      rightLeaf.add(handle);
    });

    // Modern Header Track & Frame
    const topTrack = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.4, 0.16, 0.14), this.frameMat);
    topTrack.position.set(0, doorH + 0.08, 0);
    doorGroup.add(topTrack);

    // Vertical Frame Jambs on Left & Right
    [-cfg.width / 2 - 0.04, cfg.width / 2 + 0.04].forEach(jx => {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, doorH + 0.16, 0.14), this.frameMat);
      jamb.position.set(jx, (doorH + 0.08) / 2, 0);
      doorGroup.add(jamb);
    });

    // Floor threshold
    const thresh = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.2, 0.02, 0.24), this.frameMat);
    thresh.position.set(0, 0.01, 0);
    doorGroup.add(thresh);

    // Floor indicator ring
    const ringGeo = new THREE.RingGeometry(0.55, 0.70, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const indicator = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: cfg.accentColor, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    indicator.position.set(0, 0.025, 0);
    doorGroup.add(indicator);

    // Collision box when closed
    const boxLabel = `Door-${cfg.id}`;
    this.collisionManager.addBox(
      cfg.x - cfg.width / 2 - 0.1,
      cfg.x + cfg.width / 2 + 0.1,
      cfg.z - 0.25,
      cfg.z + 0.25,
      boxLabel,
      0,
      3.2
    );

    this.doors.push({
      id: cfg.id,
      name: cfg.name,
      roomName: cfg.roomName,
      type: 'sliding',
      position: [cfg.x, 0, cfg.z],
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      currentSlide: 0,
      targetSlide: 0,
      leftHinge,
      rightHinge,
      leftLeaf,
      rightLeaf,
      indicator,
      orientation: 'alongX',
      sensorRadius: cfg.sensorRadius,
      holdTimer: 0,
      swingDirection: 1,
      leafHalfWidth
    });
  }

  /**
   * Automatic proximity detection for ALL characters (player, employees, CEO)
   * Opens smoothly (0.5s ease), keeps open while occupied, closes 1s after zone empty.
   */
  public updateAutoDoors(
    characterPositions: { x: number; z: number }[],
    delta: number
  ) {
    this.doors.forEach(door => {
      // Check if ANY character is within this door's sensor zone
      let closestDistSq = Infinity;
      let closestChar: { x: number; z: number } | null = null;

      for (const c of characterPositions) {
        const dx = c.x - door.position[0];
        const dz = c.z - door.position[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestChar = c;
        }
      }

      const sensorRadiusSq = door.sensorRadius * door.sensorRadius;
      const isOccupied = closestDistSq <= sensorRadiusSq;

      if (isOccupied && closestChar) {
        // NPC is in sensor zone: open door!
        door.holdTimer = 2.0; // 2.0s hold timer for NPC passage
        door.isAutoTriggered = true;

        if (!door.isOpen) {
          door.isOpen = true;
          this.collisionManager.removeBoxByLabel(`Door-${door.id}`);
          SoundEffects.playDoorSound(true);
        }

        if (door.type === 'sliding') {
          door.targetSlide = (door.leafHalfWidth || 0.8) * 1.9; // Smoothly slide completely open
        } else {
          // Swing door: open AWAY from approaching character so it never hits their face!
          const approachFromWest = closestChar.x < door.position[0];
          const swingAway = approachFromWest ? 1 : -1;
          door.targetAngle = (Math.PI / 2.1) * swingAway;
        }
      } else {
        // Sensor zone is empty: only auto-close if this door was auto-opened by an NPC!
        if (door.isOpen && door.isAutoTriggered) {
          door.holdTimer -= delta;

          if (door.holdTimer <= 0) {
            door.isOpen = false;
            door.isAutoTriggered = false;
            door.targetAngle = 0;
            door.targetSlide = 0;

            // Re-enable collision box
            const boxLabel = `Door-${door.id}`;
            this.collisionManager.removeBoxByLabel(boxLabel);
            if (door.type === 'sliding') {
              const halfW = (door.leafHalfWidth ? door.leafHalfWidth * 2 : 1.6) + 0.1;
              this.collisionManager.addBox(
                door.position[0] - halfW,
                door.position[0] + halfW,
                door.position[2] - 0.25,
                door.position[2] + 0.25,
                boxLabel,
                0,
                3.2
              );
            } else {
              this.collisionManager.addBox(
                door.position[0] - 0.25,
                door.position[0] + 0.25,
                door.position[2] - 1.4,
                door.position[2] + 1.4,
                boxLabel,
                0,
                3.2
              );
            }

            SoundEffects.playDoorSound(false);
          }
        }
      }
    });
  }

  public update(delta: number, time: number) {
    this.doors.forEach(door => {
      const lerpSpeed = Math.min(1, 9 * delta); // ~0.45s - 0.5s smooth ease

      if (door.type === 'sliding') {
        door.currentSlide += (door.targetSlide - door.currentSlide) * lerpSpeed;
        const baseOffset = door.leafHalfWidth || 0.8;
        door.leftHinge.position.x = -baseOffset - door.currentSlide;
        door.rightHinge.position.x = baseOffset + door.currentSlide;
      } else {
        door.currentAngle += (door.targetAngle - door.currentAngle) * lerpSpeed;
        door.leftHinge.rotation.y = -door.currentAngle;
        door.rightHinge.rotation.y = door.currentAngle;
      }

      // Pulse floor indicator ring
      door.indicator.scale.setScalar(1 + Math.sin(time * 3) * 0.06);
    });
  }

  public toggleDoor(doorId: string): boolean {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return false;
    door.isOpen = !door.isOpen;
    door.isAutoTriggered = false; // Manual control by player: stays in state until toggled again with [Q]!
    door.holdTimer = 0;

    const boxLabel = `Door-${door.id}`;
    if (door.isOpen) {
      if (door.type === 'sliding') {
        door.targetSlide = (door.leafHalfWidth || 0.8) * 1.9;
      } else {
        door.targetAngle = (Math.PI / 2.1) * (door.swingDirection || 1);
      }
      this.collisionManager.removeBoxByLabel(boxLabel);
    } else {
      door.targetSlide = 0;
      door.targetAngle = 0;
      this.collisionManager.removeBoxByLabel(boxLabel);
      if (door.type === 'sliding') {
        const halfW = (door.leafHalfWidth ? door.leafHalfWidth * 2 : 1.6) + 0.1;
        this.collisionManager.addBox(
          door.position[0] - halfW,
          door.position[0] + halfW,
          door.position[2] - 0.25,
          door.position[2] + 0.25,
          boxLabel,
          0,
          3.2
        );
      } else {
        this.collisionManager.addBox(
          door.position[0] - 0.25,
          door.position[0] + 0.25,
          door.position[2] - 1.4,
          door.position[2] + 1.4,
          boxLabel,
          0,
          3.2
        );
      }
    }
    SoundEffects.playDoorSound(door.isOpen);
    return door.isOpen;
  }

  public getNearDoor(playerX: number, playerZ: number, threshold: number = 3.2): InteractiveDoor | null {
    for (const door of this.doors) {
      const dx = playerX - door.position[0];
      const dz = playerZ - door.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < threshold) {
        return door;
      }
    }
    return null;
  }
}
