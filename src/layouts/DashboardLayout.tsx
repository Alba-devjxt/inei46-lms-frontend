import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  ChartColumn,
  Bell,
  Search,
  HeartHandshake,
  ClipboardCheck,
  CalendarDays,
} from 'lucide-react'
import Sidebar, { type NavItem } from '../components/Sidebar'
import { api, loadAuth, type NotificacionDTO } from '../lib/api'

const adminNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cursos', icon: BookOpen, label: 'Cursos' },
  { to: '/estudiantes', icon: GraduationCap, label: 'Estudiantes' },
  { to: '/docentes', icon: Users, label: 'Docentes' },
  { to: '/matricula', icon: ClipboardList, label: 'Matrículas' },
  { to: '/asignaciones', icon: ClipboardList, label: 'Asignaciones' },
  { to: '/horario-maestro', icon: CalendarDays, label: 'Horario maestro' },
  { to: '/evaluaciones', icon: FileText, label: 'Evaluaciones' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/vinculos', icon: HeartHandshake, label: 'Vínculos padre-hijo' },
  { to: '/solicitudes-matricula', icon: ClipboardCheck, label: 'Solicitudes' },
  { to: '/reportes', icon: ChartColumn, label: 'Reportes' },
]

export default function DashboardLayout() {
  const location = useLocation()
  const breadcrumb = adminNav.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Inicio'
  const auth = loadAuth()
  const [notifications, setNotifications] = useState<NotificacionDTO[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = () => {
    if (!auth) return
    setLoadingNotifs(true)
    setError(null)
    api.notificaciones(auth.id)
      .then((r) => {
        setNotifications(r.notificaciones || [])
        setUnreadCount(r.no_leidas || 0)
      })
      .catch((err) => {
        console.error('Error loading notifications:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
      })
      .finally(() => setLoadingNotifs(false))
  }

  useEffect(() => {
    if (!menuOpen) return
    loadNotifications()
  }, [menuOpen, auth])

  return (
    <div className="flex h-screen w-screen bg-surface-muted overflow-hidden">
      <Sidebar
        brandSubtitle="LMS Académico"
        sectionLabel="MENÚ PRINCIPAL"
        items={adminNav}
      />
      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6 flex flex-col gap-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Inicio</span>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-[#1A1A1A]">{breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2.5 relative">
              <div className="flex items-center gap-2 h-9 w-72 px-3 rounded-lg bg-white border border-border-soft">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar curso, docente, código..."
                  className="flex-1 text-xs bg-transparent placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="relative h-9 w-9 grid place-items-center rounded-lg bg-white border border-border-soft text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] rounded-full bg-inei-600 px-1.5 text-[10px] font-semibold text-white flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-3 w-96 rounded-3xl border border-border-soft bg-white shadow-lg max-h-[500px] flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-soft bg-gray-50 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">Notificaciones</p>
                          <p className="text-xs text-gray-500">{unreadCount} sin leer</p>
                        </div>
                        <button
                          type="button"
                          onClick={loadNotifications}
                          disabled={loadingNotifs}
                          className="text-xs text-inei-600 hover:text-inei-700 disabled:opacity-50"
                        >
                          {loadingNotifs ? 'Cargando...' : 'Actualizar'}
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {error && (
                        <div className="p-4 text-sm text-red-600 bg-red-50">
                          {error}
                        </div>
                      )}
                      {loadingNotifs && notifications.length === 0 && (
                        <div className="p-4 text-sm text-gray-500 text-center">Cargando notificaciones...</div>
                      )}
                      {!loadingNotifs && notifications.length === 0 && !error && (
                        <div className="p-6 text-center text-sm text-gray-500">No hay notificaciones nuevas.</div>
                      )}
                      {notifications.length > 0 && (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 border-b border-border-soft cursor-pointer hover:bg-gray-50 transition-colors ${
                              notification.leido ? 'bg-white' : 'bg-[#FFF5F5]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-[#1A1A1A]">{notification.titulo}</p>
                                <p className="mt-2 text-sm text-[#2E2E2E]">{notification.mensaje}</p>
                              </div>
                              {!notification.leido && <div className="w-2 h-2 rounded-full bg-inei-600 flex-shrink-0 mt-1" />}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">{new Date(notification.fecha_envio).toLocaleString('es-PE')}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
