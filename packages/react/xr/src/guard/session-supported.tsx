import { ReactNode } from 'react'
import { useXRSessionModeSupported } from '../index.js'

interface SessionModeSupportedProps {
  children?: ReactNode
  mode: XRSessionMode
}

/**
 * Guard that only **shows** its children by toggling their visibility based on whether the user's device supports a session mode.
 *
 * @param props
 * * `children?`: ReactNode - The ReactNode elements to conditionally show.
 * * `mode`: XRSessionMode - The session mode used to determine if the children will be shown.
 */
export function ShowIfSessionModeSupported({ children, mode }: SessionModeSupportedProps) {
  const supported = useXRSessionModeSupported(mode)
  return <group visible={supported}>{children}</group>
}

/**
 * Guard that only **renders** its children to the scene based on whether the user's device supports a session mode.
 *
 * @param props
 * * `children?`: ReactNode - The ReactNode elements to conditionally render.
 * * `mode`: XRSessionMode - The session mode used to determine if the children will be rendered.
 */
export function IfSessionModeSupported({ children, mode }: SessionModeSupportedProps) {
  const supported = useXRSessionModeSupported(mode)
  if (!supported) {
    return null
  }
  return <>{children}</>
}
