import { NextResponse } from 'next/server'
import { buildLocalCronJobsPayload } from '@/app/api/local/_lib/localData'

export async function GET() {
  const payload = await buildLocalCronJobsPayload()
  return NextResponse.json(payload)
}
