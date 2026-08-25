//==============================================================================================
//  1) DESCRIPTION
//    Layout — /owner route wrapper, applying the shared dev-only OwnerLayout guard
//
//    Parameters:
//      children — the page content to render inside OwnerLayout
//==============================================================================================

import OwnerLayout from '../../UI/OwnerLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OwnerLayout>{children}</OwnerLayout>
}
