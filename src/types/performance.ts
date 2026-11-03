export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameTimeMs: number;
  avgFrameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  jsHeapMB: number;
  totalAssetsMB: number;
  timeToFirstInteractiveMs: number;
  adaptiveTier: 'High' | 'Medium' | 'Low';
  qualityDpr: number;
  shadowMapSize: number;
  state: 'idle' | 'walking' | 'chatting';
  fixedTimestepMs: number;
}

declare global {
  interface Window {
    __DEBUG_METRICS__?: PerformanceMetrics;
    __TOGGLE_PERF_OVERLAY__?: () => void;
  }
}
