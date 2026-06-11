import { useEffect, useState } from 'react'
import {
  BookOpen,
  CircleCheck,
  GraduationCap,
  Plus,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
  X,
  FileText,
  Video,
  Presentation,
  Link2,
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  Users as UsersIcon,
  ExternalLink,
} from 'lucide-react'
import Pill from '../components/Pill'
import {
  api,
  type ContenidoCursoDTO, type ContenidoTipo, type CursoDTO, type CursosResponse,
  type TareaDTO, type UsuarioBreve, type HorarioMaestroCurso,
} from '../lib/api'

export default function Cursos() {
  const [data, setData] = useState<CursosResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CursoDTO | null>(null)
  const [verCurso, setVerCurso] = useState<CursoDTO | null>(null)

  const load = () => {
    api.cursos()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar cursos'))
  }

  useEffect(() => { load() }, [])

  const cursos = data?.cursos ?? []
  const totales = data?.totales

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Gestión de Nuevos Cursos</h1>
          <p className="text-sm text-gray-600">Administra los cursos del periodo académico 2026 - I</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo curso
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total de cursos" value={String(totales?.cursos ?? '—')} footer="Registrados en el sistema" icon={BookOpen} />
        <StatCard label="Cursos activos" value={String(totales?.activos ?? '—')} footer="Con dictado en curso" icon={CircleCheck} />
        <StatCard
          label="Estudiantes matriculados"
          value={String(totales?.estudiantes_matriculados ?? '—')}
          footer="Estudiantes únicos en el periodo"
          icon={GraduationCap}
          variant="inverse"
        />
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1A1A1A]">Listado de cursos</h2>
          <div className="flex gap-2">
            <FilterChip label="Periodo: 2026 - I" />
            <FilterChip label="Grado: Todos" />
            <FilterChip label="Estado: Todos" />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-[1fr_1.4fr_1.2fr_0.8fr_1fr_0.8fr_90px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
            <span>Código</span>
            <span>Curso</span>
            <span>Docente</span>
            <span>Grado</span>
            <span>Estudiantes</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {!data && (
            <div className="py-10 text-center text-xs text-gray-400">Cargando cursos...</div>
          )}
          {cursos.map((c, i) => (
            <div key={c.codigo}>
              <div className="grid grid-cols-[1fr_1.4fr_1.2fr_0.8fr_1fr_0.8fr_90px] gap-3 h-14 px-3.5 items-center">
                <span className="text-xs font-semibold text-[#1A1A1A]">{c.codigo}</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{c.nombre}</span>
                  <span className="text-[10px] text-gray-400">{c.descripcion}</span>
                </div>
                <span className="text-xs text-gray-600">{c.docente}</span>
                <span className="text-xs text-gray-600">{c.grado} - {c.seccion}</span>
                <span className="text-xs text-gray-600">{c.estudiantes} estudiantes</span>
                <Pill variant={c.estado ? 'success' : 'muted'}>
                  {c.estado ? 'Activo' : 'Inactivo'}
                </Pill>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <button onClick={() => setVerCurso(c)} className="hover:text-[#1A1A1A]" title="Ver detalle del curso"><Eye size={16} /></button>
                  <button onClick={() => { setEditing(c); setModalOpen(true) }} className="hover:text-[#1A1A1A]" title="Editar"><Pencil size={16} /></button>
                  <button onClick={async () => {
                    if (!confirm(`¿Eliminar el curso ${c.codigo}?`)) return
                    try { await api.eliminarCurso(c.id); load() } catch (e) { alert(e instanceof Error ? e.message : 'Error') }
                  }} className="hover:text-inei-600"><Trash2 size={16} /></button>
                </div>
              </div>
              {i < cursos.length - 1 && <div className="h-px bg-border-softer" />}
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <NuevoCursoModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onCreated={() => { setModalOpen(false); setEditing(null); load() }}
        />
      )}

      {verCurso && (
        <DetalleCursoModal curso={verCurso} onClose={() => setVerCurso(null)} />
      )}
    </div>
  )
}

// ---------------- Detalle del curso (modal) ---------------------------------

