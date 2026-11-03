import React, { useEffect, useState } from 'react';
import { employeeWork } from '../../services/employeeWork';
import { EMPLOYEES } from '../../data/employees';
import { EmployeeDefinition } from '../../types/office';

export const EmployeeWorkIndicator: React.FC<{ onOpenEmployee: (employee: EmployeeDefinition) => void }> = ({ onOpenEmployee }) => {
  const [jobs, setJobs] = useState(() => employeeWork.getActiveEmployees());
  useEffect(() => employeeWork.subscribeAll(() => {
    const next = employeeWork.getActiveEmployees();
    setJobs(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  }), []);
  if (!jobs.length) return null;
  return (
    <div className="absolute top-36 left-4 z-20 max-w-[calc(100vw-2rem)] flex flex-wrap gap-2" aria-label="Employees working in background">
      {jobs.map(job => {
        const employee = EMPLOYEES.find(item => item.id === job.employeeId);
        if (!employee) return null;
        return <button key={job.employeeId} onClick={() => onOpenEmployee(employee)} className="flex items-center gap-2 rounded-lg border border-[#657b69] bg-[#1b2923]/95 px-3 py-2 text-xs text-[#dce9db] shadow-lg"><span className="w-1.5 h-1.5 rounded-full bg-[#b5cda9]" />{employee.name} · {job.phase === 'thinking' ? 'Thinking…' : job.phase === 'responding' ? 'Responding…' : 'Working…'}</button>;
      })}
    </div>
  );
};
