import { NextResponse } from 'next/server'
import { buildLocalDashboardPayload } from '@/app/api/local/_lib/localData'

export async function GET() {
  const payload = await buildLocalDashboardPayload()
  return NextResponse.json({ source: payload.source, subagents: payload.subagents, warnings: payload.warnings })
}
