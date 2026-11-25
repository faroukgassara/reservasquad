import { useCallback, useSyncExternalStore } from 'react'

type TEyeDropperResult = { sRGBHex: string }
type TEyeDropper = { open: () => Promise<TEyeDropperResult> }
type TEyeDropperConstructor = new () => TEyeDropper

const subscribeNoop = () => () => {}

export const useEyeDropper = () => {
    // Server snapshot stays false so the first client render matches the server HTML.
    const isSupported = useSyncExternalStore(
        subscribeNoop,
        () => 'EyeDropper' in window,
        () => false,
    )

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
