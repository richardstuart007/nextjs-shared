import OwnerPage from '../../UI/OwnerPage'
import OwnerTableLogging from '../../UI/OwnerTableLogging'
import OwnerTableCache from '../../UI/OwnerTableCache'
import OwnerSyncVersions from '../../UI/OwnerSyncVersions'
import OwnerComponentTest from '../../UI/OwnerComponentTest'
import OwnerGenerateData from './OwnerGenerateData'
import OwnerBackNavDemo from '../../UI/OwnerBackNavDemo'

export default function Page() {
  return (
    <OwnerPage
      persistKey='owner-main'
      tabs={[
        { label: 'Logging', content: <OwnerTableLogging /> },
        { label: 'Cache', content: <OwnerTableCache /> },
        { label: 'Versions', content: <OwnerSyncVersions /> },
        { label: 'Components', content: <OwnerComponentTest /> },
        { label: 'Generate Data', content: <OwnerGenerateData /> },
        { label: 'Back Nav Demo', content: <OwnerBackNavDemo /> }
      ]}
    />
  )
}
