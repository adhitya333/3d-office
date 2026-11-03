import { useCallback, useSyncExternalStore } from 'react';
import { employeeWork } from '../services/employeeWork';

export const useEmployeeWork = (employeeId: string) => {
  const subscribe = useCallback((listener: () => void) => employeeWork.subscribe(employeeId, listener), [employeeId]);
  const getSnapshot = useCallback(() => employeeWork.getSnapshot(employeeId), [employeeId]);
  return useSyncExternalStore(subscribe, getSnapshot);
};
