'use client'

import { MyBackHomeNav_containerDftClass, MyBackHomeNav_linkDftClass } from '../constants'

type Props = {
  backPath?: string | null
  backLabel?: string
  homePath?: string
  containerClass?: string
  linkClass?: string
}

//----------------------------------------------------------------------------------
//  MyBackHomeNav — Home link, plus a Back link when backPath differs from homePath
//----------------------------------------------------------------------------------
export function MyBackHomeNav({
  backPath = null,
  backLabel,
  homePath = '/',
  containerClass = MyBackHomeNav_containerDftClass,
  linkClass = MyBackHomeNav_linkDftClass,
}: Props) {
  return (
    <div className={containerClass}>
      <a href={homePath} className={linkClass}>
        ⌂ Home
      </a>
      {backPath && backPath !== homePath && (
        <a href={backPath} className={linkClass}>
          ← {backLabel ?? 'Back'}
        </a>
      )}
    </div>
  )
}
