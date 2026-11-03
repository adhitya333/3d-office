import * as THREE from 'three';
import { OFFICE_CONFIG, EmployeeProfileConfig, InteractionPointConfig } from '../config/office.config';
import { NavigationService } from './navigation';
import { CharacterMeshController } from '../components/3d/Character';
import { REFRESHMENT_ITEMS, RefreshmentItem } from '../data/refreshments';
import { SITTABLE_CHAIRS } from '../data/chairs';
import type { EmployeeWorkPhase } from './employeeWorkManager';

export type NPCState =
  | 'AT_DESK_WORKING'
  | 'WALKING_TO_BREAK'
  | 'COFFEE'
  | 'WAITING_FOR_COFFEE'
  | 'SNACK'
  | 'SITTING_IN_LOUNGE'
  | 'CHATTING_WITH_PLAYER'
  | 'RETURNING_TO_DESK'
  | 'WAITING_FOR_DOOR';

export interface NPCAgent {
  config: EmployeeProfileConfig;
  controller: CharacterMeshController;
  state: NPCState;
  previousState?: NPCState;
  currentRoom: string;
  currentActivityDescription: string;
  path: { x: number; z: number }[];
  pathIndex: number;
  targetPoint: InteractionPointConfig | null;
  stateTimer: number;
  breakCooldownTimer: number;
  isSeated: boolean;
  facingTarget: number;
  holdingProp: 'none' | 'coffee_cup' | 'snack_bar' | 'meal_plate';
  refreshment: RefreshmentItem | null;
  blockedTimer: number;
  seatAnchorId: string;
  visitorSeatAnchorId: string;
  canteenRequested: boolean;
  reservedMealSeatId: string | null;
  finishAtSeat: boolean;
}

export class NPCBrainManager {
  private agents: Map<string, NPCAgent> = new Map();
  private activeBreaksCount = 0;
  private isAllCalledBack = false;
  private workStatuses = new Map<string, EmployeeWorkPhase>();
  private playerPosition = new THREE.Vector3(0, 0, 17.5);
  private obstacleTest?: (x: number, z: number, radius: number) => boolean;
  private tableTest?: (x: number, z: number, radius: number) => boolean;
  private peopleRadius(agent: NPCAgent) { return agent.config.id === 'ameen' ? 0.80 : agent.config.capsuleRadius; }
  private seatRoute(path: { x: number; z: number }[], point: InteractionPointConfig) {
    if (!['desk', 'seat', 'sofa', 'bar_stool'].includes(point.type)) return path;
    // Graph nodes may lie in the middle of a sofa. Approach the reserved seat
    // itself rather than first walking through a neighboring cushion.
    return path.filter((node, index) => index === path.length - 1 || Math.hypot(node.x - point.position[0], node.z - point.position[2]) > 1.4);
  }

  public setObstacleTest(test?: (x: number, z: number, radius: number) => boolean, tableTest?: (x: number, z: number, radius: number) => boolean) { this.obstacleTest = test; this.tableTest = tableTest; }
  public setWorkStatus(id: string, phase: EmployeeWorkPhase) {
    this.workStatuses.set(id, phase);
    this.agents.get(id)?.controller.setTalking?.(phase === 'responding');
  }

  private applySeatPose(agent: NPCAgent, point: InteractionPointConfig) {
    const seat = SITTABLE_CHAIRS.find(item => item.id === point.id);
    agent.controller.group.position.set(...point.position);
    agent.controller.group.rotation.set(0, point.facingDirection, 0);
    agent.isSeated = true;
    agent.controller.setSitting?.(true, seat?.kind === 'sofa', seat?.kind === 'bar_stool', seat?.seatHeight);
  }

  constructor() {
    // Initialized when characters are registered
  }

