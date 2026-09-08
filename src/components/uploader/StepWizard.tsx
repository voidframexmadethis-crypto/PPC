import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface StepWizardProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const StepWizard: React.FC<StepWizardProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex justify-between items-center w-full mb-8 overflow-x-auto pb-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <button
            key={step}
            onClick={() => onStepClick(index)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isCurrent 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50' 
                : isCompleted 
                  ? 'text-emerald-500' 
                  : 'text-neutral-500'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isCurrent ? 'bg-indigo-500 text-white' : 'bg-neutral-800'}`}>
                {index + 1}
              </span>
            )}
            <span className="font-semibold whitespace-nowrap text-sm">{step}</span>
          </button>
        );
      })}
    </div>
  );
};
