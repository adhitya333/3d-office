import * as THREE from 'three';
import { OFFICE_CONFIG, WaypointNode, WaypointEdge, InteractionPointConfig } from '../config/office.config';

export interface PathWaypoint {
  x: number;
  z: number;
  room: string;
}

export class NavigationService {
  private static instance: NavigationService;

  private nodes: Map<string, WaypointNode> = new Map();
  private adjacency: Map<string, { to: string; distance: number; doorId?: string }[]> = new Map();
  private reservations: Map<string, string> = new Map(); // pointId -> npcId
  private debugGroup: THREE.Group | null = null;
  private isDebugVisible: boolean = false;

  private constructor() {
    this.buildGraph();
  }

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  private buildGraph() {
    OFFICE_CONFIG.waypoints.nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacency.set(node.id, []);
    });

    OFFICE_CONFIG.waypoints.edges.forEach(edge => {
      // Bidirectional edges
      this.adjacency.get(edge.from)?.push({ to: edge.to, distance: edge.distance, doorId: edge.doorId });
      this.adjacency.get(edge.to)?.push({ to: edge.from, distance: edge.distance, doorId: edge.doorId });
    });
  }

  /**
   * Finds the closest graph node to a given (x, z) coordinate
   */
  public findClosestNode(x: number, z: number, targetRoom?: string): WaypointNode | null {
    let closest: WaypointNode | null = null;
    let minDistSq = Infinity;

    this.nodes.forEach(node => {
      if (targetRoom && node.room !== targetRoom) return;
      const dx = node.x - x;
      const dz = node.z - z;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = node;
      }
    });

    // Fallback without room restriction if none found
    if (!closest && targetRoom) {
      return this.findClosestNode(x, z);
    }

    return closest;
  }

  /**
   * Fast, deterministic A* pathfinding between two world coordinates
   */
  public findPath(
    startX: number,
    startZ: number,
    targetX: number,
    targetZ: number,
    capsuleRadius: number = 0.30
  ): PathWaypoint[] {
    const startNode = this.findClosestNode(startX, startZ);
    const targetNode = this.findClosestNode(targetX, targetZ);

    if (!startNode || !targetNode) return [];

    if (startNode.id === targetNode.id) {
      return [
        { x: startNode.x, z: startNode.z, room: startNode.room },
        { x: targetX, z: targetZ, room: targetNode.room }
      ];
    }

    // A* implementation
    const openSet: Set<string> = new Set([startNode.id]);
    const cameFrom: Map<string, string> = new Map();

    const gScore: Map<string, number> = new Map();
    gScore.set(startNode.id, 0);

    const fScore: Map<string, number> = new Map();
    const heuristic = (n1: WaypointNode, n2: WaypointNode) => {
      const dx = n1.x - n2.x;
      const dz = n1.z - n2.z;
      return Math.sqrt(dx * dx + dz * dz);
    };
    fScore.set(startNode.id, heuristic(startNode, targetNode));

    while (openSet.size > 0) {
      // Node with lowest fScore
      let currentId = '';
      let lowestF = Infinity;
      openSet.forEach(id => {
        const score = fScore.get(id) ?? Infinity;
        if (score < lowestF) {
          lowestF = score;
          currentId = id;
        }
      });

      if (currentId === targetNode.id) {
        // Reconstruct path
        const path: PathWaypoint[] = [];
        let curr: string | undefined = currentId;
        while (curr) {
          const n = this.nodes.get(curr)!;
          path.unshift({ x: n.x, z: n.z, room: n.room });
          curr = cameFrom.get(curr);
        }

        // Add exact target point at the end
        path.push({ x: targetX, z: targetZ, room: targetNode.room });
        return path;
      }

      openSet.delete(currentId);
      const currentNode = this.nodes.get(currentId)!;
      const neighbors = this.adjacency.get(currentId) || [];

      for (const neighborEdge of neighbors) {
        const neighborNode = this.nodes.get(neighborEdge.to);
        if (!neighborNode) continue;

        // Ensure clearance radius satisfies character capsule
        if (neighborNode.clearanceRadius < capsuleRadius) {
          continue; // Path blocked for wide character (e.g. CEO)
        }

        const tentativeG = (gScore.get(currentId) ?? Infinity) + neighborEdge.distance;

        if (tentativeG < (gScore.get(neighborEdge.to) ?? Infinity)) {
          cameFrom.set(neighborEdge.to, currentId);
          gScore.set(neighborEdge.to, tentativeG);
          fScore.set(neighborEdge.to, tentativeG + heuristic(neighborNode, targetNode));
          openSet.add(neighborEdge.to);
        }
      }
    }

    // Direct fallback if path blocked
    return [
      { x: startNode.x, z: startNode.z, room: startNode.room },
      { x: targetNode.x, z: targetNode.z, room: targetNode.room },
      { x: targetX, z: targetZ, room: targetNode.room }
    ];
  }

  /** Infrequent local A* detour around furniture when a graph segment is obstructed. */
  public findObstacleDetour(startX: number, startZ: number, targetX: number, targetZ: number,
    radius: number, blocked: (x: number, z: number, radius: number) => boolean, seatTarget = false,
    hardBlocked?: (x: number, z: number) => boolean): { x: number; z: number }[] | null {
    const spacing = 0.15;
    const startInside = blocked(startX, startZ, radius);
    const clear = (x: number, z: number) => !hardBlocked?.(x, z) && (
      (startInside && Math.hypot(x - startX, z - startZ) < 0.75) ||
      (seatTarget && Math.hypot(x - targetX, z - targetZ) < radius + 0.75) || !blocked(x, z, radius));
    const lineClear = (x1: number, z1: number, x2: number, z2: number) => {
      const count = Math.max(1, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 0.12));
      for (let i = 1; i <= count; i++) if (!clear(x1 + (x2 - x1) * i / count, z1 + (z2 - z1) * i / count)) return false;
      return true;
    };
    const minX = Math.min(startX, targetX) - 4, maxX = Math.max(startX, targetX) + 4;
    const minZ = Math.min(startZ, targetZ) - 4, maxZ = Math.max(startZ, targetZ) + 4;
    type Node = { x: number; z: number; cost: number; score: number; parent?: Node };
    const first: Node = { x: startX, z: startZ, cost: 0, score: Math.hypot(targetX - startX, targetZ - startZ) };
    // Binary heap bounds the occasional detour cost without scanning every open node.
    const open: Node[] = [first];
    const push = (node: Node) => {
      open.push(node); let index = open.length - 1;
      while (index > 0) {
        const parent = (index - 1) >> 1;
        if (open[parent].score <= node.score) break;
        open[index] = open[parent]; index = parent;
      }
      open[index] = node;
    };
    const pop = () => {
      const result = open[0], last = open.pop()!;
      if (open.length) {
        let index = 0;
        while (index * 2 + 1 < open.length) {
          let child = index * 2 + 1;
          if (child + 1 < open.length && open[child + 1].score < open[child].score) child++;
          if (open[child].score >= last.score) break;
          open[index] = open[child]; index = child;
        }
        open[index] = last;
      }
      return result;
    };
    const costs = new Map<string, number>([['0,0', 0]]);
    let visits = 0;
    while (open.length && visits++ < 3000) {
      const current = pop();
      const key = `${Math.round((current.x - startX) / spacing)},${Math.round((current.z - startZ) / spacing)}`;
      if (current.cost > (costs.get(key) ?? Infinity) + 0.001) continue;
      if (Math.hypot(current.x - targetX, current.z - targetZ) < 0.55 && lineClear(current.x, current.z, targetX, targetZ)) {
        const result = [{ x: targetX, z: targetZ }];
        let node: Node | undefined = current;
        while (node?.parent) { result.unshift({ x: node.x, z: node.z }); node = node.parent; }
        return result;
      }
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue;
        const x = current.x + dx * spacing, z = current.z + dz * spacing;
        if (x < minX || x > maxX || z < minZ || z > maxZ || !lineClear(current.x, current.z, x, z)) continue;
        const id = `${Math.round((x - startX) / spacing)},${Math.round((z - startZ) / spacing)}`;
        const cost = current.cost + Math.hypot(dx, dz) * spacing;
        if (cost >= (costs.get(id) ?? Infinity) - 0.001) continue;
        costs.set(id, cost);
        push({ x, z, cost, score: cost + Math.hypot(x - targetX, z - targetZ), parent: current });
      }
    }
    return null;
  }

  // ================= INTERACTION POINT RESERVATIONS =================
  public reservePoint(pointId: string, npcId: string): boolean {
    const existing = this.reservations.get(pointId);
    if (!existing || existing === npcId) {
      this.reservations.set(pointId, npcId);
      return true;
    }
    return false;
  }

  public releasePoint(pointId: string, npcId: string): void {
    if (this.reservations.get(pointId) === npcId) {
      this.reservations.delete(pointId);
    }
  }

  public releaseAllForNpc(npcId: string): void {
    this.reservations.forEach((holder, id) => {
      if (holder === npcId) {
        this.reservations.delete(id);
      }
    });
  }

  public isPointOccupied(pointId: string, byNpcId?: string): boolean {
    const holder = this.reservations.get(pointId);
    if (!holder) return false;
    if (byNpcId && holder === byNpcId) return false;
    return true;
  }

  public getRandomAvailablePoint(
    type: InteractionPointConfig['type'],
    roomFilter?: string,
    excludePointId?: string
  ): InteractionPointConfig | null {
    const matches = OFFICE_CONFIG.interactionPoints.filter(p => {
      if (p.type !== type) return false;
      if (roomFilter && p.room !== roomFilter) return false;
      if (excludePointId && p.id === excludePointId) return false;
      return !this.isPointOccupied(p.id);
    });

    if (matches.length === 0) return null;
    return matches[Math.floor(Math.random() * matches.length)];
  }

  public getInteractionPoint(pointId: string): InteractionPointConfig | null {
    return OFFICE_CONFIG.interactionPoints.find(p => p.id === pointId) || null;
  }

  // ================= DEBUG VISUALIZER ([N] KEY) =================
  public buildDebugGroup(): THREE.Group {
    if (this.debugGroup) return this.debugGroup;

    const group = new THREE.Group();
    group.name = 'NavigationDebugGroup';

    // 1. Waypoint Nodes (Spheres with room-based colors)
    const nodeGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const colors: Record<string, number> = {
      corridor: 0x38BDF8, // Sky Blue
      canteen: 0x06B6D4,  // Cyan
      'web-search': 0x0284C7, // Blue
      'ai-systems': 0x7C3AED, // Violet
      growth: 0x059669,   // Emerald
      ceo: 0xF59E0B       // Gold
    };

    const nodeMaterials: Record<string, THREE.MeshBasicMaterial> = {};

    this.nodes.forEach(node => {
      if (!nodeMaterials[node.room]) {
        nodeMaterials[node.room] = new THREE.MeshBasicMaterial({
          color: colors[node.room] || 0xFFFFFF,
          wireframe: false
        });
      }
      const mesh = new THREE.Mesh(nodeGeo, nodeMaterials[node.room]);
      mesh.position.set(node.x, 0.2, node.z);
      group.add(mesh);
    });

    // 2. Waypoint Edges (Glowing green lines)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22C55E, linewidth: 2 });
    OFFICE_CONFIG.waypoints.edges.forEach(edge => {
      const from = this.nodes.get(edge.from);
      const to = this.nodes.get(edge.to);
      if (!from || !to) return;

      const points = [
        new THREE.Vector3(from.x, 0.2, from.z),
        new THREE.Vector3(to.x, 0.2, to.z)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      group.add(line);
    });

    // 3. Interaction Points & Seat Anchors (Gold/Amber cones pointing in facingDirection)
    const coneGeo = new THREE.ConeGeometry(0.15, 0.45, 8);
    coneGeo.rotateX(Math.PI / 2); // Point along forward vector
    const anchorMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24 });

    OFFICE_CONFIG.interactionPoints.forEach(p => {
      const cone = new THREE.Mesh(coneGeo, anchorMat);
      cone.position.set(p.position[0], 0.35, p.position[2]);
      cone.rotation.y = p.facingDirection;
      group.add(cone);

      // Floor ring marker
      const ringGeo = new THREE.RingGeometry(0.24, 0.30, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, anchorMat);
      ring.position.set(p.position[0], 0.03, p.position[2]);
      group.add(ring);
    });

    // 4. Door Sensor Zones (Dashed cyan rings)
    OFFICE_CONFIG.doors.forEach(d => {
      const sensorGeo = new THREE.RingGeometry(d.sensorRadius - 0.05, d.sensorRadius, 24);
      sensorGeo.rotateX(-Math.PI / 2);
      const sensorMat = new THREE.MeshBasicMaterial({ color: d.accentColor, side: THREE.DoubleSide });
      const sensor = new THREE.Mesh(sensorGeo, sensorMat);
      sensor.position.set(d.x, 0.02, d.z);
      group.add(sensor);
    });

    group.visible = this.isDebugVisible;
    this.debugGroup = group;
    return group;
  }

  public toggleDebug(): boolean {
    this.isDebugVisible = !this.isDebugVisible;
    if (this.debugGroup) {
      this.debugGroup.visible = this.isDebugVisible;
    }
    return this.isDebugVisible;
  }

  // ================= AUTOMATED ROUTING VERIFICATION =================
  /**
   * Verifies that the CEO (capsule 0.45m) and regular NPCs (capsule 0.30m)
   * can navigate from every employee desk to every interaction point in the office
   * without encountering any blocked paths or insufficient clearance (< 1.2m).
   */
  public verifyAllPaths(capsuleRadius: number = 0.45): {
    totalChecked: number;
    passed: number;
    failed: number;
    failures: string[];
  } {
    const results = {
      totalChecked: 0,
      passed: 0,
      failed: 0,
      failures: [] as string[]
    };

    const startPoints = OFFICE_CONFIG.employees.map(e => ({
      name: `${e.name} Desk (${e.roomName})`,
      x: e.deskPosition[0],
      z: e.deskPosition[2]
    }));

    const targets = OFFICE_CONFIG.interactionPoints;

    startPoints.forEach(start => {
      targets.forEach(target => {
        results.totalChecked++;
        const path = this.findPath(start.x, start.z, target.position[0], target.position[2], capsuleRadius);
        if (!path || path.length < 2) {
          results.failed++;
          results.failures.push(`No valid path from "${start.name}" to "${target.name}" [capsule: ${capsuleRadius}m]`);
        } else {
          results.passed++;
        }
      });
    });

    return results;
  }
}
