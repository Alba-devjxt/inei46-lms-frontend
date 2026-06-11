import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  House,
  BookOpen,
  FileText,
  Trophy,
  Calendar,
  Bell,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'
import { api, loadAuth, type NotificacionDTO } from '../lib/api'

const studentNav: NavItem[] = [
  { to: '/estudiante', icon: House, label: 'Inicio' },
  { to: '/estudiante/cursos', icon: BookOpen, label: 'Mis cursos' },
  { to: '/estudiante/tareas', icon: FileText, label: 'Tareas' },
  { to: '/estudiante/calificaciones', icon: Trophy, label: 'Calificaciones' },
  { to: '/estudiante/horario', icon: Calendar, label: 'Horario' },
  { to: '/estudiante/notificaciones', icon: Bell, label: 'Notificaciones' },
]

export default function StudentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const breadcrumb = studentNav.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Inicio'
  const auth = loadAuth()

  return (
    <div className="flex h-screen w-screen bg-surface-muted overflow-hidden">
      <Sidebar
        brandSubtitle="Aula Virtual"
        sectionLabel="ESTUDIANTE"
        items={studentNav}
      />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6 flex flex-col gap-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Inicio</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-[#1A1A1A]">{breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2.5 relative">
              {/* Notificaciones implementadas en la vista del estudiante para evitar duplicados */}
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
