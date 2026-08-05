import OwnerPage from '../../UI/OwnerPage'
import OwnerTableLogging from '../../UI/OwnerTableLogging'
import OwnerTableCache from '../../UI/OwnerTableCache'
import OwnerTableSessionStorage from '../../UI/OwnerTableSessionStorage'
import OwnerSyncVersions from '../../UI/OwnerSyncVersions'
import OwnerComponentTest from '../../UI/OwnerComponentTest'
import OwnerGenerateData from './OwnerGenerateData'
import OwnerBackNavDemo from '../../UI/OwnerBackNavDemo'
import OwnerConstants from '../../UI/OwnerConstants'

export default function Page() {
  const envValues = {
    POSTGRES_URL: process.env.POSTGRES_URL,
    NEXT_PUBLIC_APPENV_LOG_I: process.env.NEXT_PUBLIC_APPENV_LOG_I,
    NEXT_PUBLIC_APPENV_LOG_D: process.env.NEXT_PUBLIC_APPENV_LOG_D,
    NEXT_PUBLIC_APPENV_ISDEV: process.env.NEXT_PUBLIC_APPENV_ISDEV,
  }
  return (
    <OwnerPage
      persistKey='owner-main'
      tabs={[
        { label: 'Logging', content: <OwnerTableLogging /> },
        { label: 'Cache', content: <OwnerTableCache /> },
        { label: 'Session Storage', content: <OwnerTableSessionStorage /> },
        { label: 'Versions', content: <OwnerSyncVersions /> },
        { label: 'Components', content: <OwnerComponentTest /> },
        { label: 'Constants', content: <OwnerConstants envValues={envValues} /> },
        { label: 'Generate Data', content: <OwnerGenerateData /> },
        { label: 'Back Nav Demo', content: <OwnerBackNavDemo /> }
      ]}
    />
  )
}
