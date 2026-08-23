'use server'

import { table_truncate } from '../tables/tableGeneric/table_truncate'

//----------------------------------------------------------------------------------
//  action_truncateLogging — truncates xlg_logging and resets the sequence
//----------------------------------------------------------------------------------
export async function action_truncateLogging(): Promise<string> {
  const result = await table_truncate('xlg_logging', 'OwnerTableLogging')
  if (!result.ok) return `Truncate failed: ${result.error}`
  return 'Logging table truncated'
}