const tipoLabels: Record<ContenidoTipo, string> = {
  texto: 'Texto', video: 'Video', presentacion: 'Presentación',
  ejercicio: 'Ejercicio', pdf: 'PDF', cuestionario: 'Cuestionario', enlace: 'Enlace',
}
const tipoColor: Record<ContenidoTipo, { bg: string; text: string }> = {
  texto: { bg: '#DBEAFE', text: '#1E40AF' },
  video: { bg: '#DBEAFE', text: '#1E40AF' },
  presentacion: { bg: '#E9D5FF', text: '#6B21A8' },
  ejercicio: { bg: '#FEF3C7', text: '#92400E' },
  pdf: { bg: '#FEE2E2', text: '#991B1B' },
  cuestionario: { bg: '#DCFCE7', text: '#15803D' },
  enlace: { bg: '#F3F4F6', text: '#374151' },
}
const tipoIcon: Record<ContenidoTipo, typeof FileText> = {
  texto: FileText, video: Video, presentacion: Presentation,
  ejercicio: Pencil, pdf: FileText, cuestionario: FileText, enlace: Link2,
}

function DetalleCursoModal({ curso, onClose }: { curso: CursoDTO; onClose: () => void }) {
  const [tab, setTab] = useState<'info' | 'contenido' | 'tareas' | 'horario'>('info')
  const [contenido, setContenido] = useState<ContenidoCursoDTO | null>(null)
  const [tareas, setTareas] = useState<TareaDTO[]>([])
  const [horarios, setHorarios] = useState<HorarioMaestroCurso | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set())

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.contenidoDeCurso(curso.id).then((d) => {
        setContenido(d)
        setExpandidas(new Set(d.unidades.map((u) => u.id)))
      }).catch(() => setContenido(null)),
      api.tareas().then((r) => setTareas(r.tareas.filter((t) => t.curso.id === curso.id))).catch(() => setTareas([])),
      api.horarioMaestro(curso.grado, curso.seccion)
        .then((h) => setHorarios(h.cursos.find((c) => c.id === curso.id) ?? null))
        .catch(() => setHorarios(null)),
    ])
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [curso.id])

  const toggle = (uid: number) => {
    setExpandidas((s) => {
      const n = new Set(s)
      if (n.has(uid)) n.delete(uid); else n.add(uid)
      return n
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-inei-600 to-inei-700 px-6 py-5 text-white flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 grid place-items-center text-2xl font-bold">
            {curso.nombre.charAt(0)}
          </div>
          <div className="flex flex-col leading-tight flex-1">
            <span className="text-[11px] uppercase font-bold opacity-80">{curso.codigo}</span>
            <h2 className="text-xl font-bold">{curso.nombre}</h2>
            <span className="text-xs opacity-90">{curso.descripcion ?? 'Sin descripción'}</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>

        <div className="border-b border-border-soft flex gap-1 px-4">
          <Tab active={tab === 'info'} onClick={() => setTab('info')} icon={BookOpen} label="Información" />
          <Tab active={tab === 'contenido'} onClick={() => setTab('contenido')} icon={FileText} label={`Material (${contenido?.unidades.length ?? 0})`} />
          <Tab active={tab === 'tareas'} onClick={() => setTab('tareas')} icon={ClipboardList} label={`Tareas (${tareas.length})`} />
          <Tab active={tab === 'horario'} onClick={() => setTab('horario')} icon={Calendar} label="Horario" />
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-4 flex-1">
          {error && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>}
          {loading && <div className="py-10 text-center text-xs text-gray-400">Cargando...</div>}

          {!loading && tab === 'info' && (
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={GraduationCap} label="Docente asignado" value={curso.docente} />
              <InfoCard icon={UsersIcon} label="Grado · Sección" value={`${curso.grado} - ${curso.seccion}`} />
              <InfoCard icon={UsersIcon} label="Estudiantes matriculados" value={`${curso.estudiantes}`} />
              <InfoCard icon={Calendar} label="Periodo académico" value={curso.periodo} />
              <InfoCard icon={CircleCheck} label="Estado" value={curso.estado ? 'Activo' : 'Inactivo'} />
              <InfoCard icon={FileText} label="Código" value={curso.codigo} />
            </div>
          )}

          {!loading && tab === 'contenido' && (
            <>
              {!contenido || contenido.unidades.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <BookOpen size={32} className="text-gray-300" />
                  <p className="text-sm text-gray-500">El docente aún no ha publicado material para este curso.</p>
                </div>
              ) : (
                contenido.unidades.map((u) => {
                  const exp = expandidas.has(u.id)
                  return (
                    <div key={u.id} className="rounded-xl border border-border-softer overflow-hidden">
                      <button onClick={() => toggle(u.id)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-lg bg-inei-100 text-inei-600 text-sm font-bold grid place-items-center">{u.numero}</span>
                          <div className="flex flex-col leading-tight items-start">
                            <h3 className="text-sm font-bold text-[#1A1A1A]">Unidad {u.numero}: {u.titulo}</h3>
                            {u.descripcion && <span className="text-[11px] text-gray-400">{u.descripcion}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-5 px-2 rounded-full bg-inei-100 text-inei-600 text-[10px] font-bold inline-flex items-center">
                            {u.temas} {u.temas === 1 ? 'tema' : 'temas'}
                          </span>
                          {exp ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </button>
                      {exp && (
                        <div className="border-t border-border-softer p-3 flex flex-col gap-1.5">
                          {u.contenidos.length === 0 && (
                            <div className="py-3 text-center text-xs text-gray-400">Sin temas en esta unidad.</div>
                          )}
                          {u.contenidos.map((c) => {
                            const Icon = tipoIcon[c.tipo]
                            const color = tipoColor[c.tipo]
                            const Wrapper: React.ElementType = c.url ? 'a' : 'div'
                            const props = c.url ? { href: c.url, target: '_blank', rel: 'noopener noreferrer' } : {}
                            return (
                              <Wrapper key={c.id} {...props}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border border-border-softer ${c.url ? 'hover:border-inei-600 hover:bg-inei-50 cursor-pointer' : ''}`}>
                                <div className="h-8 w-8 rounded-md grid place-items-center shrink-0" style={{ background: color.bg }}>
                                  <Icon size={14} style={{ color: color.text }} />
                                </div>
                                <div className="flex flex-col leading-tight flex-1 min-w-0">
                                  <span className="text-[12px] font-semibold text-[#1A1A1A] truncate">{c.titulo}</span>
                                  {c.descripcion && <span className="text-[10px] text-gray-500 truncate">{c.descripcion}</span>}
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: color.bg, color: color.text }}>
                                  {tipoLabels[c.tipo]}
                                </span>
                                {c.url && <ExternalLink size={12} className="text-gray-400" />}
                              </Wrapper>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </>
          )}

          {!loading && tab === 'tareas' && (
            <>
              {tareas.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <ClipboardList size={32} className="text-gray-300" />
                  <p className="text-sm text-gray-500">No hay tareas registradas en este curso.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {tareas.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-softer">
                      <div className="h-10 w-10 rounded-lg bg-inei-100 grid place-items-center">
                        <ClipboardList size={16} className="text-inei-600" />
                      </div>
                      <div className="flex flex-col leading-tight flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400">{t.tipo}</span>
                          <Pill variant={t.publicada ? 'success' : 'muted'} showDot={false}>
                            {t.publicada ? 'Publicada' : 'Borrador'}
                          </Pill>
                        </div>
                        <span className="text-[13px] font-bold text-[#1A1A1A] truncate">{t.titulo}</span>
                        <span className="text-[10px] text-gray-400">
                          Vence: {new Date(t.fecha_limite).toLocaleDateString('es-PE')} · {t.puntaje_maximo} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && tab === 'horario' && (
            <>
              {!horarios || horarios.horarios.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <Calendar size={32} className="text-gray-300" />
                  <p className="text-sm text-gray-500">Este curso no tiene horarios asignados.</p>
                  <p className="text-[11px] text-gray-400">Asígnalos desde la sección Asignaciones.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {horarios.horarios.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border-l-4 border-inei-600 bg-inei-50">
                      <div className="h-10 w-10 rounded-lg bg-white grid place-items-center">
                        <Clock size={16} className="text-inei-600" />
                      </div>
                      <div className="flex flex-col leading-tight flex-1">
                        <span className="text-sm font-bold text-[#1A1A1A] capitalize">{h.dia_semana}</span>
                        <span className="text-xs text-gray-600">
                          {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                        </span>
                      </div>
                      {h.aula && (
                        <span className="text-xs font-semibold text-[#1A1A1A] inline-flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" /> {h.aula}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Tab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof BookOpen; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-xs font-semibold inline-flex items-center gap-2 border-b-2 transition ${
        active ? 'border-inei-600 text-inei-600' : 'border-transparent text-gray-500 hover:text-[#1A1A1A]'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-softer p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-inei-100 grid place-items-center">
        <Icon size={18} className="text-inei-600" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
        <span className="text-sm font-bold text-[#1A1A1A]">{value}</span>
      </div>
    </div>
  )
}

function NuevoCursoModal({ editing, onClose, onCreated }: { editing: CursoDTO | null; onClose: () => void; onCreated: () => void }) {
  const isEdit = !!editing
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [form, setForm] = useState({
    codigo: editing?.codigo ?? '',
    nombre: editing?.nombre ?? '',
    descripcion: editing?.descripcion ?? '',
    grado: editing?.grado ?? '3ro',
    seccion: editing?.seccion ?? 'A',
    docente_id: 0,
    periodo: editing?.periodo ?? '2026-I',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.usuariosPorRol('docente').then((r) => {
      setDocentes(r.users)
      if (editing) {
        const found = r.users.find((u) => `${u.nombres} ${u.apellidos}`.trim() === editing.docente.trim())
        setForm((f) => ({ ...f, docente_id: found?.id ?? r.users[0]?.id ?? 0 }))
      } else if (r.users[0]) {
        setForm((f) => ({ ...f, docente_id: r.users[0].id }))
      }
    })
  }, [editing])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setErr(null)
          if (!form.docente_id) {
            setErr('Selecciona un docente')
            return
          }
          setSaving(true)
          try {
            const payload = {
              codigo: form.codigo,
              nombre: form.nombre,
              descripcion: form.descripcion || undefined,
              grado: form.grado,
              seccion: form.seccion,
              docente_id: form.docente_id,
              periodo: form.periodo,
            }
            if (isEdit && editing) {
              await api.actualizarCurso(editing.id, payload)
            } else {
              await api.crearCurso(payload)
            }
            onCreated()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'No se pudo guardar el curso')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{isEdit ? 'Editar curso' : 'Nuevo curso'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">
            {err}
          </div>
        )}

        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Field label="Código">
            <input
              required
              disabled={isEdit}
              className={`input ${isEdit ? 'bg-border-softer cursor-not-allowed' : ''}`}
              maxLength={12}
              placeholder="CUR006"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Nombre del curso">
            <input
              required
              className="input"
              maxLength={80}
              placeholder="Filosofía"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Descripción">
          <input
            className="input"
            maxLength={160}
            placeholder="Lógica y ética"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Grado">
            <select
              className="input"
              value={form.grado}
              onChange={(e) => setForm({ ...form, grado: e.target.value })}
            >
              {['1ro', '2do', '3ro', '4to', '5to'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Sección">
            <select
              className="input"
              value={form.seccion}
              onChange={(e) => setForm({ ...form, seccion: e.target.value })}
            >
              {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Periodo">
            <input
              className="input"
              value={form.periodo}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Docente">
          <select
            required
            className="input"
            value={form.docente_id}
            onChange={(e) => setForm({ ...form, docente_id: Number(e.target.value) })}
          >
            {docentes.length === 0 && <option value="0">Cargando docentes...</option>}
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombres} {d.apellidos}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600 hover:text-[#1A1A1A]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 text-white text-sm font-semibold"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar curso'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatCard({
  label,
  value,
  footer,
  icon: Icon,
  variant = 'default',
}: {
  label: string
  value: string
  footer: string
  icon: typeof BookOpen
  variant?: 'default' | 'inverse'
}) {
  const inverse = variant === 'inverse'
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-2.5 ${
        inverse ? 'bg-inei-600 text-white' : 'bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs ${inverse ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <div
          className={`h-8 w-8 rounded-lg grid place-items-center ${
            inverse ? 'bg-white/15' : 'bg-surface-muted'
          }`}
        >
          <Icon size={16} className={inverse ? 'text-white' : 'text-inei-600'} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${inverse ? '' : 'text-[#1A1A1A]'}`}>{value}</div>
      <div className={`text-[11px] ${inverse ? 'text-white/80' : 'text-gray-600'}`}>{footer}</div>
    </div>
  )
}

function FilterChip({ label }: { label: string }) {
  return (
    <button className="h-8 px-3 rounded-lg bg-surface-muted hover:bg-border-softer text-[11px] text-gray-600 inline-flex items-center gap-1.5">
      {label}
      <ChevronDown size={12} className="text-gray-400" />
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}
