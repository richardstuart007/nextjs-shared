//==============================================================================================
//  1) DESCRIPTION
//    Page — /test/constants: server-reads the tracked env vars and renders OwnerConstants
//    standalone (outside /owner)
//==============================================================================================

import OwnerConstants from '../../../UI/OwnerConstants'

export default function Page() {
  const envValues = {
    POSTGRES_URL: process.env.POSTGRES_URL,
    NEXT_PUBLIC_APPENV_LOG_I: process.env.NEXT_PUBLIC_APPENV_LOG_I,
    NEXT_PUBLIC_APPENV_LOG_D: process.env.NEXT_PUBLIC_APPENV_LOG_D,
    NEXT_PUBLIC_APPENV_ISDEV: process.env.NEXT_PUBLIC_APPENV_ISDEV,
  }
  return <OwnerConstants envValues={envValues} />
}
