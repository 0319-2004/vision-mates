export interface Project {
  id: string
  title: string
  purpose: string
  tags: string[]
  created_at: string
  updated_at?: string
}

export interface ProjectWithCounts extends Project {
  comments_count: number
  progress_count: number
  watch_count: number
  raise_count: number
  commit_count: number
}

export interface Comment {
  id: string
  project_id: string
  user_id: string
  text: string
  created_at: string
  user?: {
    email: string
  }
}

export interface ProgressUpdate {
  id: string
  project_id: string
  user_id: string
  text: string
  created_at: string
  user?: {
    email: string
  }
}

export type IntentLevel = 'watch' | 'raise' | 'commit'

export interface Intent {
  id: string
  project_id: string
  user_id: string
  level: IntentLevel
  created_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

// ① スワイプ発見用
export interface DiscoverSkip {
  user_id: string
  project_id: string
  created_at: string
}

// ② 共同作業スプリント用
export interface Room {
  id: string
  title: string
  owner_id: string
  created_at: string
}

export interface FocusSession {
  id: string
  room_id: string
  started_by: string
  started_at: string
  ended_at?: string
}

export interface Clap {
  id: string
  session_id: string
  user_id: string
  count: number
  created_at: string
}

// ⑤ ミニ功績用
export interface UserAchievement {
  user_id: string
  code: string
  earned_at: string
}

// ⑥ DM/グループ用
export interface Thread {
  id: string
  project_id: string
  title: string
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  user_id: string
  text: string
  created_at: string
  user?: {
    email: string
  }
}

// ④ 企画テンプレ用
export interface IdeaTemplate {
  id: string
  name: string
  description: string
  fields: {
    name: string
    label: string
    placeholder: string
    type: 'text' | 'textarea'
  }[]
  template: string
} 