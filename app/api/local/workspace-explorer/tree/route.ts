import { NextResponse } from 'next/server'
import { readWorkspaceExplorerTree } from '@/app/api/local/_lib/localData'

export async function GET() {
  try {
    const tree = await readWorkspaceExplorerTree()
    return NextResponse.json(tree)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to read workspace tree' }, { status: 500 })
  }
}
