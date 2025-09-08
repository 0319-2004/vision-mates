import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectCard from '@/components/ProjectCard'

vi.mock('@/lib/supabaseBrowser', () => {
  return {
    createClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: null }),
        delete: () => Promise.resolve({ error: null }),
        insert: () => Promise.resolve({ error: null }),
        upsert: () => Promise.resolve({ error: null }),
        order: () => Promise.resolve({ data: [] }),
        eq: () => Promise.resolve({ data: [] }),
      }),
    }),
  }
})

const demo = {
  id: 'demo-1',
  title: 'デモプロジェクト',
  purpose: 'テスト用',
  tags: ['test'],
  created_at: new Date().toISOString(),
  watch_count: 0,
  raise_count: 0,
  commit_count: 0,
  comment_count: 0,
  update_count: 0,
}

describe('ProjectCard', () => {
  it('renders title and buttons', async () => {
    render(<ProjectCard p={demo} />)
    expect(screen.getByText('デモプロジェクト')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '見守るに設定' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '手を挙げるに設定' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'コミットに設定' })).toBeInTheDocument()
  })

  it('opens report modal', async () => {
    render(<ProjectCard p={demo} />)
    const reportBtn = screen.getByRole('button', { name: `プロジェクト「${demo.title}」を通報する` })
    await userEvent.click(reportBtn)
    expect(await screen.findByRole('dialog', { name: /REPORT/i })).toBeInTheDocument()
  })
})
