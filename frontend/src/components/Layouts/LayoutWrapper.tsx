'use client';

import { TopSection } from "../Organisms";
import { ILayoutWrapper } from "@/interfaces";

export default function LayoutWrapper({ title, subTitle, mainSection, rightActions, leftActions }: Readonly<ILayoutWrapper>) {
    return (
        <>
            <TopSection title={title} subTitle={subTitle} rightActions={rightActions} leftActions={leftActions} />

            <div className="h-[88%] p-8 bg-gray-50">
                {mainSection}
            </div>
        </>
    );
}
