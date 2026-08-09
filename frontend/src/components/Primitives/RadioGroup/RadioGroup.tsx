'use client'

import { IRadioGroup, IRadioGroupContext } from "@/interfaces/IPrimitives/IRadioGroup/IRadioGroup";
import { createContext, useContext } from "react";

const RadioGroupContext = createContext<IRadioGroupContext | null>(null);

export const useRadioGroup = () => {
    const context = useContext(RadioGroupContext);
    if (!context) {
        throw new Error("Radio must be used within RadioGroup");
    }
    return context;
}

const RadioGroup = ({ name, value, onChange, disabled = false, children, className }: Readonly<IRadioGroup>) => {
    return (
        <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
            <div className={className}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
}

export default RadioGroup;
