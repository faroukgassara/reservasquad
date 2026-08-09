import { IconComponentsEnum } from '@/Enum/Enum';

export type StepperItem = {
    id: string;
    label: string;
    icon?: IconComponentsEnum;
};

export default interface IStepper {
    steps: StepperItem[];
    currentStepId: string;
    className?: string;
    /** Optional: allow clicking completed steps to go back */
    onStepClick?: (stepId: string) => void;
}
