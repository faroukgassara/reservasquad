import { Label } from "@/components/Atoms";
import { EVariantLabel } from "@/Enum/Enum";

interface ILicenseCardProps {
    name: string;
    packs?: number;
    distributed: number;
    active: number;
}

export default function MoleculeLicenseCard({
    name,
    packs,
    distributed,
    active,
}: Readonly<ILicenseCardProps>) {
    return (
        <div className={"rounded-lg border-[0.5px] border-gray-800 p-4"}>
            <div className="flex justify-between items-center mb-3">
                <Label variant={EVariantLabel.h1} color="text-gray-900">{name}</Label>
                <Label variant={EVariantLabel.bodySmall} color="text-gray-900" >Packs
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{packs}</Label>
                </Label>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" >
                        Licences distribuées
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{distributed}</Label>
                </div>
                <div className="flex justify-between">
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900" >
                        Licences actives
                    </Label>
                    <Label variant={EVariantLabel.bodySmall} color="text-gray-900">{active}</Label>
                </div>
            </div>
        </div>
    );
}
