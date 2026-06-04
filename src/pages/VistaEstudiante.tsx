import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Trophy, FileText, CalendarCheck, BookOpen, AlarmClock, MapPin, Book } from 'lucide-react'
import { api, loadAuth, type MiCurso, type MiResumen, type MiTareaDTO, type CalificacionDTO, type NotificacionDTO } from '../lib/api'

const COLORES_CURSO = ['#C8102E', '#1A1A1A', '#C8102E', '#1A1A1A']

export default function VistaEstudiante() {
  const auth = loadAuth()
  const [cursos, setCursos] = useState<MiCurso[]>([])
  const [tareas, setTareas] = useState<MiTareaDTO[]>([])
  const [resumen, setResumen] = useState<MiResumen | null>(null)
  const [calificaciones, setCalificaciones] = useState<CalificacionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) return
    setLoading(true)
    Promise.all([
      api.miCursos(auth.id),
      api.miTareas(auth.id),
      api.miResumen(auth.id),
      api.calificacionesPorEstudiante(auth.id),
    ])
      .then(([c, t, r, cal]) => {
        setCursos(c.cursos)
        setTareas(t.tareas)
        setResumen(r)
        setCalificaciones(cal.calificaciones)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [auth?.id])

  if (!auth) {
    return (
      <div className="p-8 text-sm text-gray-600">
        Sesión no encontrada. Inicia sesión nuevamente.
      </div>
    )
  }

  const primerNombre = auth.nombres.split(' ')[0]
  const tareasPendientes = tareas.filter((t) => new Date(t.fecha_limite) >= new Date())
  const proximaClase = cursos[0]
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<NotificacionDTO[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [errorNotifs, setErrorNotifs] = useState<string | null>(null)

  const loadNotifications = () => {
    if (!auth) return
    setLoadingNotifs(true)
    setErrorNotifs(null)
    api.notificaciones(auth.id)
      .then((r) => {
        setNotifications(r.notificaciones || [])
        setUnreadCount(r.no_leidas || 0)
      })
      .catch((err) => {
        console.error('Error cargando notificaciones:', err)
        setErrorNotifs(err instanceof Error ? err.message : 'Error al cargar notificaciones')
      })
      .finally(() => setLoadingNotifs(false))
  }

  useEffect(() => {
    if (!menuOpen) return
    loadNotifications()
  }, [menuOpen, auth])
  
  // Calcular promedio real basado en calificaciones
  const conNota = calificaciones.filter((c) => c.puntaje != null)
  const promedio = conNota.length > 0
    ? conNota.reduce((a, b) => a + (b.puntaje ?? 0), 0) / conNota.length
    : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5 leading-tight">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">Hola, {primerNombre}</h1>
          <p className="text-xs text-gray-600">Bienvenido(a) de vuelta a tu aula virtual</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            className="h-9 w-9 grid place-items-center rounded-lg bg-white border border-border-soft text-gray-600 hover:text-[#1A1A1A] relative"
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
                      Actualizar
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {errorNotifs && (
                    <div className="p-4 text-sm text-red-600 bg-red-50">{errorNotifs}</div>
                  )}
                  {loadingNotifs && notifications.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 text-center">Cargando...</div>
                  )}
                  {!loadingNotifs && notifications.length === 0 && !errorNotifs && (
                    <div className="p-6 text-center text-sm text-gray-500">No hay notificaciones nuevas.</div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={async () => {
                        if (!notification.leido) {
                          try { await api.marcarNotificacionLeida(notification.id) } catch (e) { console.error(e) }
                        }
                        const tipo = notification.tipo || ''
                        if (tipo.startsWith('evaluacion:')) {
                          const parts = tipo.split(':')
                          const id = Number(parts[1])
                          if (!Number.isNaN(id) && id > 0) {
                            navigate(`/estudiante/evaluaciones/${id}/rendir`)
                          } else {
                            navigate('/estudiante/tareas')
                          }
                        } else if (tipo === 'evaluacion') {
                          navigate('/estudiante/tareas')
                        } else {
                          navigate('/estudiante/tareas')
                        }
                        setMenuOpen(false)
                        loadNotifications()
                      }}
                      className={`px-4 py-3 border-b border-border-soft cursor-pointer hover:bg-gray-50 transition-colors ${notification.leido ? 'bg-white' : 'bg-[#FFF5F5]'}`}
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
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3.5">
        <Stat
          icon={Trophy}
          bg="#FEE2E2"
          iconColor="#C8102E"
          label="Promedio actual"
          value={loading ? '—' : `${promedio.toFixed(1)} / 20`}
        />
        <Stat
          icon={FileText}
          bg="#FEF3C7"
          iconColor="#92400E"
          label="Tareas pendientes"
          value={loading ? '—' : String(resumen?.tareas_pendientes ?? tareasPendientes.length)}
        />
        <Stat
          icon={CalendarCheck}
          bg="#DCFCE7"
          iconColor="#15803D"
          label="Asistencia"
          value={loading ? '—' : (resumen?.asistencia_pct != null ? `${resumen.asistencia_pct}%` : '—')}
        />
        <Stat
          icon={BookOpen}
          bg="rgba(255,255,255,0.15)"
          iconColor="#FFFFFF"
          label="Cursos matriculados"
          value={loading ? '—' : String(resumen?.cursos ?? cursos.length)}
          inverse
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-3.5">
        <div className="flex flex-col gap-3.5">
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1A1A1A]">Mis cursos</h2>
              <span className="text-[11px] text-gray-400">{cursos.length} matriculados</span>
            </div>
            {loading && (
              <div className="py-6 text-center text-xs text-gray-400">Cargando cursos...</div>
            )}
            {!loading && cursos.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                Aún no estás matriculado en ningún curso. Habla con el área administrativa.
              </div>
            )}
            {cursos.length > 0 && (
              <div className="grid grid-cols-4 gap-2.5">
                {cursos.slice(0, 8).map((c, i) => {
                  const color = COLORES_CURSO[i % COLORES_CURSO.length]
                  return (
                    <div key={c.id} className="bg-surface-muted rounded-xl p-3.5 flex flex-col gap-2.5">
                      <div className="h-8 w-8 rounded-lg grid place-items-center text-white text-[13px] font-bold" style={{ background: color }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#1A1A1A] leading-tight">{c.nombre}</span>
                        <span className="text-[10px] text-gray-400">{c.docente ?? '—'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {c.grado}-{c.seccion} · {c.periodo}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1A1A1A]">Tareas pendientes</h2>
              <span className="text-[11px] text-gray-400">
                {tareasPendientes.length} entrega(s) próxima(s)
              </span>
            </div>
            {!loading && tareasPendientes.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                No tienes tareas pendientes. ¡Bien hecho!
              </div>
            )}
            <div className="flex flex-col gap-2">
              {tareasPendientes.slice(0, 5).map((t) => {
                const d = new Date(t.fecha_limite)
                const dia = d.getDate().toString().padStart(2, '0')
                const mes = d.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase().replace('.', '')
                return (
                  <div key={t.id} className="bg-surface-muted rounded-xl px-3.5 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center text-white leading-none bg-inei-600">
                      <span className="text-[13px] font-bold">{dia}</span>
                      <span className="text-[8px] font-bold mt-0.5">{mes}</span>
                    </div>
                    <div className="flex-1 flex flex-col leading-tight">
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">{t.titulo}</span>
                      <span className="text-[11px] text-gray-400">
                        {t.curso.nombre} · {t.curso.docente}
                      </span>
                    </div>
                    <span className="px-2.5 h-6 inline-flex items-center rounded-full text-[10px] font-bold bg-inei-100 text-inei-700">
                      {t.tipo}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl p-5 flex flex-col gap-3.5 text-white">
          <span className="text-[11px] font-semibold text-white/80">Próxima clase</span>
          <h3 className="text-[22px] font-bold">{proximaClase?.nombre ?? '—'}</h3>
          <InfoRow icon={AlarmClock} text="Hoy · 10:30 am - 12:00 pm" />
          <InfoRow icon={MapPin} text="Aula 304 · Pabellón B" />
          <InfoRow icon={Book} text={proximaClase?.descripcion ?? 'Sin descripción registrada'} />

          <div className="h-px bg-white/15" />
          <span className="text-[10px] font-semibold text-white/60">DATOS DEL ESTUDIANTE</span>

          <NotifCard title={`DNI: ${auth.dni}`} desc={`${auth.grado ?? '—'} · Sección ${auth.seccion ?? '—'}`} />
          <NotifCard title={`${tareas.length} tarea(s) publicada(s)`} desc="En todos tus cursos del periodo" />
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  bg,
  iconColor,
  label,
  value,
  inverse = false,
}: {
  icon: typeof Trophy
  bg: string
  iconColor: string
  label: string
  value: string
  inverse?: boolean
}) {
  return (
    <div
      className={`rounded-xl px-4.5 py-4 flex items-center gap-3.5 ${
        inverse ? 'bg-[#1A1A1A] text-white' : 'bg-white'
      }`}
    >
      <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: bg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`text-[11px] ${inverse ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <span className={`text-base font-bold ${inverse ? '' : 'text-[#1A1A1A]'}`}>{value}</span>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, text }: { icon: typeof AlarmClock; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-white/80">
      <Icon size={14} />
      <span>{text}</span>
    </div>
  )
}

function NotifCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-3 flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold">{title}</span>
      <span className="text-[10px] text-white/80">{desc}</span>
    </div>
  )
}
