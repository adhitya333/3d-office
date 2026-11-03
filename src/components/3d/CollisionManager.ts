import { CollisionBox } from '../../types/office';

export class CollisionManager {
  private boxes: CollisionBox[] = [];

  constructor() {
    this.initStaticCollisions();
  }

  private initStaticCollisions() {
    this.boxes = [];

    // ================= 1. OUTER PERIMETER WALLS =================
    // North outer walls (flanking the Canteen entrance doorway at X: -1.8 to 1.8)
    this.addBox(-15.0, -1.8, -10.8, -10.35, 'North Wall West');
    this.addBox(1.8, 15.0, -10.8, -10.35, 'North Wall East');

    // Canteen & Lounge Perimeter Walls (X: -4.5 to 4.5, Z: -20.5 to -10.5)
    this.addBox(-4.8, -4.2, -20.5, -10.5, 'Canteen West Wall');
    this.addBox(4.2, 4.8, -20.5, -10.5, 'Canteen East Wall');
    this.addBox(-4.8, 4.8, -21.0, -20.35, 'Canteen North Wall');

    // Canteen Furniture Collisions (Exact full AABBs covering entire fixtures)
    this.addBox(-3.7, -2.0, -16.25, -12.75, 'Coffee Bar Counter');
    this.addBox(3.55, 4.30, -15.45, -13.55, 'Snack Wall Shelving');
    this.addBox(3.0, 4.2, -18.4, -16.8, 'Canteen Fridge');
    this.addBox(-3.2, 3.2, -20.2, -19.4, 'Skyline Bar Counter');
    this.addBox(-3.6, -1.4, -18.6, -17.8, 'Lounge Sofa');
    this.addBox(-3.1, -1.9, -17.7, -16.5, 'Canteen Coffee Table');
    this.addBox(-3.95, -3.05, -17.0, -16.0, 'Teal Armchair Left');
    this.addBox(-1.65, -0.75, -17.0, -16.0, 'Teal Armchair Right');

    // West outer wall (X = -14.5)
    this.addBox(-14.8, -14.2, -10.5, 10.5, 'West Outer Wall');
    // East outer wall (X = 14.5)
    this.addBox(14.2, 14.8, -10.5, 10.5, 'East Outer Wall');

    // South facade outer walls (leaving entrance portal open at X: -1.8 to 1.8)
    this.addBox(-15.0, -1.8, 10.35, 10.8, 'South Facade Left Wing');
    this.addBox(1.8, 15.0, 10.35, 10.8, 'South Facade Right Wing');

    // ================= 2. ROOM DIVIDING WALLS (Z = 0) =================
    // Dividing Web Studio (Room 1) and AI Lab (Room 2) on the West side
    this.addBox(-14.5, -2.4, -0.3, 0.3, 'Web/AI Divider Wall');
    // Dividing CEO Office (Room 4) and Growth Studio (Room 3) on the East side
    this.addBox(2.4, 14.5, -0.3, 0.3, 'CEO/Growth Divider Wall');

    // ================= 3. CORRIDOR PARTITION WALLS =================
    // West corridor wall (at X = -2.4, with doorways at Z = -5.2 and Z = 5.2)
    this.addBox(-2.6, -2.2, -10.5, -6.6, 'Corridor West N');
    this.addBox(-2.6, -2.2, -3.8, 3.8, 'Corridor West Mid');
    this.addBox(-2.6, -2.2, 6.6, 10.5, 'Corridor West S');

    // East corridor wall (at X = 2.4, with doorways at Z = -5.2 and Z = 5.2)
    this.addBox(2.2, 2.6, -10.5, -6.6, 'Corridor East N');
    this.addBox(2.2, 2.6, -3.8, 3.8, 'Corridor East Mid');
    this.addBox(2.2, 2.6, 6.6, 10.5, 'Corridor East S');

    // ================= 4. EXTERIOR PLAZA BOUNDARIES =================
    // Landscaped garden beds flanking the central stone walkway (walkway is X: -2.0 to 2.0)
    this.addBox(-6.8, -2.05, 10.8, 20.2, 'Left Landscaped Flowerbed');
    this.addBox(2.05, 6.8, 10.8, 20.2, 'Right Landscaped Flowerbed');

    // Exterior limits (keeps player on stone walkway / entrance plaza)
    this.addBox(-15.0, 15.0, 20.5, 22.0, 'Plaza South Limit');
    this.addBox(-15.0, -13.5, 10.5, 21.0, 'Plaza West Limit');
    this.addBox(13.5, 15.0, 10.5, 21.0, 'Plaza East Limit');

    // ================= 5. FURNITURE COLLISIONS =================
    // Room 1: Web & Search Studio
    // Adhi's Desk at [-9.5, 0, -7.2]
    this.addBox(-10.7, -8.3, -7.8, -6.6, "Adhi's Desk");
    // Abbu's Desk at [-5.5, 0, -7.2]
    this.addBox(-6.7, -4.3, -7.8, -6.6, "Abbu's Desk");
    // Prox's Desk at [-7.5, 0, -2.8]
    this.addBox(-8.7, -6.3, -3.4, -2.2, "Prox's Desk");
    this.addBox(-13.95, -13.25, -6.1, -4.3, 'Material Library');
    this.addBox(-13.95, -13.05, -3.4, -1.6, 'Studio Coffee Credenza');

    // Room 2: AI & Business Systems Lab
    // Vaibav's Desk at [-9.5, 0, 4.5]
    this.addBox(-10.7, -8.3, 3.9, 5.1, "Vaibav's Desk");
    // Taha's Desk at [-5.5, 0, 7.5]
    this.addBox(-6.7, -4.3, 6.9, 8.1, "Taha's Desk");
    // AI Workflow rack at West wall
    this.addBox(-14.4, -13.5, 2.2, 4.8, 'AI Workflow Display Rack');
    // Business systems display at West wall
    this.addBox(-14.4, -13.5, 6.2, 8.8, 'Business Systems Display');
    this.addBox(-13.95, -13.25, 0.6, 2.0, 'Hardware Bench');

    // Room 3: Growth Studio
    // Rewaant's Desk at [8.5, 0, 5.5]
    this.addBox(7.3, 9.7, 4.9, 6.1, "Rewaant's Desk");
    // Campaign board at East wall
    this.addBox(13.5, 14.4, 4.2, 6.8, 'Campaign Board');
    this.addBox(13.25, 13.95, 1.3, 2.9, 'Growth Library');

    // Room 4: CEO Office & Boardroom
    // Ameen's Executive Presidential Boardroom Desk (4.2m x 1.8m) at [8.5, 0, -6.5]
    this.addBox(6.3, 10.7, -7.5, -5.5, "Ameen's Executive Desk");
    // Boardroom Conference Table at [8.5, 0, -2.5]
    this.addBox(7.1, 9.9, -3.11, -1.89, 'Boardroom Conference Table', 0, 0.80);
    // CEO Roadmap Board at East wall
    this.addBox(13.5, 14.4, -7.8, -5.2, 'CEO Strategic Roadmap Board');
    this.addBox(12.2, 13.1, -4.0, -1.0, 'Executive Lounge Sofa', 0, 1.1);
    this.addBox(11.1, 11.8, -2.85, -2.15, 'Executive Lounge Table', 0, 0.56);

    // Water Dispenser in corridor recess at [-2.0, 0, 0]
    this.addBox(-2.25, -1.75, -0.25, 0.25, 'Water Dispenser', 0, 2.0);
  }

