'use server'

import { table_fetch } from '../tables/tableGeneric/table_fetch'
import { table_upsert } from '../tables/tableGeneric/table_upsert'
import { table_delete } from '../tables/tableGeneric/table_delete'
import { INCLUDED_TIME_CLASSES } from './constants'

const GAMES_TABLE = 'tgr_gamesraw'

//----------------------------------------------------------------------------------
//  insertRawGame — upsert one raw game row; returns true if inserted, false if already existed
//----------------------------------------------------------------------------------
async function insertRawGame(data: {
  player_username: string
  chesscom_uuid: string
  raw_data: object
  pgn?: string | null
  end_time: number
  time_class: string
}): Promise<boolean> {
  const rows = await table_upsert({
    caller: 'insertRawGame',
    table: GAMES_TABLE,
    columnValuePairs: [
      { column: 'gr_player_username', value: data.player_username.toLowerCase() },
      { column: 'gr_chesscom_uuid', value: data.chesscom_uuid },
      { column: 'gr_raw_data', value: JSON.stringify(data.raw_data) },
      { column: 'gr_pgn', value: data.pgn ?? null },
      { column: 'gr_end_time', value: data.end_time },
      { column: 'gr_time_class', value: data.time_class }
    ],
    conflictColumns: ['gr_chesscom_uuid']
  })
  return rows.length > 0
}

//----------------------------------------------------------------------------------
//  getLatestGameEndTime — fetch the most recent end_time for a player
//----------------------------------------------------------------------------------
async function getLatestGameEndTime(playerUsername: string): Promise<number | null> {
  const rows = await table_fetch({
    caller: 'getLatestGameEndTime',
    table: GAMES_TABLE,
    whereColumnValuePairs: [{ column: 'gr_player_username', value: playerUsername.toLowerCase() }],
    orderBy: 'gr_end_time DESC',
    limit: 1,
    columns: ['gr_end_time']
  })
  return rows[0]?.gr_end_time ?? null
}

//----------------------------------------------------------------------------------
//  initSync — fetch chess.com archive list; optionally clear existing games first
//----------------------------------------------------------------------------------
export async function initSync(
  playerUsername: string,
  syncType: 'full_replace' | 'refresh'
): Promise<{ archives: string[]; latestEndTime: number | null }> {
  const username = playerUsername.toLowerCase()

  if (syncType === 'full_replace') {
    await table_delete({
      table: GAMES_TABLE,
      whereColumnValuePairs: [{ column: 'gr_player_username', value: username }],
      caller: 'initSync_fullReplace'
    })
  }

  const latestEndTime = syncType === 'refresh'
    ? await getLatestGameEndTime(username)
    : null

  const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`)
  if (!archivesRes.ok) throw new Error(`Failed to fetch archives for ${username}`)
  const { archives } = await archivesRes.json() as { archives: string[] }

  return { archives, latestEndTime }
}

//----------------------------------------------------------------------------------
//  syncArchive — download one monthly archive and insert new games
//----------------------------------------------------------------------------------
export async function syncArchive(params: {
  username: string
  archiveUrl: string
  syncType: 'full_replace' | 'refresh'
  latestEndTime: number | null
}): Promise<{ inserted: number; skipped: number; total: number }> {
  const { username, archiveUrl, syncType, latestEndTime } = params

  try {
    if (syncType === 'refresh' && latestEndTime) {
      const match = archiveUrl.match(/\/(\d{4})\/(\d{2})$/)
      if (match) {
        const archiveDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1)
        const latestDate = new Date(latestEndTime * 1000)
        if (archiveDate < new Date(latestDate.getFullYear(), latestDate.getMonth())) {
          return { inserted: 0, skipped: 0, total: 0 }
        }
      }
    }

    const monthRes = await fetch(archiveUrl)
    if (!monthRes.ok) return { inserted: 0, skipped: 0, total: 0 }

    const { games } = await monthRes.json() as { games: any[] }
    const standardGames = games
      .filter((g: any) => g.rules === 'chess' && g.pgn && INCLUDED_TIME_CLASSES.includes(g.time_class))
      .sort((a: any, b: any) => a.end_time - b.end_time)

    let inserted = 0
    let skipped = 0

    for (const game of standardGames) {
      const uuid = game.uuid || game.url
      if (!uuid) continue

      if (syncType === 'refresh' && latestEndTime && game.end_time <= latestEndTime) {
        skipped++
        continue
      }

      const wasInserted = await insertRawGame({
        player_username: username,
        chesscom_uuid: uuid,
        raw_data: game,
        pgn: game.pgn ?? null,
        end_time: game.end_time,
        time_class: game.time_class || ''
      })
      if (wasInserted) inserted++
      else skipped++
    }

    return { inserted, skipped, total: games.length }
  } catch (error) {
    console.error(`Error syncing archive ${archiveUrl}:`, error)
    return { inserted: 0, skipped: 0, total: 0 }
  }
}
