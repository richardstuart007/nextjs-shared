import { Client } from 'pg'
import { readFileSync } from 'fs'
//--------------------------------------------------------------------------
//  Read a single variable from a .env file on disk
//--------------------------------------------------------------------------
export function readEnvVar(envFile: string, varName: string): string {
  try {
    const content = readFileSync(envFile, 'utf8')
    const match = content.match(new RegExp(`^${varName}=(.+)$`, 'm'))
    return match ? match[1].trim() : ''
  } catch {
    return ''
  }
}
//--------------------------------------------------------------------------
//  Read POSTGRES_URL from a .env file
//--------------------------------------------------------------------------
export function read_url(envFile: string): string {
  return readEnvVar(envFile, 'POSTGRES_URL')
}
//--------------------------------------------------------------------------
//  Read POSTGRES_DATABASE_LOCATION from a .env file
//--------------------------------------------------------------------------
export function read_location(envFile: string): string {
  return readEnvVar(envFile, 'POSTGRES_DATABASE_LOCATION')
}
//--------------------------------------------------------------------------
//  Create and connect a pg.Client from a .env file path or the environment.
//  If envFile is provided, POSTGRES_URL is read from that file.
//  Otherwise, process.env.POSTGRES_URL is used.
//  Caller is responsible for calling client.end() when done.
//--------------------------------------------------------------------------
export async function createClient(envFile?: string): Promise<Client> {
  const connectionString = envFile
    ? readEnvVar(envFile, 'POSTGRES_URL')
    : (process.env.POSTGRES_URL ?? '')
  const client = new Client({ connectionString })
  await client.connect()
  return client
}