  public registerAgent(config: EmployeeProfileConfig, controller: CharacterMeshController) {
    const nav = NavigationService.getInstance();
    nav.releaseAllForNpc(config.id);
    const isCEO = config.id === 'ameen';
    // Jitter initial break timers so characters don't all leave at once
    const initialCooldown = OFFICE_CONFIG.schedule.minBreakIntervalSec + Math.random() *
      (OFFICE_CONFIG.schedule.maxBreakIntervalSec - OFFICE_CONFIG.schedule.minBreakIntervalSec) + (isCEO ? Math.random() * 45 : 0);

    const agent: NPCAgent = {
      config,
      controller,
      state: 'AT_DESK_WORKING',
      currentRoom: config.roomName,
      currentActivityDescription: 'Working intently at desk',
      path: [],
      pathIndex: 0,
      targetPoint: null,
      stateTimer: 0,
      breakCooldownTimer: initialCooldown,
      isSeated: true,
      facingTarget: config.deskRotation + Math.PI,
      holdingProp: 'none',
      refreshment: null,
      blockedTimer: 0,
      seatAnchorId: config.seatAnchorId,
      visitorSeatAnchorId: config.visitorSeatAnchorId,
      canteenRequested: false, reservedMealSeatId: null, finishAtSeat: false
    };

    // Ensure character starts seated at their desk
    const seat = OFFICE_CONFIG.interactionPoints.find(point => point.id === config.seatAnchorId);
    if (seat) { nav.reservePoint(seat.id, config.id); this.applySeatPose(agent, seat); }

    this.agents.set(config.id, agent);
  }

