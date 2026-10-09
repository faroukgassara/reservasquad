import Div from '@/components/Primitives/Div/Div';
import Label from '@/components/Primitives/Label/Label';
import { EVariantLabel } from '@/Enum/Enum';

interface PosStatusPipelineProps {
    steps: { key: string; label: string }[];
    active: string;
}

export default function PosStatusPipeline({ steps, active }: Readonly<PosStatusPipelineProps>) {
    return (
        <Div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-gray-200">
            {steps.map((step, index) => {
                const isActive = step.key === active;
                return (
                    <Div
                        key={step.key}
                        className={`shrink-0 whitespace-nowrap px-2.5 py-1.5 sm:px-4 ${index > 0 ? 'border-s border-gray-200' : ''} ${
                            isActive ? 'bg-primary-50' : 'bg-white'
                        }`}
                    >
                        <Label
                            variant={EVariantLabel.caption}
                            color={isActive ? 'text-primary-700' : 'text-gray-500'}
                            className={`uppercase ${isActive ? 'font-semibold' : ''}`}
                        >
                            {step.label}
                        </Label>
                    </Div>
                );
            })}
        </Div>
    );
}
