//==============================================================================================
//  1) DESCRIPTION
//    Page — /owner dev app: Logging / Cache / Session Storage / Routing Maintenance tabs
//==============================================================================================

import OwnerPage from '../../UI/OwnerPage'
import OwnerTableLogging from '../../UI/OwnerTableLogging'
import OwnerTableCache from '../../UI/OwnerTableCache'
import OwnerTableSessionStorage from '../../UI/OwnerTableSessionStorage'
import OwnerRoutingMaintenance from '../../UI/OwnerRoutingMaintenance'

export default function Page() {
  return (
    <OwnerPage
      persistKey='owner-main'
      tabs={[
        { label: 'Logging', content: <OwnerTableLogging /> },
        { label: 'Cache', content: <OwnerTableCache /> },
        { label: 'Session Storage', content: <OwnerTableSessionStorage /> },
        { label: 'Routing Maintenance', content: <OwnerRoutingMaintenance /> }
      ]}
    />
  )
}
