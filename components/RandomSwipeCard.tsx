'use client'

import { useEffect, useState } from 'react'
import SwipeCard from '@/components/SwipeCard'

type Project = {
  id: string
  title: string
  purpose: string
  tags: string[]
  created_at: string
  watch_count?: number
  raise_count?: number
  commit_count?: number
  comment_count?: number
  update_count?: number
}

export default function RandomSwipeCard({ demoProjects }: { demoProjects: Project[] }) {
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    const random = demoProjects[Math.floor(Math.random() * demoProjects.length)]
    setProject(random)
  }, [demoProjects])

  const initialProject = demoProjects[0]

  return <SwipeCard project={project || initialProject} />
}


