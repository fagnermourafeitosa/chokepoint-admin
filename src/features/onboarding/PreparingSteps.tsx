import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import './preparing-steps.css';

// Admin 052: while the first workspace is created, its steps appear one by one. The timing is simulated:
// the creation is one request. The screen stays at least preparingMillis, also when the creation is faster.
const steps = ['Creating the workspace', 'Setting up Sandbox and Production', 'Preparing the Sandbox', 'Opening the Admin'] as const;
const stepMillis = 900;
export const preparingMillis = steps.length * stepMillis;

export function PreparingSteps() {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setDone(n => Math.min(n + 1, steps.length - 1)), stepMillis);
    return () => clearInterval(timer);
  }, []);
  return <ol className="preparing-steps" aria-live="polite">
    {steps.map((step, i) => (
      <li key={step} className={i < done ? 'preparing-step preparing-step--done' : i === done ? 'preparing-step preparing-step--current' : 'preparing-step'}>
        {i < done ? <Check size={16} aria-hidden="true" /> : <span className="cp-admin-status-dot" aria-hidden="true" />}
        {step}
      </li>
    ))}
  </ol>;
}

// Resolves after the minimum time of the steps; started with the request.
export const preparingDelay = () => new Promise(resolve => setTimeout(resolve, preparingMillis));
