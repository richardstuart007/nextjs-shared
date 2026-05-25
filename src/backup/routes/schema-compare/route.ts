import { NextRequest, NextResponse } from 'next/server'
import { createClient, read_location } from '../../dbClient'
import { fetchSchema, diffSchemas, type DiffRow } from '../../schemaUtils'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const env1 = searchParams.get('env1')
  const env2 = searchParams.get('env2')

  if (!env1 || !env2) {
    return NextResponse.json(
      { error: 'env1 and env2 query params required (full path to .env file)' },
      { status: 400 }
    )
  }

  const c1 = await createClient(env1).catch(e => { throw new Error(`env1 connect: ${e.message}`) })
  const c2 = await createClient(env2).catch(e => { throw new Error(`env2 connect: ${e.message}`) })

  try {
    const [rows1, rows2] = await Promise.all([fetchSchema(c1), fetchSchema(c2)])
    const label1 = read_location(env1) || env1
    const label2 = read_location(env2) || env2
    const { onlyIn1, onlyIn2, changed } = diffSchemas(rows1, rows2, label1, label2)
    const diffs: DiffRow[] = [...onlyIn1, ...onlyIn2]
    return NextResponse.json({ label1, label2, diffs, onlyIn1, onlyIn2, changed })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  } finally {
    await c1.end().catch(() => {})
    await c2.end().catch(() => {})
  }
}
