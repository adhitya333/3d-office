import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OfficeBuilding } from './OfficeBuilding';
import { OfficeFurniture } from './Furniture';
import { CharacterFactory, CharacterMeshController } from './Character';
import { CollisionManager } from './CollisionManager';
import { DoorManager, InteractiveDoor } from './DoorManager';
import { EMPLOYEES } from '../../data/employees';
import { SITTABLE_CHAIRS } from '../../data/chairs';
import { EmployeeDefinition, SittableChair } from '../../types/office';
import { SoundEffects } from '../../services/audio';
import { NavigationService } from '../../services/navigation';
import { CanteenZone } from './CanteenZone';
import { HighResBoards } from './HighResBoards';
import { npcBrain } from '../../services/npcBrain';
import { OFFICE_CONFIG } from '../../config/office.config';
import { GeometryBatcher } from './GeometryBatcher';
import { nearestRefreshmentStation, RefreshmentKind, RefreshmentStation } from '../../data/refreshments';

interface OfficeCanvasProps {
  isModalOpen: boolean;
  reducedMotion: boolean;
  sensitivity?: number;
  onNearEmployeeChange: (employee: EmployeeDefinition | null) => void;
  onNearDeskChange?: (desk: { employee: EmployeeDefinition; isReturning: boolean } | null) => void;
  onNearChairChange?: (chair: SittableChair | null) => void;
  onNearDoorChange?: (door: { id: string; name: string; isOpen: boolean } | null) => void;
  onNearRefreshmentChange?: (station: RefreshmentStation | null) => void;
  onOpenRefreshments?: (station: RefreshmentStation) => void;
  onSittingChange?: (isSitting: boolean, chair: SittableChair | null) => void;
  onInteract: (employee: EmployeeDefinition) => void;
  onCallToDesk?: (employee: EmployeeDefinition) => void;
  consumeRequest?: { kind: RefreshmentKind; dish?: import('./Food').PlateDish; nonce: number } | null;
  onPlayerPositionUpdate?: (pos: { x: number; z: number; rotation: number }) => void;
  resetTrigger: number;
  sitTrigger?: number;
  standTrigger?: number;
  doorTrigger?: number;
  firstPersonMode?: boolean;
  onToggleFirstPersonMode?: () => void;
  qualityTier?: 'High' | 'Medium' | 'Low';
  onQualityTierChange?: (tier: 'High' | 'Medium' | 'Low') => void;
  onToggleDebugModal?: () => void;
  onLoaded?: () => void;
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = React.memo(({
  isModalOpen,
  reducedMotion,
  sensitivity = 1.0,
  firstPersonMode = false,
  qualityTier = 'High',
  onQualityTierChange,
  onToggleFirstPersonMode,
  onToggleDebugModal,
  onNearEmployeeChange,
  onNearDeskChange,
  onNearChairChange,
  onNearDoorChange,
  onNearRefreshmentChange,
  onOpenRefreshments,
  onSittingChange,
  onInteract,
  onCallToDesk,
  consumeRequest,
  onPlayerPositionUpdate,
  resetTrigger,
  sitTrigger = 0,
  standTrigger = 0,
  doorTrigger = 0,
  onLoaded
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sensitivityRef = useRef<number>(sensitivity);
  const firstPersonModeRef = useRef<boolean>(firstPersonMode);
  const qualityTierRef = useRef<'High' | 'Medium' | 'Low'>(qualityTier);
  const applyQualityRef = useRef<((tier: 'High' | 'Medium' | 'Low') => void) | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);

  useEffect(() => {
    applyQualityRef.current?.(qualityTier);
  }, [qualityTier]);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);
  useEffect(() => {
    firstPersonModeRef.current = firstPersonMode;
  }, [firstPersonMode]);
  // Spawn outside on stone paver walkway facing North towards Verlyn HQ entrance
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 17.5));
  const playerRotRef = useRef<number>(Math.PI);
  const physPrevRef = useRef<{ x: number; z: number }>({ x: 0, z: 17.5 });
  const physCurrRef = useRef<{ x: number; z: number }>({ x: 0, z: 17.5 });
  const nearEmpRef = useRef<EmployeeDefinition | null>(null);
  const nearDeskRef = useRef<{ employee: EmployeeDefinition; isReturning: boolean } | null>(null);
  const nearChairRef = useRef<SittableChair | null>(null);
  const nearDoorRef = useRef<InteractiveDoor | null>(null);
  const nearRefreshmentRef = useRef<RefreshmentStation | null>(null);
  const isSittingRef = useRef<boolean>(false);
  const activeChairRef = useRef<SittableChair | null>(null);
  const standingPositionRef = useRef<THREE.Vector3 | null>(null);

  // Input state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isInteractingLockedRef = useRef<boolean>(false);
  const playerControllerRef = useRef<CharacterMeshController | null>(null);
  const doorManagerRef = useRef<DoorManager | null>(null);
  const collisionManagerRef = useRef<CollisionManager | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lastPosUpdateRef = useRef<number>(0);

  useEffect(() => {
    isInteractingLockedRef.current = isModalOpen;
    if (isModalOpen) {
      keysRef.current = {};
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    }
  }, [isModalOpen]);

  // Handle position reset trigger
  useEffect(() => {
    if (resetTrigger > 0) {
      if (isSittingRef.current) {
        standUp();
      }
      playerPosRef.current.set(0, 0, 17.5);
      playerRotRef.current = Math.PI;
      physPrevRef.current.x = 0;
      physPrevRef.current.z = 17.5;
      physCurrRef.current.x = 0;
      physCurrRef.current.z = 17.5;
    }
  }, [resetTrigger]);

  // External trigger from UI to sit
  useEffect(() => {
    if (sitTrigger > 0 && nearChairRef.current && !isSittingRef.current) {
      sitDown(nearChairRef.current);
    }
  }, [sitTrigger]);

  // External trigger from UI to stand
  useEffect(() => {
    if (standTrigger > 0 && isSittingRef.current) {
      standUp();
    }
  }, [standTrigger]);

  // External trigger from UI to toggle door
  useEffect(() => {
    if (doorTrigger > 0 && doorManagerRef.current) {
      const door = doorManagerRef.current.getNearDoor(playerPosRef.current.x, playerPosRef.current.z, 3.2) || nearDoorRef.current;
      if (door) {
        toggleDoor(door.id);
      }
    }
  }, [doorTrigger]);

  // Animate the chosen item after the menu closes.
  useEffect(() => {
    if (!consumeRequest || consumeRequest.nonce === 0) return;
    if (consumeRequest.kind === 'drink') playerControllerRef.current?.triggerDrink?.();
    else playerControllerRef.current?.triggerEat?.(consumeRequest.dish);
  }, [consumeRequest]);

  const toggleDoor = (doorId: string) => {
    if (!doorManagerRef.current) return;
    const isOpen = doorManagerRef.current.toggleDoor(doorId);
    const updated = doorManagerRef.current.getNearDoor(playerPosRef.current.x, playerPosRef.current.z, 3.2);
    nearDoorRef.current = updated;
    onNearDoorChange?.(updated ? { id: updated.id, name: updated.name, isOpen: updated.isOpen } : null);
  };

  const isSeatAvailable = (chair: SittableChair) => {
    if (NavigationService.getInstance().isPointOccupied(chair.id, 'player')) return false;
    return !npcBrain.getAllAgents().some(agent => Math.hypot(
      agent.controller.group.position.x - chair.position[0],
      agent.controller.group.position.z - chair.position[2]
    ) < (agent.config.id === 'ameen' ? 0.80 : agent.config.capsuleRadius) + 0.36);
  };

  const sitDown = (chair: SittableChair) => {
    if (!isSeatAvailable(chair) || !NavigationService.getInstance().reservePoint(chair.id, 'player')) return;
    standingPositionRef.current = playerPosRef.current.clone();
    isSittingRef.current = true;
    activeChairRef.current = chair;
    playerPosRef.current.set(chair.position[0], 0, chair.position[2]);
    playerRotRef.current = chair.lookDirection;
    physPrevRef.current.x = chair.position[0];
    physPrevRef.current.z = chair.position[2];
    physCurrRef.current.x = chair.position[0];
    physCurrRef.current.z = chair.position[2];
    playerControllerRef.current?.setSitting?.(true, chair.kind === 'sofa', chair.kind === 'bar_stool', chair.seatHeight);
    SoundEffects.playNearChime();
    onSittingChange?.(true, chair);
  };

  const standUp = () => {
    isSittingRef.current = false;
    const chair = activeChairRef.current;
    activeChairRef.current = null;
    playerControllerRef.current?.setSitting?.(false);

    if (chair) {
      NavigationService.getInstance().releasePoint(chair.id, 'player');
      // Step backward away from the desk into the open floor area
      // (Facing direction is towards desk, so -sin / -cos steps backward into the room)
      const stepBackX = -Math.sin(chair.lookDirection) * 0.85;
      const stepBackZ = -Math.cos(chair.lookDirection) * 0.85;
      let targetX = standingPositionRef.current?.x ?? chair.position[0] + stepBackX;
      let targetZ = standingPositionRef.current?.z ?? chair.position[2] + stepBackZ;

      if (collisionManagerRef.current) {
        const safe = collisionManagerRef.current.pushOutOfCollisions(targetX, targetZ, 0, 0.28);
        targetX = safe.x;
        targetZ = safe.z;
      }

      playerPosRef.current.x = targetX;
      playerPosRef.current.z = targetZ;
      physPrevRef.current.x = targetX;
      physPrevRef.current.z = targetZ;
      physCurrRef.current.x = targetX;
      physCurrRef.current.z = targetZ;
    }
    standingPositionRef.current = null;
    SoundEffects.playCloseModal();
    onSittingChange?.(false, null);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const sceneStartedAt = performance.now();
    let firstFrameMs = 0;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38BDF8);
    scene.fog = new THREE.FogExp2(0x7DD3FC, 0.006);

    const camera = new THREE.PerspectiveCamera(
      56,
      mount.clientWidth / mount.clientHeight,
      0.1,
      120
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    rendererRef.current = renderer;

    // Dynamic Quality Tier Manager (High / Medium / Low)
    const applyQualityTier = (tier: 'High' | 'Medium' | 'Low') => {
      const changed = qualityTierRef.current !== tier;
      qualityTierRef.current = tier;
      if (changed) onQualityTierChange?.(tier);
      const ratio = tier === 'High' ? Math.min(window.devicePixelRatio, 1.75) : tier === 'Medium' ? Math.min(window.devicePixelRatio, 1.25) : 1;
      renderer.setPixelRatio(Math.max(1, ratio));
      if (tier === 'High') {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
      } else if (tier === 'Medium') {
        renderer.shadowMap.enabled = false;
      } else {
        renderer.shadowMap.enabled = false;
      }
    };
    applyQualityRef.current = applyQualityTier;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    applyQualityTier(qualityTierRef.current);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // 2. Lighting
    const hemiLight = new THREE.HemisphereLight(0xBAE6FD, 0xF1F5F9, 0.95);
    hemiLight.position.set(0, 26, 0);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFFAF0, 1.25);
    sunLight.position.set(16, 28, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    // 3. Collision Manager
    const collisionManager = new CollisionManager();
    collisionManagerRef.current = collisionManager;
    npcBrain.setObstacleTest((x, z, radius) => collisionManager.isColliding(x, z, 0, radius), (x, z, radius) => collisionManager.isTableColliding(x, z, radius));

    // 4. Doors Manager (4 interactive department room double doors)
    const doorManager = new DoorManager(collisionManager);
    scene.add(doorManager.group);
    doorManagerRef.current = doorManager;

    // 5. Office Architecture & Furniture
    const building = new OfficeBuilding();
    // Batch static building architecture (walls, floor tiles, columns, glass frames) into unified meshes (>70% draw call reduction)
    GeometryBatcher.batchStaticGroup(building.group, m => m.userData?.isDynamic === true);
    scene.add(building.group);

    const furniture = new OfficeFurniture();
    scene.add(furniture.group);

    // 5.1 Canteen & Executive Lounge Room (Consolidate static fixtures into batched geometry for locked 60 FPS)
    const canteenZone = CanteenZone.create();
    GeometryBatcher.batchStaticGroup(canteenZone.group, m => m.userData?.isDynamic === true);
    scene.add(canteenZone.group);

    // 5.2 Static room signage
    const highResBoards = HighResBoards.create();
    scene.add(highResBoards.group);

    // 6. Chair Interaction Floor Rings
    const chairRings: THREE.Mesh[] = [];
    SITTABLE_CHAIRS.forEach(chair => {
      const ringGeo = new THREE.RingGeometry(0.32, 0.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38BDF8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(chair.position[0], 0.02, chair.position[2]);
      scene.add(ring);
      chairRings.push(ring);
    });

    // 7. Employee Avatars & Autonomous Brain Registration
    const employeeControllers: {
      emp: EmployeeDefinition;
      controller: CharacterMeshController & { billboard: THREE.Mesh };
    }[] = [];

    EMPLOYEES.forEach(emp => {
      const empConfig = OFFICE_CONFIG.employees.find(e => e.id === emp.id) || (emp as any);
      const empController = CharacterFactory.createEmployeeAvatar(empConfig);
      scene.add(empController.group);
      employeeControllers.push({ emp, controller: empController });
      npcBrain.registerAgent(empConfig, empController);
    });

    // 8. Player Avatar
    const playerController = CharacterFactory.createPlayerAvatar();
    scene.add(playerController.group);
    playerControllerRef.current = playerController;

    // Navigation & Clearance Debug Visualizer ([N] Key)
    const navService = NavigationService.getInstance();
    const navDebugGroup = navService.buildDebugGroup();
    scene.add(navDebugGroup);

    let lastNearDoorId: string | null = null;
    let lastNearDoorIsOpen: boolean = false;

    // Third-person camera state & zoom
    let cameraAngle = 0;
    let cameraPitch = 0.36;
    let targetCameraDistance = 4.6;
    let currentCameraDistance = 4.6;
    const targetFov = 56;
    let modeBlend = firstPersonModeRef.current ? 1.0 : 0.0;

    // First-person mouse look state (when seated)
    let fpYaw = 0;
    let fpPitch = 0;

    // Jump Physics State
    let playerPosY = 0;
    let playerVelY = 0;
    let isJumping = false;
    let currentBaseGroundY = 0;

    const onClick = () => {
      if (coarsePointer) return;
      if (!isInteractingLockedRef.current && document.pointerLockElement !== mount) {
        mount.requestPointerLock?.()?.catch(() => {});
      }
    };

    const rotateCamera = (dx: number, dy: number) => {
      if (isInteractingLockedRef.current) return;
      dx = Math.max(-120, Math.min(120, dx));
      dy = Math.max(-120, Math.min(120, dy));

      const sens = sensitivityRef.current;
      if (isSittingRef.current && firstPersonModeRef.current) {
        fpYaw -= dx * 0.0032 * sens;
        fpPitch = Math.max(-0.85, Math.min(0.75, fpPitch - dy * 0.0032 * sens));
      } else if (firstPersonModeRef.current) {
        // Zero-lag crispy FPS mouse look
        cameraAngle -= dx * 0.0032 * sens;
        cameraPitch = Math.max(-1.40, Math.min(1.40, cameraPitch + dy * 0.0030 * sens));
      } else {
        cameraAngle -= dx * 0.0035 * sens;
        cameraPitch = Math.max(0.18, Math.min(1.15, cameraPitch + dy * 0.0028 * sens));
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === mount) rotateCamera(event.movementX ?? 0, event.movementY ?? 0);
    };
    let lookPointer: { id: number; x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (isInteractingLockedRef.current || lookPointer || document.pointerLockElement === mount) return;
      if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 2) return;
      lookPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      mount.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!lookPointer || event.pointerId !== lookPointer.id) return;
      rotateCamera(event.clientX - lookPointer.x, event.clientY - lookPointer.y);
      lookPointer.x = event.clientX;
      lookPointer.y = event.clientY;
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (lookPointer?.id === event.pointerId) lookPointer = null;
    };
    const onTouchMovement = (event: Event) => {
      const input = (event as CustomEvent<{ code: string; pressed: boolean }>).detail;
      if (!input) return;
      if (input.pressed && isSittingRef.current && !isInteractingLockedRef.current) {
        standUp();
        return;
      }
      keysRef.current[input.code] = !isInteractingLockedRef.current && input.pressed;
    };
    const clearMovement = () => { keysRef.current = {}; lookPointer = null; };

    const onWheel = (event: WheelEvent) => {
      if (isInteractingLockedRef.current || event.deltaY === 0) return;
      if (event.target instanceof Element && event.target.closest('header, aside, button, input, textarea, select, [role="dialog"]')) return;
      event.preventDefault();
      if (firstPersonModeRef.current) {
        if (event.deltaY > 0) {
          targetCameraDistance = 2.8;
          onToggleFirstPersonMode?.();
        }
        return;
      }
      targetCameraDistance = Math.max(2.4, Math.min(7.5, targetCameraDistance + Math.sign(event.deltaY) * 0.5));
      if (targetCameraDistance <= 2.4 && event.deltaY < 0) onToggleFirstPersonMode?.();
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    mount.addEventListener('click', onClick);
    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('pointermove', onPointerMove);
    mount.addEventListener('pointerup', onPointerEnd);
    mount.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('office-move-input', onTouchMovement);
    window.addEventListener('blur', clearMovement);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, { passive: false });
    mount.addEventListener('contextmenu', onContextMenu);

    // Keyboard Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (isInteractingLockedRef.current) return;
      if (e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) return;

      const code = e.code;
      if (e.repeat && ['KeyF', 'KeyE', 'KeyQ', 'KeyV', 'KeyC', 'KeyR'].includes(code)) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(code)) {
        if (isSittingRef.current && code !== 'ShiftLeft' && code !== 'ShiftRight') {
          standUp();
          return;
        }
        keysRef.current[code] = true;
      }

      // 'KeyB': Toggle NPC Autonomous Life & Brain Debug Inspector
      if (code === 'KeyB') {
        onToggleDebugModal?.();
        SoundEffects.playNearChime();
        return;
      }

      // 'F' Key: Toggle Sit / Stand
      if (code === 'KeyF') {
        if (isSittingRef.current) {
          standUp();
        } else if (nearChairRef.current) {
          sitDown(nearChairRef.current);
        }
      }

      // 'Space' Key: Stand up if sitting, JUMP if walking!
      if (code === 'Space') {
        if (isSittingRef.current) {
          standUp();
        } else if (!isJumping && Math.abs(playerPosY - currentBaseGroundY) <= 0.12) {
          playerVelY = 8.4; // Crispy, responsive jump velocity
          isJumping = true;
          SoundEffects.playOpenModal();
        }
      }

      // 'Q' Key to open/close doors!
      if (code === 'KeyQ') {
        const door = doorManagerRef.current?.getNearDoor(playerPosRef.current.x, playerPosRef.current.z, 3.2) || nearDoorRef.current;
        if (door) {
          toggleDoor(door.id);
          return;
        }
      }

      // 'E' Key opens the nearest refreshment station or an employee conversation.
      if (code === 'KeyE') {
        if (nearRefreshmentRef.current && !isSittingRef.current) {
          onOpenRefreshments?.(nearRefreshmentRef.current);
          return;
        }
        if (nearEmpRef.current) {
          SoundEffects.playOpenModal();
          onInteract(nearEmpRef.current);
        }
      }

      // Call an employee back from their own desk when it is empty.
      if (code === 'KeyC' && nearDeskRef.current && !nearDeskRef.current.isReturning) {
        onCallToDesk?.(nearDeskRef.current.employee);
      }

      // 'KeyV': Toggle First Person / Third Person walking mode!
      if (code === 'KeyV') {
        onToggleFirstPersonMode?.();
        SoundEffects.playNearChime();
      }

      // 'KeyN': Toggle Navigation Graph, Door Sensors & Seat Anchors Debug Visualizer!
      if (code === 'KeyN') {
        navService.toggleDebug();
        SoundEffects.playNearChime();
      }

      // 'KeyR' for reset position
      if (code === 'KeyR') {
        if (isSittingRef.current) {
          standUp();
        }
        playerPosRef.current.set(0, 0, 17.5);
        playerRotRef.current = Math.PI;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (keysRef.current[code]) {
        keysRef.current[code] = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Employee speech animation state listener for streaming chat
    const onSpeechState = (e: any) => {
      const { employeeId, isSpeaking } = e.detail || {};
      const found = employeeControllers.find(c => c.emp.id === employeeId);
      if (found) {
        found.controller.setTalking?.(isSpeaking);
      }
    };
    window.addEventListener('employee-speech-state', onSpeechState);

    // Resize Handler
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      applyQualityTier(qualityTierRef.current);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onResize);
    document.addEventListener('webkitfullscreenchange', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    // Animation & Render Loop
    let clock = new THREE.Clock();
    let animFrameId: number;
    let cameraBlend = 0;

    let playerVelX = 0;
    let playerVelZ = 0;

    // Fixed Timestep Accumulator (60Hz = 16.667ms) for deterministic physics & zero jitter
    const FIXED_TIMESTEP = 1 / 60;
    let physicsAccumulator = 0;

    // Real-Time WebGL Telemetry State
    let perfFrameCount = 0;
    let perfLastTime = performance.now();
    let perfRollingFps = 60;
    let perfMinFps = 60;
    let perfMaxFps = 60;
    let perfRollingFrameTime = 16.6;
    let perfTotalFrames = 0;
    let perfTotalTime = 0;

    const camFollowPos = new THREE.Vector3(0, 3.2, 29.8);
    const camFollowLook = new THREE.Vector3(0, 1.15, 24.5);
    const tempCamLocal = new THREE.Vector3();
    // Static architecture never changes transforms; avoid recalculating it on camera turns.
    for (const root of [building.group, furniture.group, canteenZone.group, highResBoards.group]) {
      root.traverse(object => {
        if (object.userData.isDynamic) return;
        object.updateMatrix();
        object.matrixAutoUpdate = false;
      });
    }
    scene.updateMatrix();
    scene.matrixAutoUpdate = false;
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material.transparent) material.forceSinglePass = true;
      }
    });
    let lastProximityCheckTime = 0;
    let lastChairPulseTime = 0;

    // Pre-compile and warm up shaders to eliminate any initial frame drops
    try {
      renderer.compile(scene, camera);
      renderer.render(scene, camera);
      if (!firstFrameMs) firstFrameMs = performance.now() - sceneStartedAt;
    } catch {
      // Fallback if context is pending
    }
    requestAnimationFrame(() => {
      onLoaded?.();
    });

    const render = () => {
      animFrameId = requestAnimationFrame(render);
      if (document.hidden) {
        clock.getDelta();
        perfLastTime = performance.now();
        perfFrameCount = 0;
        return;
      }
      const rawDelta = clock.getDelta();
      // Clamp delta max 0.05s against tab-switch spikes
      const delta = Math.min(rawDelta, 0.05);
      const time = clock.getElapsedTime();

      // Update Furniture & Monitor Textures (1Hz)
      furniture.update(time);

      // Update steam and the low-frequency clock.
      canteenZone.update(time, reducedMotionRef.current ? 0 : delta);

      // Update NPC Autonomous Brain & Locomotion
      npcBrain.update(delta, time, playerPosRef.current);

      // Update Auto Doors Proximity Sensors for autonomous NPCs only (player manually controls doors with [Q])
      const npcPositions = employeeControllers.map(c => ({
        x: c.controller.group.position.x,
        z: c.controller.group.position.z
      }));
      doorManager.updateAutoDoors(npcPositions, delta);
      doorManager.update(delta, time);

      // Orient billboards towards camera accurately in world space (upright billboard with zero mirroring)
      employeeControllers.forEach(({ controller }) => {
        controller.billboard.getWorldPosition(tempCamLocal);
        controller.billboard.lookAt(camera.position.x, tempCamLocal.y, camera.position.z);
      });

      // Pulse chair floor rings (10Hz throttle)
      if (time - lastChairPulseTime >= 0.1) {
        lastChairPulseTime = time;
        chairRings.forEach(ring => {
          ring.scale.setScalar(reducedMotionRef.current ? 1 : 1 + Math.sin(time * 3) * 0.06);
        });
      }

      // ================= ZERO-LAG RESPONSIVE INPUT =================
      let inputX = 0;
      let inputZ = 0;

      if (!isInteractingLockedRef.current && !isSittingRef.current) {
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) inputZ -= 1;
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) inputZ += 1;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) inputX -= 1;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) inputX += 1;
      }

      const isInputActive = inputX !== 0 || inputZ !== 0;
      let targetVelX = 0;
      let targetVelZ = 0;

      if (isInputActive && !isSittingRef.current) {
        const invLen = 1 / Math.sqrt(inputX * inputX + inputZ * inputZ);
        const normX = inputX * invLen;
        const normZ = inputZ * invLen;

        const forwardX = -Math.sin(cameraAngle);
        const forwardZ = -Math.cos(cameraAngle);
        const rightX = Math.cos(cameraAngle);
        const rightZ = -Math.sin(cameraAngle);

        const moveDirX = normX * rightX - normZ * forwardX;
        const moveDirZ = normX * rightZ - normZ * forwardZ;

        const isSprinting = Boolean(keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight']);
        const moveSpeed = isSprinting ? 8.4 : 6.0;
        targetVelX = moveDirX * moveSpeed;
        targetVelZ = moveDirZ * moveSpeed;
      }

      // Smooth frame-rate independent velocity acceleration & deceleration (eliminates instant key-release snap!)
      const accelRate = isInputActive ? 28.0 : 36.0;
      const velBlend = 1 - Math.exp(-accelRate * delta);
      playerVelX += (targetVelX - playerVelX) * velBlend;
      playerVelZ += (targetVelZ - playerVelZ) * velBlend;
      if (!isInputActive && Math.abs(playerVelX) < 0.005 && Math.abs(playerVelZ) < 0.005) {
        playerVelX = 0;
        playerVelZ = 0;
      }

      const speedSqr = playerVelX * playerVelX + playerVelZ * playerVelZ;
      const isMoving = speedSqr > 0.005;

      // ================= 60HZ FIXED TIMESTEP SIMULATION =================
      currentBaseGroundY = 0;

      if (isSittingRef.current) {
        physPrevRef.current.x = playerPosRef.current.x;
        physPrevRef.current.z = playerPosRef.current.z;
        physCurrRef.current.x = playerPosRef.current.x;
        physCurrRef.current.z = playerPosRef.current.z;
        physicsAccumulator = 0;
        playerVelX = 0;
        playerVelZ = 0;
      } else {
        physicsAccumulator += delta;
        if (physicsAccumulator > FIXED_TIMESTEP * 3) {
          physicsAccumulator = FIXED_TIMESTEP * 3; // Prevent accumulator spiral on heavy pauses
        }

        while (physicsAccumulator >= FIXED_TIMESTEP) {
          physPrevRef.current.x = physCurrRef.current.x;
          physPrevRef.current.z = physCurrRef.current.z;

          if (isMoving) {
            const nextX = physCurrRef.current.x + playerVelX * FIXED_TIMESTEP;
            const nextZ = physCurrRef.current.z + playerVelZ * FIXED_TIMESTEP;

            const resolved = collisionManager.resolveMovement(
              physCurrRef.current.x,
              physCurrRef.current.z,
              nextX,
              nextZ,
              playerPosY,
              0.28
            );
            physCurrRef.current.x = resolved.x;
            physCurrRef.current.z = resolved.z;
          }

          // Jump & Gravity physics on fixed step
          if (isJumping || playerPosY > currentBaseGroundY) {
            const gravity = 24.0;
            playerVelY -= gravity * FIXED_TIMESTEP;
            playerPosY += playerVelY * FIXED_TIMESTEP;
            if (playerPosY <= currentBaseGroundY) {
              playerPosY = currentBaseGroundY;
              playerVelY = 0;
              isJumping = false;
            }
          } else if (playerPosY < currentBaseGroundY) {
            playerPosY += (currentBaseGroundY - playerPosY) * Math.min(1, 28 * FIXED_TIMESTEP);
          }

          physicsAccumulator -= FIXED_TIMESTEP;
        }

        // Smooth render interpolation between physics ticks
        const alpha = Math.min(1.0, Math.max(0.0, physicsAccumulator / FIXED_TIMESTEP));
        playerPosRef.current.x = physPrevRef.current.x + (physCurrRef.current.x - physPrevRef.current.x) * alpha;
        playerPosRef.current.z = physPrevRef.current.z + (physCurrRef.current.z - physPrevRef.current.z) * alpha;
      }
      playerPosRef.current.y = playerPosY;

      if (isMoving && !isSittingRef.current) {
        if (firstPersonModeRef.current) {
          playerRotRef.current = cameraAngle + Math.PI;
        } else {
          const targetRot = Math.atan2(playerVelX, playerVelZ);
          let diff = targetRot - playerRotRef.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          playerRotRef.current += diff * Math.min(1, 28 * delta);
        }

        if (isInputActive && Math.abs(playerPosY - currentBaseGroundY) <= 0.08) {
          SoundEffects.playFootstep();
        }
      } else if (!isInputActive && firstPersonModeRef.current) {
        playerRotRef.current = cameraAngle + Math.PI;
      }

      // Update Player Mesh transform
      playerController.group.position.set(
        playerPosRef.current.x,
        playerPosY,
        playerPosRef.current.z
      );
      playerController.group.rotation.y = playerRotRef.current;
      playerController.updateAnimation(time, isMoving, 1.0, isJumping || Math.abs(playerPosY - currentBaseGroundY) > 0.08);

      // ================= CAMERA & VIEW SYSTEM =================
      // Smooth dynamic zoom distance & field of view
      currentCameraDistance += (targetCameraDistance - currentCameraDistance) * (1 - Math.exp(-22 * delta));
      if (Math.abs(targetFov - camera.fov) > 0.02) {
        camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-18 * delta));
        camera.updateProjectionMatrix();
      }

      // Smooth 0.35s mode transition between 1st Person and 3rd Person (no snapping!)
      const targetMode = firstPersonModeRef.current ? 1.0 : 0.0;
      modeBlend += (targetMode - modeBlend) * (1 - Math.exp(-14 * delta));

      const targetBlend = isSittingRef.current && firstPersonModeRef.current ? 1.0 : 0.0;
      cameraBlend += (targetBlend - cameraBlend) * (1 - Math.exp(-14 * delta));

      // 1. Third Person Target Position & LookAt
      const tpCamDist = currentCameraDistance;
      const rawTpCamX = playerPosRef.current.x + Math.sin(cameraAngle) * tpCamDist * Math.cos(cameraPitch);
      const rawTpCamZ = playerPosRef.current.z + Math.cos(cameraAngle) * tpCamDist * Math.cos(cameraPitch);
      const rawTpCamY = playerPosY + 1.25 + Math.sin(cameraPitch) * tpCamDist;

      // Prevent camera clipping through walls via AABB raycasting
      const rayResult = collisionManager.raycastCamera(
        playerPosRef.current.x,
        playerPosY + 1.4,
        playerPosRef.current.z,
        rawTpCamX,
        rawTpCamY,
        rawTpCamZ,
        0.28
      );
      const tpCamX = rayResult.hit ? rayResult.x : rawTpCamX;
      const tpCamY = rayResult.hit ? rayResult.y : rawTpCamY;
      const tpCamZ = rayResult.hit ? rayResult.z : rawTpCamZ;

      const tpLookX = playerPosRef.current.x;
      const tpLookY = isSittingRef.current ? (activeChairRef.current?.seatHeight ?? 0.5175) + 0.65 : playerPosY + 1.15;
      const tpLookZ = playerPosRef.current.z;

      // 2. First Person Target (Standing Eye Level)
      const fwdX = -Math.sin(cameraAngle) * Math.cos(cameraPitch);
      const fwdY = -Math.sin(cameraPitch);
      const fwdZ = -Math.cos(cameraAngle) * Math.cos(cameraPitch);

      const eyeHeight = 1.62;
      const fpWalkCamX = playerPosRef.current.x;
      const fpWalkCamY = playerPosY + eyeHeight;
      const fpWalkCamZ = playerPosRef.current.z;

      const fpWalkLookX = playerPosRef.current.x + fwdX * 5.0;
      const fpWalkLookY = playerPosY + eyeHeight + fwdY * 5.0;
      const fpWalkLookZ = playerPosRef.current.z + fwdZ * 5.0;

      // Smooth blend between 3rd Person and 1st Person walking modes
      const walkCamX = tpCamX + (fpWalkCamX - tpCamX) * modeBlend;
      const walkCamY = tpCamY + (fpWalkCamY - tpCamY) * modeBlend;
      const walkCamZ = tpCamZ + (fpWalkCamZ - tpCamZ) * modeBlend;

      const walkLookX = tpLookX + (fpWalkLookX - tpLookX) * modeBlend;
      const walkLookY = tpLookY + (fpWalkLookY - tpLookY) * modeBlend;
      const walkLookZ = tpLookZ + (fpWalkLookZ - tpLookZ) * modeBlend;

      // 3. Seated Target (Eye level at chair, locked directly onto the opposite employee!)
      const activeChair = activeChairRef.current || nearChairRef.current;
      const seatedCamX = playerPosRef.current.x;
      const seatedCamY = (activeChair?.seatHeight ?? 0.5175) + 0.74;
      const seatedCamZ = playerPosRef.current.z;

      let seatedLookX = 0;
      let seatedLookY = 1.22;
      let seatedLookZ = 0;

      const baseDirection = activeChair ? activeChair.lookDirection : playerRotRef.current;
      const seatedYaw = baseDirection + fpYaw;
      seatedLookX = seatedCamX + Math.sin(seatedYaw) * Math.cos(fpPitch) * 4;
      seatedLookY = seatedCamY + Math.sin(fpPitch) * 4;
      seatedLookZ = seatedCamZ + Math.cos(seatedYaw) * Math.cos(fpPitch) * 4;
      // Final Target Positions blended with sitting transition
      const targetCamX = walkCamX + (seatedCamX - walkCamX) * cameraBlend;
      const targetCamY = walkCamY + (seatedCamY - walkCamY) * cameraBlend;
      const targetCamZ = walkCamZ + (seatedCamZ - walkCamZ) * cameraBlend;

      const targetLookX = walkLookX + (seatedLookX - walkLookX) * cameraBlend;
      const targetLookY = walkLookY + (seatedLookY - walkLookY) * cameraBlend;
      const targetLookZ = walkLookZ + (seatedLookZ - walkLookZ) * cameraBlend;

      // Hide player mesh in first person or when seated.
      playerController.group.visible = (modeBlend < 0.85) && (cameraBlend < 0.15);

      if (modeBlend > 0.95 && cameraBlend < 0.05) {
        // First-Person Mode: Sub-pixel camera position damping (filters physics micro-ticks & eliminates judder)
        const fpPosAlpha = 1 - Math.exp(-48 * delta);
        camFollowPos.x += (targetCamX - camFollowPos.x) * fpPosAlpha;
        camFollowPos.y += (targetCamY - camFollowPos.y) * fpPosAlpha;
        camFollowPos.z += (targetCamZ - camFollowPos.z) * fpPosAlpha;

        // Instant crisp mouse-look from smoothed camera eye position
        camFollowLook.x = camFollowPos.x + fwdX * 5.0;
        camFollowLook.y = camFollowPos.y + fwdY * 5.0;
        camFollowLook.z = camFollowPos.z + fwdZ * 5.0;
      } else {
        const camLerpAlpha = 1 - Math.exp(-38 * delta);
        camFollowPos.x += (targetCamX - camFollowPos.x) * camLerpAlpha;
        camFollowPos.y += (targetCamY - camFollowPos.y) * camLerpAlpha;
        camFollowPos.z += (targetCamZ - camFollowPos.z) * camLerpAlpha;

        const lookLerpAlpha = 1 - Math.exp(-42 * delta);
        camFollowLook.x += (targetLookX - camFollowLook.x) * lookLerpAlpha;
        camFollowLook.y += (targetLookY - camFollowLook.y) * lookLerpAlpha;
        camFollowLook.z += (targetLookZ - camFollowLook.z) * lookLerpAlpha;
      }

      camera.position.copy(camFollowPos);
      camera.lookAt(camFollowLook);

      // ================= PROXIMITY CHECKS (10Hz Throttled: Eliminates 60Hz React state churn & thread contention) =================
      if (time - lastProximityCheckTime >= 0.1) {
        lastProximityCheckTime = time;

        const currentNearDoor = doorManager.getNearDoor(playerPosRef.current.x, playerPosRef.current.z, 3.2);
        const curDoorId = currentNearDoor ? currentNearDoor.id : null;
        const curDoorOpen = currentNearDoor ? currentNearDoor.isOpen : false;
        if (curDoorId !== lastNearDoorId || curDoorOpen !== lastNearDoorIsOpen) {
          lastNearDoorId = curDoorId;
          lastNearDoorIsOpen = curDoorOpen;
          nearDoorRef.current = currentNearDoor;
          onNearDoorChange?.(
            currentNearDoor
              ? { id: currentNearDoor.id, name: currentNearDoor.name, isOpen: currentNearDoor.isOpen }
              : null
          );
        }

        let closestChair: SittableChair | null = null;
        let closestChairDist = 1.8;

        if (!isSittingRef.current) {
          SITTABLE_CHAIRS.forEach(chair => {
            if (!isSeatAvailable(chair)) return;
            const dx = playerPosRef.current.x - chair.position[0];
            const dz = playerPosRef.current.z - chair.position[2];
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestChairDist) {
              closestChairDist = dist;
              closestChair = chair;
            }
          });
        } else {
          closestChair = activeChairRef.current;
        }

        if (closestChair !== nearChairRef.current) {
          nearChairRef.current = closestChair;
          onNearChairChange?.(closestChair);
        }

        let closestEmp: EmployeeDefinition | null = null;
        let closestDist = 2.8;

        employeeControllers.forEach(({ emp, controller }) => {
          const charPos = controller.group.position;
          const dx = playerPosRef.current.x - charPos.x;
          const dz = playerPosRef.current.z - charPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist < closestDist) {
            closestDist = dist;
            closestEmp = emp;
          }
        });

        if (closestEmp !== nearEmpRef.current) {
          if (closestEmp && !nearEmpRef.current && !isSittingRef.current) {
            SoundEffects.playNearChime();
          }
          nearEmpRef.current = closestEmp;
          onNearEmployeeChange(closestEmp);
        }

        let closestDesk: { employee: EmployeeDefinition; isReturning: boolean } | null = null;
        let closestDeskDist = 2.9;
        for (const emp of EMPLOYEES) {
          const agent = npcBrain.getAgent(emp.id);
          if (!agent || agent.state === 'AT_DESK_WORKING') continue;

          const seat = OFFICE_CONFIG.interactionPoints.find(point => point.id === agent.seatAnchorId);
          if (!seat) continue;
          const employeeDistance = Math.hypot(
            agent.controller.group.position.x - seat.position[0],
            agent.controller.group.position.z - seat.position[2]
          );
          if (employeeDistance < 1.1) continue;

          const deskDistance = Math.hypot(
            playerPosRef.current.x - emp.deskPosition[0],
            playerPosRef.current.z - emp.deskPosition[2]
          );
          if (deskDistance < closestDeskDist) {
            closestDeskDist = deskDistance;
            closestDesk = { employee: emp, isReturning: agent.state === 'RETURNING_TO_DESK' };
          }
        }

        if (closestDesk?.employee.id !== nearDeskRef.current?.employee.id ||
            closestDesk?.isReturning !== nearDeskRef.current?.isReturning) {
          nearDeskRef.current = closestDesk;
          onNearDeskChange?.(closestDesk);
        }

        const nearStation = !isSittingRef.current && Math.abs(playerPosY) < 1
          ? nearestRefreshmentStation(playerPosRef.current.x, playerPosRef.current.z)
          : null;
        if (nearStation?.id !== nearRefreshmentRef.current?.id) {
          nearRefreshmentRef.current = nearStation;
          onNearRefreshmentChange?.(nearStation);
        }
      }

      // Notify Minimap via zero-overhead DOM custom event (eliminating React root tree re-renders!)
      const now = performance.now();
      if (now - lastPosUpdateRef.current > 60) {
        lastPosUpdateRef.current = now;
        window.dispatchEvent(new CustomEvent('player-position-update', {
          detail: {
            x: playerPosRef.current.x,
            z: playerPosRef.current.z,
            rotation: playerRotRef.current
          }
        }));
      }

      renderer.render(scene, camera);

      // ================= REAL-TIME WEBGL TELEMETRY & ADAPTIVE MONITOR =================
      perfFrameCount++;
      perfTotalFrames++;
      const frameEnd = performance.now();
      const elapsed = frameEnd - perfLastTime;
      if (elapsed >= 250) {
        perfRollingFps = (perfFrameCount * 1000) / elapsed;
        perfRollingFrameTime = elapsed / perfFrameCount;
        perfMinFps = Math.min(perfMinFps, perfRollingFps);
        perfMaxFps = Math.max(perfMaxFps, perfRollingFps);
        perfTotalTime += elapsed;
        const avgFps = (perfTotalFrames * 1000) / perfTotalTime;

        const mem = (performance as any).memory;
        const heapMB = mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;

        window.__DEBUG_METRICS__ = {
          fps: perfRollingFps,
          avgFps,
          minFps: perfMinFps,
          maxFps: perfMaxFps,
          frameTimeMs: perfRollingFrameTime,
          avgFrameTimeMs: perfTotalTime / perfTotalFrames,
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          jsHeapMB: heapMB,
          totalAssetsMB: performance.getEntriesByType('resource').reduce((bytes, resource) => bytes + ((resource as PerformanceResourceTiming).encodedBodySize || 0), 0) / (1024 * 1024),
          timeToFirstInteractiveMs: firstFrameMs,
          adaptiveTier: qualityTierRef.current,
          qualityDpr: renderer.getPixelRatio(),
          shadowMapSize: sunLight.shadow.mapSize.width,
          state: isMoving ? 'walking' : (isInteractingLockedRef.current ? 'chatting' : 'idle'),
          fixedTimestepMs: 16.67
        };

        perfFrameCount = 0;
        perfLastTime = frameEnd;
      }
    };

    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      mount.removeEventListener('click', onClick);
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerup', onPointerEnd);
      mount.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('office-move-input', onTouchMovement);
      window.removeEventListener('blur', clearMovement);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      mount.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('employee-speech-state', onSpeechState);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onResize);
      document.removeEventListener('webkitfullscreenchange', onResize);
      resizeObserver.disconnect();

      npcBrain.clearAgents();
      NavigationService.getInstance().releaseAllForNpc('player');
      applyQualityRef.current = null;
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) {
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
            materials.add(material);
            Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
          });
        }
      });
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
      geometries.forEach(geometry => geometry.dispose());
      renderer.dispose();
      rendererRef.current = null;
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-default select-none outline-none touch-none"
    />
  );
});
