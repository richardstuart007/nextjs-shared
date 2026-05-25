import { NextRequest } from 'next/server'
import { createClient } from '../../dbClient'

const BATCH = 500

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function POST(req: NextRequest) {
  const { tables, source, target } = (await req.json()) as {
    tables: string[]
    source: string
    target: string
  }

  if (!tables?.length || !source || !target) {
    return new Response(JSON.stringify({ error: 'tables, source, and target are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      let ok = 0
      let errors = 0
      const src = await createClient(source)
      const tgt = await createClient(target)

      try {
        await tgt.query('SET session_replication_role = replica')

        for (const table of tables) {
          controller.enqueue(sse({ table, status: 'starting' }))

          try {
            const colRes = await src.query<{ column_name: string }>(
              `SELECT column_name FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = $1
               ORDER BY ordinal_position`,
              [table]
            )
            const cols = colRes.rows.map(r => r.column_name)
            const colList = cols.map(c => `"${c}"`).join(', ')

            const countRes = await src.query<{ count: string }>(`SELECT COUNT(*) FROM "${table}"`)
            const total = parseInt(countRes.rows[0].count, 10)

            controller.enqueue(sse({ table, status: 'truncating' }))
            await tgt.query(`TRUNCATE "${table}" CASCADE`)

            let done = 0
            while (true) {
              const rows = await src.query(
                `SELECT ${colList} FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`,
                [BATCH, done]
              )
              if (rows.rows.length === 0) break

              const placeholders = rows.rows
                .map((_, ri) => `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(', ')})`)
                .join(', ')
              const values = rows.rows.flatMap(row => cols.map(c => row[c]))
              await tgt.query(
                `INSERT INTO "${table}" (${colList}) VALUES ${placeholders}`,
                values
              )

              done += rows.rows.length
              controller.enqueue(sse({ table, status: 'progress', done, total }))
              if (rows.rows.length < BATCH) break
            }

            controller.enqueue(sse({ table, status: 'done', rows: done }))
            ok++
          } catch (error) {
            controller.enqueue(sse({ table, status: 'error', error: (error as Error).message }))
            errors++
          }
        }

        await tgt.query('SET session_replication_role = DEFAULT')
      } catch (error) {
        controller.enqueue(sse({ error: (error as Error).message }))
      } finally {
        await src.end().catch(() => {})
        await tgt.end().catch(() => {})
      }

      controller.enqueue(sse({ done: true, ok, errors }))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
