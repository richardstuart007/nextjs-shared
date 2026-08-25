'use server'

//==============================================================================================
//  1) DESCRIPTION
//    action_getDbKeyOptions — every env var name starting with POSTGRES_URL_PREFIX, i.e. every
//    database connection currently configured (primary plus any additional POSTGRES_URL<N>).
//    Falls back to [POSTGRES_URL_PREFIX] alone if none are found, so the dropdown is never
//    empty.
//
//    Returns:
//      the list of matching env var names
//==============================================================================================

import { POSTGRES_URL_PREFIX } from '../constants'

export async function action_getDbKeyOptions(): Promise<string[]> {
  const keys = Object.keys(process.env).filter(key => key.startsWith(POSTGRES_URL_PREFIX))
  return keys.length > 0 ? keys : [POSTGRES_URL_PREFIX]
}
