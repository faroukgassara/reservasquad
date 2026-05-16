import AtomLabel from "@/components/Atoms/AtomLabel/AtomLabel";
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
                <AtomLabel variant={EVariantLabel.h1} color="text-gray-900">{name}</AtomLabel>
                <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" >Packs
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900">{packs}</AtomLabel>
                </AtomLabel>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" >
                        Licences distribuées
                    </AtomLabel>
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900">{distributed}</AtomLabel>
                </div>
                <div className="flex justify-between">
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900" >
                        Licences actives
                    </AtomLabel>
                    <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-900">{active}</AtomLabel>
                </div>
            </div>
        </div>
    );
}
