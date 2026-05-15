// React 19 moved JSX.IntrinsicElements onto React.JSX. @react-three/fiber 8.x
// still augments the legacy global JSX namespace. This shim re-routes its
// ThreeElements onto React.JSX so tsx files can use <mesh>, <sphereGeometry>
// etc. without `@ts-ignore`.

import type { ThreeElements } from '@react-three/fiber'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
