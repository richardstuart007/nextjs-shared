import { Client } from 'pg'
import { readFileSync } from 'fs'
/** Read a named variable from a .env file; returns '' if the file is missing or the variable is not found. */
export function readEnvVar(envFile: string, varName: string): string {
  try {
    const content = readFileSync(envFile, 'utf8')
    const match = content.match(new RegExp(`^${varName}=(.+)$`, 'm'))
    return match ? match[1].trim() : ''
  } catch {
    return ''
  }
}
/** Shorthand for readEnvVar(envFile, 'POSTGRES_URL'). */
export function read_url(envFile: string): string {
  return readEnvVar(envFile, 'POSTGRES_URL')
}
/** Shorthand for readEnvVar(envFile, 'POSTGRES_DATABASE_LOCATION'); used as the display label in UI. */
export function read_location(envFile: string): string {
  return readEnvVar(envFile, 'POSTGRES_DATABASE_LOCATION')
}
/** Create and connect a pg.Client; reads POSTGRES_URL from envFile if given, else from process.env. Caller must call client.end(). */
export async function createClient(envFile?: string): Promise<Client> {
  const connectionString = envFile
    ? readEnvVar(envFile, 'POSTGRES_URL')
    : (process.env.POSTGRES_URL ?? '')
  const client = new Client({ connectionString })
  await client.connect()
  return client
}
