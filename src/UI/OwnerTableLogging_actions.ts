'use server'

import { table_truncate } from '../tables/tableGeneric/table_truncate'

//----------------------------------------------------------------------------------
//  action_truncateLogging — truncates xlg_logging and resets the sequence
//----------------------------------------------------------------------------------
export async function action_truncateLogging(): Promise<string> {
  await table_truncate('xlg_logging', 'OwnerTableLogging')
  return 'Logging table truncated'
}
