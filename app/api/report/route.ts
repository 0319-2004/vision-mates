import { createClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentId, contentType, reason, description } = body

    // バリデーション
    if (!contentId || !contentType || !reason) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    // 通報の作成
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        content_id: contentId,
        content_type: contentType,
        reason: reason,
        description: description || null,
        reported_by: user.id,
        status: 'open'
      })
      .select()
      .single()

    if (reportError) {
      // 重複通報の場合は特別なエラーメッセージ
      if (reportError.code === '23505') {
        return NextResponse.json(
          { error: 'このコンテンツは既に通報済みです' },
          { status: 409 }
        )
      }
      
      console.error('Report creation error:', reportError)
      return NextResponse.json(
        { error: '通報の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: '通報を受け付けました',
        reportId: report.id 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Report API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
