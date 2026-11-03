import { EmployeeWorkManager, workPhase, EmployeeWorkPhase } from './employeeWorkManager';
import { StorageService } from './storage';
import { EmployeeAIService } from './employeeAI';
import { npcBrain } from './npcBrain';
import { SoundEffects } from './audio';

const phases = new Map<string, EmployeeWorkPhase>();
export const employeeWork = new EmployeeWorkManager(StorageService, EmployeeAIService, (employeeId, snapshot) => {
  const phase = workPhase(snapshot);
  if (phases.get(employeeId) === phase) return;
  const previous = phases.get(employeeId);
  phases.set(employeeId, phase);
  npcBrain.setWorkStatus(employeeId, phase);
  window.dispatchEvent(new CustomEvent('employee-speech-state', { detail: { employeeId, isSpeaking: phase === 'responding' } }));
  if (previous && previous !== 'idle' && phase === 'idle' && !snapshot.error) SoundEffects.playNearChime();
});
