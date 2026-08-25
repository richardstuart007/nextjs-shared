'use client'

//==============================================================================================
//  1) DESCRIPTION
//    MyBackHomeNav — Home link, plus a Back link when backPath differs from homePath
//
//    Parameters:
//      backPath       — target for the Back link; Back renders only when this differs
//                        from homePath (including query-string-only differences)
//      backLabel      — Back link text; defaults to the generic 'Back'
//      homePath       — Home link target; defaults to '/'
//      containerClass — wrapper div classes; defaults to MyBackHomeNav_containerDftClass
//      linkClass      — classes applied to both links; defaults to MyBackHomeNav_linkDftClass
//==============================================================================================

import { MyBackHomeNav_containerDftClass, MyBackHomeNav_linkDftClass } from '../constants'

type Props = {
  backPath?: string | null
  backLabel?: string
  homePath?: string
  containerClass?: string
  linkClass?: string
}

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