  public getAgent(id: string): NPCAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): NPCAgent[] {
    return Array.from(this.agents.values());
  }

  public clearAgents() {
    const nav = NavigationService.getInstance();
    this.agents.forEach(agent => {
      nav.releaseAllForNpc(agent.config.id);
    });
    this.agents.clear();
    this.activeBreaksCount = 0;
    this.obstacleTest = undefined; this.tableTest = undefined;
  }

  /**
   * Main per-frame update loop (called from fixed 60Hz loop)
   */
  public update(delta: number, time: number, playerPos: THREE.Vector3) {
    this.playerPosition.copy(playerPos);
    // Recount active breaks
    let breaks = 0;
    this.agents.forEach(agent => {
      if (!['AT_DESK_WORKING', 'RETURNING_TO_DESK'].includes(agent.state) && !(agent.state === 'CHATTING_WITH_PLAYER' && agent.previousState === 'AT_DESK_WORKING')) {
        breaks++;
      }
    });
    this.activeBreaksCount = breaks;

    this.agents.forEach(agent => {
      this.updateAgent(agent, delta, time, playerPos);
    });
  }

  private updateAgent(agent: NPCAgent, delta: number, time: number, playerPos: THREE.Vector3) {
    const pos = agent.controller.group.position;

    const busy = this.workStatuses.get(agent.config.id);
    if (agent.canteenRequested && (!busy || busy === 'idle') && (agent.state === 'AT_DESK_WORKING' || (agent.state === 'CHATTING_WITH_PLAYER' && agent.previousState === 'AT_DESK_WORKING'))) this.startCanteenTrip(agent);
    switch (agent.state) {
      case 'AT_DESK_WORKING': {
        agent.stateTimer += delta;
        agent.breakCooldownTimer -= delta;
        const work = this.workStatuses.get(agent.config.id) || 'idle';
        agent.currentActivityDescription = work === 'thinking' ? 'Thinking about your message' : work === 'responding' ? 'Writing a reply' : work === 'working' ? 'Working on your task' : `Working on ${agent.config.deskStyle.boardTitle}`;
        agent.controller.setTalking?.(work === 'responding');

        // Micro-behaviors while seated at desk: subtle animated typing, look around, drink
        agent.controller.updateAnimation(time, false, 1.0, false);

        // Check if ready for random break
        if (
          !this.isAllCalledBack &&
          work === 'idle' &&
          agent.breakCooldownTimer <= 0 &&
          this.activeBreaksCount < OFFICE_CONFIG.schedule.maxConcurrentBreaks &&
          agent.stateTimer >= OFFICE_CONFIG.schedule.deskWorkMinSec
        ) {
          this.triggerRandomBreak(agent);
        }
        break;
      }

      case 'WALKING_TO_BREAK': {
        agent.currentActivityDescription = `Heading to ${agent.targetPoint?.name || 'Canteen'}`;
        const arrived = this.followPath(agent, delta, time, playerPos);
        if (arrived) {
          this.startTargetActivity(agent, time);
        }
        break;
      }

      case 'COFFEE': {
        agent.stateTimer += delta;
        agent.currentActivityDescription = `Having ${agent.refreshment?.name || 'coffee'} at the canteen`;

        // Pick up coffee cup at machine and animate brewing / sipping
        if (agent.holdingProp !== 'coffee_cup' && agent.stateTimer >= 2.0) {
          agent.holdingProp = 'coffee_cup';
          agent.controller.setHoldingProp?.('coffee_cup');
        }

        agent.controller.updateAnimation(time, false, 1.0, false);
        if (agent.controller.triggerDrink && agent.stateTimer > 4.0 && agent.stateTimer < 5.0) {
          agent.controller.triggerDrink();
        }

        if (agent.stateTimer >= (agent.finishAtSeat ? 3.5 : OFFICE_CONFIG.schedule.coffeeDurationSec)) {
          agent.holdingProp = 'coffee_cup';
          agent.controller.setHoldingProp?.('coffee_cup');
          // After coffee, sit in the lounge or return to desk
          if (agent.finishAtSeat || Math.random() > 0.4) {
            this.sendToLoungeSeat(agent);
          } else {
            this.commandBackToDesk(agent.config.id);
          }
        }
        break;
      }

      case 'WAITING_FOR_COFFEE': {
        agent.currentActivityDescription = 'Waiting for a turn at the coffee machine';
        agent.controller.updateAnimation(time, false);
        const machine = OFFICE_CONFIG.interactionPoints.find(point => point.id === 'canteen_coffee_machine');
        if (machine && this.pointIsClear(agent, machine)) this.routeToPoint(agent, machine);
        break;
      }

      case 'SNACK': {
        agent.stateTimer += delta;
        agent.currentActivityDescription = `Having ${agent.refreshment?.name || 'a snack'} at the canteen`;

        // Pick up snack bar at shelf and animate eating
        const prop = agent.refreshment?.kind === 'drink' ? 'coffee_cup' : 'meal_plate';
        if (agent.holdingProp !== prop && agent.stateTimer >= 1.5) {
          agent.holdingProp = prop;
          agent.controller.setHoldingProp?.(prop, agent.refreshment?.dish);
        }

        agent.controller.updateAnimation(time, false, 1.0, false);

        if (agent.stateTimer >= (agent.finishAtSeat ? 3.5 : OFFICE_CONFIG.schedule.snackDurationSec)) {
          agent.holdingProp = prop;
          agent.controller.setHoldingProp?.(prop, agent.refreshment?.dish);
          if (agent.finishAtSeat || Math.random() > 0.4) {
            this.sendToLoungeSeat(agent);
          } else {
            this.commandBackToDesk(agent.config.id);
          }
        }
        break;
      }

      case 'SITTING_IN_LOUNGE': {
        agent.stateTimer += delta;
        agent.controller.setMealProgress?.(Math.min(1, agent.stateTimer / OFFICE_CONFIG.schedule.loungeDurationSec));
        agent.currentActivityDescription = agent.holdingProp !== 'none' ? `Enjoying ${agent.refreshment?.name || 'a meal'} while seated` : `Relaxing at ${agent.targetPoint?.name || 'the canteen'}`;
        agent.controller.updateAnimation(time, false, 1.0, false);

        if (agent.stateTimer >= OFFICE_CONFIG.schedule.loungeDurationSec) {
          agent.holdingProp = 'none'; agent.controller.setHoldingProp?.('none');
          this.commandBackToDesk(agent.config.id);
        }
        break;
      }

      case 'RETURNING_TO_DESK': {
        if (NavigationService.getInstance().isPointOccupied(agent.seatAnchorId, agent.config.id)) {
          const seat = OFFICE_CONFIG.interactionPoints.find(point => point.id === agent.seatAnchorId);
          if (seat && Math.hypot(pos.x - seat.position[0], pos.z - seat.position[2]) < 2.4) {
            agent.currentActivityDescription = 'Waiting for desk seat to be free';
            agent.controller.updateAnimation(time, false);
            break;
          }
        }
        agent.currentActivityDescription = 'Returning to desk';
        const arrived = this.followPath(agent, delta, time, playerPos);
        if (arrived) {
          this.arriveAtDesk(agent);
        }
        break;
      }

      case 'CHATTING_WITH_PLAYER': {
        // Seated bodies remain aligned with their chairs; only the head/arms animate.
        if (!agent.isSeated) agent.controller.lookAt(playerPos);
        agent.controller.updateAnimation(time, false, 1.0, false);
        if (agent.controller.setTalking) {
          agent.controller.setTalking(this.workStatuses.get(agent.config.id) === 'responding');
        }
        break;
      }

      case 'WAITING_FOR_DOOR': {
        agent.stateTimer += delta;
        agent.controller.updateAnimation(time, false, 1.0, false);
        if (agent.stateTimer > 1.5) {
          // Retry previous action
          agent.state = agent.previousState || 'WALKING_TO_BREAK';
          agent.stateTimer = 0;
        }
        break;
      }
    }
  }

  /**
   * Smooth path following with kinematic stride synchronization (ZERO foot sliding)
   */
  private pointIsClear(agent: NPCAgent, point: InteractionPointConfig): boolean {
    const [x, , z] = point.position;
    for (const other of this.agents.values()) {
      if (other === agent) continue;
      const required = this.peopleRadius(agent) + this.peopleRadius(other) + 0.08;
      if (Math.hypot(other.controller.group.position.x - x, other.controller.group.position.z - z) < required) return false;
    }
    return Math.hypot(this.playerPosition.x - x, this.playerPosition.z - z) >= this.peopleRadius(agent) + 0.36;
  }

  private routeToPoint(agent: NPCAgent, point: InteractionPointConfig): boolean {
    const nav = NavigationService.getInstance();
    if (this.obstacleTest && ['seat', 'sofa', 'bar_stool'].includes(point.type)) {
      const distance = agent.config.capsuleRadius + 0.70;
      let approachClear = false;
      for (let i = 0; i < 24; i++) {
        const angle = i * Math.PI / 12;
        if (!this.obstacleTest(point.position[0] + Math.sin(angle) * distance, point.position[2] + Math.cos(angle) * distance, agent.config.capsuleRadius)) { approachClear = true; break; }
      }
      if (!approachClear) return false;
    }
    if (!nav.reservePoint(point.id, agent.config.id)) return false;
    const pos = agent.controller.group.position;
    const path = nav.findPath(pos.x, pos.z, point.position[0], point.position[2], agent.config.capsuleRadius);
    if (!path.length) { nav.releasePoint(point.id, agent.config.id); return false; }
    if (agent.targetPoint && agent.targetPoint.id !== point.id) nav.releasePoint(agent.targetPoint.id, agent.config.id);
    nav.releasePoint(agent.seatAnchorId, agent.config.id);
    agent.controller.setSitting?.(false);
    agent.isSeated = false;
    agent.path = this.seatRoute(path.map(node => ({ x: node.x, z: node.z })), point);
    agent.pathIndex = 0;
    agent.targetPoint = point;
    agent.state = 'WALKING_TO_BREAK';
    agent.stateTimer = 0;
    return true;
  }

  private followPath(agent: NPCAgent, delta: number, time: number, playerPos: THREE.Vector3): boolean {
    if (agent.pathIndex >= agent.path.length) return true;
    const pos = agent.controller.group.position;
    const target = agent.path[agent.pathIndex];
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const distance = Math.hypot(dx, dz);
    const step = Math.min(distance, agent.config.walkSpeed * delta);
    if (distance < 0.025) {
      agent.pathIndex++;
      return agent.pathIndex >= agent.path.length;
    }
    const dirX = dx / distance;
    const dirZ = dz / distance;
    const radius = agent.config.capsuleRadius;
    // Replan only when a static fixture blocks the direct graph segment. This avoids
    // repeatedly sliding along the edge of a desk while trying to reach its rear seat.
    if (this.obstacleTest && agent.blockedTimer > 0.7) {
      const personBlocks = (x: number, z: number) => {
        if (Math.hypot(x - playerPos.x, z - playerPos.z) < this.peopleRadius(agent) + 0.36) return true;
        for (const other of this.agents.values()) {
          if (other !== agent && Math.hypot(x - other.controller.group.position.x, z - other.controller.group.position.z) < this.peopleRadius(agent) + this.peopleRadius(other) + 0.08) return true;
        }
        return false;
      };
      let replanIndex = agent.pathIndex;
      // A waiting person can occupy a graph waypoint. Pass around them toward
      // the next clear waypoint instead of trying to stand in the same spot.
      while (replanIndex < agent.path.length - 1 && personBlocks(agent.path[replanIndex].x, agent.path[replanIndex].z)) replanIndex++;
      const destination = agent.path[replanIndex];
      const nearSeat = Boolean(agent.targetPoint && ['desk', 'seat', 'sofa', 'bar_stool'].includes(agent.targetPoint.type) &&
        Math.hypot(destination.x - agent.targetPoint.position[0], destination.z - agent.targetPoint.position[2]) < 0.9);
      const detour = NavigationService.getInstance().findObstacleDetour(pos.x, pos.z, destination.x, destination.z, radius,
        (x, z, testRadius) => Boolean(this.obstacleTest?.(x, z, testRadius)) || personBlocks(x, z), nearSeat,
        (x, z) => Boolean(this.tableTest?.(x, z, agent.config.id === 'ameen' ? 0.22 : 0.14)));
      agent.blockedTimer = -2; // Bound retries when a door or another person is in the way.
      if (detour) {
        agent.path.splice(agent.pathIndex, replanIndex - agent.pathIndex + 1, ...detour);
        return false;
      }
    }
    const currentlyInsideFixture = this.obstacleTest?.(pos.x, pos.z, radius) || false;
    const isSeatApproach = agent.targetPoint && ['desk', 'seat', 'sofa', 'bar_stool'].includes(agent.targetPoint.type) &&
      Math.hypot(pos.x - agent.targetPoint.position[0], pos.z - agent.targetPoint.position[2]) < radius + 0.75;
    const canMove = (x: number, z: number) => {
      if (this.tableTest?.(x, z, agent.config.id === 'ameen' ? 0.22 : 0.14)) return false;
      if (!currentlyInsideFixture && !isSeatApproach && this.obstacleTest?.(x, z, radius)) return false;
      const approaches = (otherX: number, otherZ: number, clearance: number) => {
        const next = (x - otherX) ** 2 + (z - otherZ) ** 2;
        const current = (pos.x - otherX) ** 2 + (pos.z - otherZ) ** 2;
        return next < clearance ** 2 && next < current - 1e-8;
      };
      if (approaches(playerPos.x, playerPos.z, this.peopleRadius(agent) + 0.36)) return false;
      for (const other of this.agents.values()) {
        if (other !== agent && approaches(other.controller.group.position.x, other.controller.group.position.z, this.peopleRadius(agent) + this.peopleRadius(other) + 0.08)) return false;
      }
      return true;
    };
    let moveX = 0;
    let moveZ = 0;
    let found = false;
    // Side steps let opposing walkers pass instead of moving through each other.
    for (const angle of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
      const x = pos.x + (dirX * Math.cos(angle) - dirZ * Math.sin(angle)) * step;
      const z = pos.z + (dirZ * Math.cos(angle) + dirX * Math.sin(angle)) * step;
      if (canMove(x, z)) { moveX = x - pos.x; moveZ = z - pos.z; found = true; break; }
    }
    if (!found || step === 0) {
      agent.blockedTimer += delta;
      agent.controller.updateAnimation(time, false);
      return false;
    }
    // Sideways shuffling is not progress toward the waypoint.
    const remaining = Math.hypot(target.x - pos.x - moveX, target.z - pos.z - moveZ);
    agent.blockedTimer = remaining < distance - step * 0.15 ? 0 : agent.blockedTimer + delta;
    pos.x += moveX;
    pos.z += moveZ;
    const facing = Math.atan2(moveX, moveZ);
    const difference = Math.atan2(Math.sin(facing - agent.controller.group.rotation.y), Math.cos(facing - agent.controller.group.rotation.y));
    agent.controller.group.rotation.y += difference * Math.min(1, 10 * delta);
    agent.controller.updateAnimation(time, true, agent.config.walkSpeed / 1.5, false);
    if (Math.hypot(target.x - pos.x, target.z - pos.z) < 0.025) agent.pathIndex++;
    return agent.pathIndex >= agent.path.length;
  }

  private triggerRandomBreak(agent: NPCAgent) {
    if (agent.state !== 'AT_DESK_WORKING' || this.workStatuses.get(agent.config.id) && this.workStatuses.get(agent.config.id) !== 'idle') return;
    if (this.activeBreaksCount >= OFFICE_CONFIG.schedule.maxConcurrentBreaks) return;
    const roll = Math.random();
    if (roll < 0.20 || roll >= 0.70) {
      agent.canteenRequested = true;
      if (!this.startCanteenTrip(agent)) agent.breakCooldownTimer = 20 + Math.random() * 30;
      return;
    }
    const candidates = roll < 0.20
      ? ['canteen_coffee_machine', 'canteen_coffee_queue_1', 'canteen_coffee_queue_2']
      : roll < 0.70
        ? OFFICE_CONFIG.interactionPoints.filter(point => point.room === 'canteen' && ['sofa', 'seat', 'bar_stool'].includes(point.type)).map(point => point.id)
        : ['canteen_food_pickup_1', 'canteen_food_pickup_2', 'canteen_food_pickup_3'];
    for (const id of candidates) {
      const point = OFFICE_CONFIG.interactionPoints.find(item => item.id === id);
      if (point && this.pointIsClear(agent, point) && this.routeToPoint(agent, point)) {
        this.activeBreaksCount++;
        return;
      }
    }
    // Stay seated and retry later when the requested facility is occupied.
    agent.breakCooldownTimer = 30 + Math.random() * 30;
  }

  public commandToCanteen(employeeId: string): 'on-way' | 'queued' | 'already-there' {
    const agent = this.agents.get(employeeId);
    if (!agent) return 'queued';
    if (agent.finishAtSeat && !agent.canteenRequested) return 'already-there';
    agent.canteenRequested = true;
    return this.startCanteenTrip(agent) ? 'on-way' : 'queued';
  }

  private startCanteenTrip(agent: NPCAgent): boolean {
    const busy = this.workStatuses.get(agent.config.id);
    if (busy && busy !== 'idle') return false;
    let away = 0;
    for (const other of this.agents.values()) if (other !== agent && !['AT_DESK_WORKING', 'RETURNING_TO_DESK'].includes(other.state) && !(other.state === 'CHATTING_WITH_PLAYER' && other.previousState === 'AT_DESK_WORKING')) away++;
    if (away >= OFFICE_CONFIG.schedule.maxConcurrentBreaks) return false;
    const nav = NavigationService.getInstance();
    const seats = OFFICE_CONFIG.interactionPoints.filter(point => point.id.startsWith('canteen_dining_'));
    const seat = seats.find(point => !nav.isPointOccupied(point.id, agent.config.id) && this.pointIsClear(agent, point));
    if (!seat || !nav.reservePoint(seat.id, agent.config.id)) return false;
    agent.reservedMealSeatId = seat.id;
    const food = ['canteen_food_pickup_1', 'canteen_food_pickup_2', 'canteen_food_pickup_3'];
    const coffee = ['canteen_coffee_machine', 'canteen_coffee_queue_1', 'canteen_coffee_queue_2'];
    const candidates = Math.random() < 0.4 ? [...coffee, ...food] : [...food, ...coffee];
    for (const id of candidates) {
      const point = OFFICE_CONFIG.interactionPoints.find(item => item.id === id);
      if (point && this.pointIsClear(agent, point) && this.routeToPoint(agent, point)) {
        agent.canteenRequested = false; agent.finishAtSeat = true; agent.previousState = undefined;
        this.activeBreaksCount++; return true;
      }
    }
    nav.releasePoint(seat.id, agent.config.id); agent.reservedMealSeatId = null; return false;
  }

  public handlePlayerCommand(text: string, employeeId: string): string | null {
    if (/^\/canteen(?:\s|$)/i.test(text.trim()) || /(?:come|go|head) to (?:the )?canteen|take (?:a )?(?:lunch|food|coffee) break/i.test(text)) {
      const state = this.commandToCanteen(employeeId);
      return state === 'queued' ? 'I’ll come to the canteen when my current work finishes and a place is free. I’ll collect something, take a seat, and then return to my desk.' : 'I’m heading to the canteen to collect food or coffee, take a seat, and finish my break before returning to my desk.';
    }
    if (this.checkNaturalLanguageCommand(text, employeeId)) return 'I’m returning to my desk.';
    return null;
  }

  private sendToLoungeSeat(agent: NPCAgent) {
    const reserved = OFFICE_CONFIG.interactionPoints.find(point => point.id === agent.reservedMealSeatId);
    if (reserved && this.pointIsClear(agent, reserved) && this.routeToPoint(agent, reserved)) return;
    if (agent.finishAtSeat && reserved) {
      agent.currentActivityDescription = 'Waiting for the reserved dining seat to be clear';
      return;
    }
    const seats = OFFICE_CONFIG.interactionPoints.filter(point => point.room === 'canteen' && ['sofa', 'seat', 'bar_stool'].includes(point.type));
    for (const seat of seats) {
      if (this.pointIsClear(agent, seat) && this.routeToPoint(agent, seat)) return;
    }
    this.commandBackToDesk(agent.config.id);
  }
  private startTargetActivity(agent: NPCAgent, time = 0) {
    if (!agent.targetPoint) return;
    const nav = NavigationService.getInstance();
    if (nav.isPointOccupied(agent.targetPoint.id, agent.config.id)) { this.commandBackToDesk(agent.config.id); return; }
    if (!this.pointIsClear(agent, agent.targetPoint)) { agent.controller.updateAnimation(time, false); return; }

    // Snap position and facing direction directly to target interaction point
    agent.controller.group.position.set(
      agent.targetPoint.position[0],
      0,
      agent.targetPoint.position[2]
    );
    agent.controller.group.rotation.y = agent.targetPoint.facingDirection;

    if (agent.targetPoint.id.startsWith('canteen_coffee_queue_')) {
      agent.state = 'WAITING_FOR_COFFEE';
      agent.stateTimer = 0;
    } else if (agent.targetPoint.type === 'coffee_machine') {
      const choices = REFRESHMENT_ITEMS.filter(item => item.station === 'coffee' || item.id === 'spring-water');
      agent.refreshment = choices[Math.floor(Math.random() * choices.length)];
      agent.state = 'COFFEE';
      agent.stateTimer = 0;
    } else if (agent.targetPoint.type === 'snack_shelf' || agent.targetPoint.type === 'food_serving') {
      const choices = REFRESHMENT_ITEMS.filter(item => item.station === 'buffet' && item.kind === 'food');
      agent.refreshment = choices[Math.floor(Math.random() * choices.length)];
      agent.state = 'SNACK';
      agent.stateTimer = 0;
    } else if (agent.targetPoint.type === 'sofa' || agent.targetPoint.type === 'bar_stool' || agent.targetPoint.type === 'seat') {
      agent.state = 'SITTING_IN_LOUNGE';
      agent.stateTimer = 0;
      this.applySeatPose(agent, agent.targetPoint);
      if (agent.holdingProp !== 'none') {
        agent.controller.setHoldingProp?.(agent.holdingProp, agent.refreshment?.dish);
      }
    }
  }

  public commandBackToDesk(employeeId: string) {
    const agent = this.agents.get(employeeId);
    if (!agent) return;

    if (agent.state === 'AT_DESK_WORKING' || agent.state === 'RETURNING_TO_DESK') {
      return;
    }

    const nav = NavigationService.getInstance();
    agent.canteenRequested = false; agent.finishAtSeat = false;
    if (agent.reservedMealSeatId) nav.releasePoint(agent.reservedMealSeatId, agent.config.id);
    agent.reservedMealSeatId = null;
    if (agent.isSeated && agent.previousState === 'AT_DESK_WORKING') {
      agent.previousState = undefined;
      this.arriveAtDesk(agent);
      return;
    }
    agent.previousState = undefined;

    // Release any reserved interaction points
    if (agent.targetPoint) {
      nav.releasePoint(agent.targetPoint.id, agent.config.id);
      agent.targetPoint = null;
    }

    // Unseat if seated
    if (agent.controller.setSitting) {
      agent.controller.setSitting(false);
    }
    agent.isSeated = false;

    // Find route back to employee's desk
    const deskPoint = OFFICE_CONFIG.interactionPoints.find(p => p.id === agent.seatAnchorId);
    if (!deskPoint) return;

    const curPos = agent.controller.group.position;
    const pathWaypoints = nav.findPath(curPos.x, curPos.z, deskPoint.position[0], deskPoint.position[2], agent.config.capsuleRadius);
    agent.path = this.seatRoute(pathWaypoints.map((n: any) => ({ x: n.x, z: n.z })), deskPoint);
    // Append exact desk chair position
    agent.path.push({ x: deskPoint.position[0], z: deskPoint.position[2] });
    agent.pathIndex = 0;
    agent.targetPoint = deskPoint;
    agent.state = 'RETURNING_TO_DESK';
    agent.stateTimer = 0;
  }

  public commandAllBackToDesks() {
    this.isAllCalledBack = true;
    this.agents.forEach(agent => {
      this.commandBackToDesk(agent.config.id);
    });

    // Reset call-back flag after 60s
    setTimeout(() => {
      this.isAllCalledBack = false;
    }, 60000);
  }

  private arriveAtDesk(agent: NPCAgent) {
    if (!NavigationService.getInstance().reservePoint(agent.seatAnchorId, agent.config.id)) return;
    agent.state = 'AT_DESK_WORKING';
    agent.stateTimer = 0;
    agent.isSeated = true;
    agent.holdingProp = 'none';
    agent.refreshment = null;
    agent.controller.setHoldingProp?.('none');
    agent.breakCooldownTimer = OFFICE_CONFIG.schedule.minBreakIntervalSec + Math.random() *
      (OFFICE_CONFIG.schedule.maxBreakIntervalSec - OFFICE_CONFIG.schedule.minBreakIntervalSec) + (agent.config.id === 'ameen' ? Math.random() * 45 : 0);

    // Snap agent position and rotation directly to their exact desk chair interaction point
    const deskPoint = OFFICE_CONFIG.interactionPoints.find(p => p.id === agent.seatAnchorId);
    if (deskPoint) {
      this.applySeatPose(agent, deskPoint);
    } else {
      agent.controller.group.rotation.y = agent.config.deskRotation + Math.PI;
    }

  }

  public startChatWithPlayer(employeeId: string) {
    const agent = this.agents.get(employeeId);
    if (!agent) return;
    if (agent.state === 'CHATTING_WITH_PLAYER') return;

    agent.previousState = agent.state;
    agent.state = 'CHATTING_WITH_PLAYER';
  }

  public endChatWithPlayer(employeeId: string) {
    const agent = this.agents.get(employeeId);
    if (!agent) return;

    agent.controller.setTalking?.(this.workStatuses.get(employeeId) === 'responding');
    if (agent.state !== 'CHATTING_WITH_PLAYER') return;

    if (agent.previousState) {
      agent.state = agent.previousState;
      agent.previousState = undefined;
    } else {
      agent.state = 'AT_DESK_WORKING';
    }
    if (agent.state === 'AT_DESK_WORKING') {
      const seat = OFFICE_CONFIG.interactionPoints.find(point => point.id === agent.seatAnchorId);
      if (seat) this.applySeatPose(agent, seat);
    } else if (agent.state === 'SITTING_IN_LOUNGE' && agent.targetPoint) this.applySeatPose(agent, agent.targetPoint);
    if (this.workStatuses.get(employeeId) && this.workStatuses.get(employeeId) !== 'idle' && agent.state !== 'AT_DESK_WORKING' && !agent.finishAtSeat) this.commandBackToDesk(employeeId);
  }

  /**
   * Check if natural language user input commands employee back to desk
   */
  public checkNaturalLanguageCommand(text: string, employeeId?: string): boolean {
    const lower = text.toLowerCase();
    const commandPhrases = [
      'come to desk',
      'come to your desk',
      'come back to desk',
      'come back to your desk',
      'come back',
      'go to desk',
      'go to your desk',
      'back to your desk',
      'back to desk',
      'go back to work',
      'back to work',
      'return to your desk',
      'return to desk',
      'return to workstation',
      'sit at desk',
      'sit at your desk',
      'sit down',
      'head back to work',
      'head back',
      'get back to your desk',
      'everyone back',
      'everyone back to desk',
      'all back to desk',
      'all back to your desks',
      'team back to work',
      'team back to desk'
    ];

    const isCommand = commandPhrases.some(phrase => lower.includes(phrase));
    if (isCommand) {
      if (lower.includes('everyone') || lower.includes('all') || lower.includes('team')) {
        this.commandAllBackToDesks();
      } else if (employeeId) {
        this.commandBackToDesk(employeeId);
      }
      return true;
    }
    return false;
  }
}

export const npcBrain = new NPCBrainManager();
