import { createClient } from '@/lib/supabaseServer'
import ModerationTable from './ModerationTable'

interface Report {
  id: string
  content_id: string
  content_type: string
  reason: string
  description: string | null
  status: string
  reported_by: string
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  action_notes: string | null
  profiles_reported_by: {
    display_name: string
    email: string
  }
  profiles_reviewed_by: {
    display_name: string
    email: string
  } | null
}

interface ModerationAction {
  id: string
  report_id: string
  action: string
  actor_id: string
  notes: string | null
  created_at: string
  profiles: {
    display_name: string
    email: string
  }
}

export default async function ModerationPage() {
  const supabase = createClient()

  // 通報一覧を取得
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(`
      *,
      profiles_reported_by:profiles!reports_reported_by_fkey(display_name, email),
      profiles_reviewed_by:profiles!reports_reviewed_by_fkey(display_name, email)
    `)
    .order('created_at', { ascending: false })

  if (reportsError) {
    console.error('Failed to fetch reports:', reportsError)
  }

  // モデレーション履歴を取得
  const { data: actions, error: actionsError } = await supabase
    .from('moderation_actions')
    .select(`
      *,
      profiles:profiles!moderation_actions_actor_id_fkey(display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (actionsError) {
    console.error('Failed to fetch moderation actions:', actionsError)
  }

  return (
    <div className="min-h-screen bg-retro-darkGray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダー */}
        <div className="retro-card bg-black border-2 border-retro-cyan mb-8">
          <div className="p-6">
            <h1 className="text-3xl font-pixel text-retro-cyan mb-4">MODERATION DASHBOARD</h1>
            <p className="font-pixel text-sm text-retro-lightGray mb-4">
              通報の審査と管理システム
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="retro-card bg-retro-darkGray p-3">
                <div className="font-pixel text-retro-yellow">OPEN REPORTS</div>
                <div className="font-pixel text-lg text-retro-lightGray">
                  {reports?.filter(r => r.status === 'open').length || 0}
                </div>
              </div>
              <div className="retro-card bg-retro-darkGray p-3">
                <div className="font-pixel text-retro-orange">HOLD REPORTS</div>
                <div className="font-pixel text-lg text-retro-lightGray">
                  {reports?.filter(r => r.status === 'hold').length || 0}
                </div>
              </div>
              <div className="retro-card bg-retro-darkGray p-3">
                <div className="font-pixel text-retro-green">KEPT REPORTS</div>
                <div className="font-pixel text-lg text-retro-lightGray">
                  {reports?.filter(r => r.status === 'kept').length || 0}
                </div>
              </div>
              <div className="retro-card bg-retro-darkGray p-3">
                <div className="font-pixel text-retro-red">DELETED REPORTS</div>
                <div className="font-pixel text-lg text-retro-lightGray">
                  {reports?.filter(r => r.status === 'deleted').length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 通報一覧 */}
          <div className="lg:col-span-2">
            <ModerationTable 
              reports={reports as Report[] || []} 
            />
          </div>

          {/* モデレーション履歴 */}
          <div className="lg:col-span-1">
            <div className="retro-card bg-black border-2 border-retro-purple">
              <div className="p-4">
                <h2 className="font-pixel text-lg text-retro-purple mb-4">
                  MODERATION HISTORY
                </h2>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {actions?.map((action: ModerationAction) => (
                    <div key={action.id} className="bg-retro-darkGray p-3 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-pixel text-xs px-2 py-1 ${
                          action.action === 'keep' ? 'bg-retro-green text-black' :
                          action.action === 'hold' ? 'bg-retro-orange text-black' :
                          'bg-retro-red text-black'
                        }`}>
                          {action.action.toUpperCase()}
                        </span>
                        <span className="font-pixel text-xs text-retro-lightGray">
                          {new Date(action.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-pixel text-xs text-retro-lightGray">
                        by {action.profiles.display_name}
                      </p>
                      {action.notes && (
                        <p className="font-pixel text-xs text-retro-lightGray mt-1">
                          {action.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
