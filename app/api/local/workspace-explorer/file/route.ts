import { NextRequest, NextResponse } from 'next/server'
import { readWorkspaceFilePreview } from '@/app/api/local/_lib/localData'

export async function GET(request: NextRequest) {
  const targetPath = request.nextUrl.searchParams.get('path')
  if (!targetPath) {
    return NextResponse.json({ error: 'Missing path query param' }, { status: 400 })
  }

  try {
    const payload = await readWorkspaceFilePreview(targetPath)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to read workspace file' }, { status: 400 })
  }
}
