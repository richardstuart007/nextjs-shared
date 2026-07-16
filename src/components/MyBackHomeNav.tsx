'use client'

type Props = {
  backPath?: string | null
  homePath?: string
  containerClass?: string
  linkClass?: string
}

export const MyBackHomeNav_containerDftClass_Shared = 'flex gap-3'
export const MyBackHomeNav_linkDftClass_Shared = 'text-xs text-gray-500 hover:text-gray-700'

//----------------------------------------------------------------------------------
//  MyBackHomeNav — Home link, plus a Back link when backPath differs from homePath
//----------------------------------------------------------------------------------
export function MyBackHomeNav({
  backPath = null,
  homePath = '/',
  containerClass = MyBackHomeNav_containerDftClass_Shared,
  linkClass = MyBackHomeNav_linkDftClass_Shared,
}: Props) {
  return (
    <div className={containerClass}>
      <a href={homePath} className={linkClass}>
        ⌂ Home
      </a>
      {backPath && backPath.split('?')[0] !== homePath.split('?')[0] && (
        <a href={backPath} className={linkClass}>
          ← {backPath}
        </a>
      )}
    </div>
  )
}
