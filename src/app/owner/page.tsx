import OwnerPage from '../../UI/OwnerPage'
import OwnerTableLogging from '../../UI/OwnerTableLogging'
import OwnerTableCache from '../../UI/OwnerTableCache'
import OwnerSyncVersions from '../../UI/OwnerSyncVersions'

export default function Page() {
  return (
    <OwnerPage
      tabs={[
        { label: 'Logging', content: <OwnerTableLogging /> },
        { label: 'Cache', content: <OwnerTableCache /> },
        { label: 'Versions', content: <OwnerSyncVersions /> }
      ]}
    />
  )
}
