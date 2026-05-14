import { useCallback, useEffect, useState } from 'react'

type TEyeDropperResult = { sRGBHex: string }
type TEyeDropper = { open: () => Promise<TEyeDropperResult> }
type TEyeDropperConstructor = new () => TEyeDropper

export const useEyeDropper = () => {
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        setIsSupported(typeof window !== 'undefined' && 'EyeDropper' in window)
    }, [])

    const openDropper = useCallback(async () => {
        if (!isSupported || typeof window === 'undefined') return null

        const EyeDropperConstructor = (window as Window & { EyeDropper?: TEyeDropperConstructor }).EyeDropper
        if (!EyeDropperConstructor) return null

        try {
            const dropper = new EyeDropperConstructor()
            const result = await dropper.open()
            return result.sRGBHex
        } catch {
            return null
        }
    }, [isSupported])

    return { openDropper, isSupported }
}
