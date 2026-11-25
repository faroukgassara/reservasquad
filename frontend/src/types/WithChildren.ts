import React from 'react'

type WithChildren<T = unknown> = T & { children?: React.ReactNode }

export default WithChildren
