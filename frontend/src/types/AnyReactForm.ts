import type { ReactFormExtendedApi } from '@tanstack/react-form'

// TanStack Form ships no AnyReactFormApi; each page's form has its own data and validator generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyReactForm = ReactFormExtendedApi<any, any, any, any, any, any, any, any, any, any, any, any>

export default AnyReactForm