  public addBox(
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    label?: string,
    minY: number = 0,
    maxY: number = 3.3
  ) {
    this.boxes.push({ minX, maxX, minZ, maxZ, minY, maxY, label });
  }

  public removeBoxByLabel(label: string) {
    this.boxes = this.boxes.filter(b => b.label !== label);
  }

  public isColliding(x: number, z: number, y: number = 0, radius: number = 0.28): boolean {
    for (const box of this.boxes) {
      // Height bounds check
      const bMinY = box.minY ?? 0;
      const bMaxY = box.maxY ?? 3.3;
      if (y < bMinY - 0.2 || y > bMaxY + 0.2) {
        continue;
      }

      const closestX = Math.max(box.minX, Math.min(x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;

      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Anti-Stuck De-penetration:
   * If an entity is ever clipped or trapped inside any collision box (e.g. after standing up from a chair),
   * dynamically pushes them out to the nearest safe open floor point.
   */
  public pushOutOfCollisions(
    x: number,
    z: number,
    y: number = 0,
    radius: number = 0.28
  ): { x: number; z: number } {
    let resX = x;
    let resZ = z;

    for (let iter = 0; iter < 4; iter++) {
      let collided = false;
      for (const box of this.boxes) {
        const bMinY = box.minY ?? 0;
        const bMaxY = box.maxY ?? 3.3;
        if (y < bMinY - 0.2 || y > bMaxY + 0.2) continue;

        const closestX = Math.max(box.minX, Math.min(resX, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(resZ, box.maxZ));

        const dx = resX - closestX;
        const dz = resZ - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          collided = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const pushMag = (radius - dist) + 0.001;
            resX += (dx / dist) * pushMag;
            resZ += (dz / dist) * pushMag;
          } else {
            // Center is inside the box: push out to nearest border
            const dLeft = Math.abs(resX - box.minX);
            const dRight = Math.abs(box.maxX - resX);
            const dBottom = Math.abs(resZ - box.minZ);
            const dTop = Math.abs(box.maxZ - resZ);
            const minDist = Math.min(dLeft, dRight, dBottom, dTop);

            if (minDist === dLeft) resX = box.minX - radius - 0.001;
            else if (minDist === dRight) resX = box.maxX + radius + 0.001;
            else if (minDist === dBottom) resZ = box.minZ - radius - 0.001;
            else resZ = box.maxZ + radius + 0.001;
          }
        }
      }
      if (!collided) break;
    }

    return { x: resX, z: resZ };
  }

  public resolveMovement(
    currentX: number,
    currentZ: number,
    targetX: number,
    targetZ: number,
    y: number = 0,
    radius: number = 0.28
  ): { x: number; z: number } {
    // 1. Direct unhindered movement (Fast Path: 95% of frames)
    if (!this.isColliding(targetX, targetZ, y, radius)) {
      return { x: targetX, z: targetZ };
    }

    // 2. Pure frictionless wall sliding: try individual X and Z movement
    const canMoveX = !this.isColliding(targetX, currentZ, y, radius);
    const canMoveZ = !this.isColliding(currentX, targetZ, y, radius);

    if (canMoveX && !canMoveZ) {
      return { x: targetX, z: currentZ };
    }
    if (!canMoveX && canMoveZ) {
      return { x: currentX, z: targetZ };
    }
    if (canMoveX && canMoveZ) {
      // Both individual axes are open, but the combined diagonal hits a corner edge.
      // Slide along the dominant movement axis with zero jitter.
      const moveDistX = Math.abs(targetX - currentX);
      const moveDistZ = Math.abs(targetZ - currentZ);
      return moveDistX >= moveDistZ
        ? { x: targetX, z: currentZ }
        : { x: currentX, z: targetZ };
    }

    // 3. Both single axes report collision (player is already pressing tightly against boundary)
    // Try fractional sliding steps along whichever axis has the larger intended movement
    const dx = targetX - currentX;
    const dz = targetZ - currentZ;

    if (Math.abs(dx) >= Math.abs(dz) && Math.abs(dx) > 0.001) {
      const halfX = currentX + dx * 0.5;
      if (!this.isColliding(halfX, currentZ, y, radius)) {
        return { x: halfX, z: currentZ };
      }
    } else if (Math.abs(dz) > 0.001) {
      const halfZ = currentZ + dz * 0.5;
      if (!this.isColliding(currentX, halfZ, y, radius)) {
        return { x: currentX, z: halfZ };
      }
    }

    // 4. Fully blocked on both axes: cleanly halt with zero bounce or micro-jitter
    return { x: currentX, z: currentZ };
  }

  /**
   * Fast AABB raycaster for 3rd-person camera collision prevention.
   * Pulls the camera forward along the line of sight when walls or obstacles intervene.
   */
  public raycastCamera(
    fromX: number,
    fromY: number,
    fromZ: number,
    toX: number,
    toY: number,
    toZ: number,
    margin: number = 0.28
  ): { x: number; y: number; z: number; hit: boolean } {
    const dirX = toX - fromX;
    const dirY = toY - fromY;
    const dirZ = toZ - fromZ;
    const maxDist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    if (maxDist < 0.001) return { x: toX, y: toY, z: toZ, hit: false };

    const invLen = 1 / maxDist;
    const ndX = dirX * invLen;
    const ndY = dirY * invLen;
    const ndZ = dirZ * invLen;

    let closestT = maxDist;
    let hitAny = false;

    for (const box of this.boxes) {
      const bMinY = box.minY ?? 0;
      const bMaxY = box.maxY ?? 3.3;

      // Expand box bounds by margin for safe camera clearance
      const minX = box.minX - margin;
      const maxX = box.maxX + margin;
      const minY = bMinY - margin;
      const maxY = bMaxY + margin;
      const minZ = box.minZ - margin;
      const maxZ = box.maxZ + margin;

      // Slab method intersection
      let tmin = 0;
      let tmax = maxDist;

      // X slab
      if (Math.abs(ndX) > 0.00001) {
        const t1 = (minX - fromX) / ndX;
        const t2 = (maxX - fromX) / ndX;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      } else if (fromX < minX || fromX > maxX) {
        continue;
      }

      // Y slab
      if (Math.abs(ndY) > 0.00001) {
        const t1 = (minY - fromY) / ndY;
        const t2 = (maxY - fromY) / ndY;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      } else if (fromY < minY || fromY > maxY) {
        continue;
      }

      // Z slab
      if (Math.abs(ndZ) > 0.00001) {
        const t1 = (minZ - fromZ) / ndZ;
        const t2 = (maxZ - fromZ) / ndZ;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      } else if (fromZ < minZ || fromZ > maxZ) {
        continue;
      }

      if (tmax >= tmin && tmin > 0.1 && tmin < closestT) {
        closestT = tmin;
        hitAny = true;
      }
    }

    if (hitAny) {
      const safeT = Math.max(0.4, closestT - 0.08);
      return {
        x: fromX + ndX * safeT,
        y: fromY + ndY * safeT,
        z: fromZ + ndZ * safeT,
        hit: true
      };
    }

    return { x: toX, y: toY, z: toZ, hit: false };
  }

  public getBoxes(): CollisionBox[] {
    return this.boxes;
  }
}
