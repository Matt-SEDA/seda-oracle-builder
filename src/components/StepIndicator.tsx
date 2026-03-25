'use client';

import { WizardStep } from '@/lib/types';

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: 'Data Source' },
  { step: 2, label: 'Logic' },
  { step: 3, label: 'Build & Deploy' },
  { step: 4, label: 'Connect' },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

interface Props {
  currentStep: WizardStep;
  completedSteps: number[];
}

export default function StepIndicator({ currentStep, completedSteps }: Props) {
  return (
    <div className="step-indicator fade-up">
      {STEPS.map(({ step, label }, i) => {
        const isActive = step === currentStep;
        const isCompleted = completedSteps.includes(step);
        const isLast = i === STEPS.length - 1;

        return (
          <div
            key={step}
            className={`step-indicator__item ${isActive ? 'step-indicator__item--active' : ''} ${isCompleted ? 'step-indicator__item--completed' : ''}`}
          >
            <div className="step-indicator__circle">
              {isCompleted ? <CheckIcon /> : step}
            </div>
            <span className="step-indicator__label">{label}</span>
            {!isLast && <div className="step-indicator__line" />}
          </div>
        );
      })}
    </div>
  );
}
