import { NextResponse } from 'next/server'
import { buildLocalDashboardPayload } from '@/app/api/local/_lib/localData'

export async function GET() {
  const payload = await buildLocalDashboardPayload()
  return NextResponse.json({ source: payload.source, sessions: payload.sessions, warnings: payload.warnings })
}
