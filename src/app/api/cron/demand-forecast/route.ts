import { db } from '@/db'
import { appConfig } from '@/db/schema'
import { getDemandForecast } from '@/lib/ai/demand-forecast'
import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'

/**
 * GET /api/cron/demand-forecast
 * Weekly batch cron. Generates demand forecasts via Claude and stores in app_config.
 * Protected by Bearer token.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const forecast = await getDemandForecast()

    await db
      .insert(appConfig)
      .values({
        key: 'demand_forecast',
        value: { results: forecast, generatedAt: new Date().toISOString() },
      })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: {
          value: { results: forecast, generatedAt: new Date().toISOString() },
          updatedAt: new Date(),
        },
      })

    return Response.json({ ok: true, categories: forecast.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[demand-forecast cron]', msg)
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
