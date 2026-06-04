import { useEffect, useState } from 'react'
import { Plus, X, Trash2, Clock, GraduationCap, BookOpen } from 'lucide-react'
import { api, type AsignacionDTO, type CursoDTO, type UsuarioBreve } from '../lib/api'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']

export default function AdminAsignaciones() {
  const [asignaciones, setAsignaciones] = useState<AsignacionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.asignaciones()
      .then((r) => setAsignaciones(r.asignaciones))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta asignación? También se borrarán sus horarios.')) return
    await api.eliminarAsignacion(id)
    load()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Asignaciones docentes</h1>
          <p className="text-sm text-gray-600">Asigna cursos a docentes con su aula y horario semanal</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus size={16} /> Nueva asignación
        </button>
      </div>

      {error && (<div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{error}</div>)}

      <div className="grid grid-cols-3 gap-3.5">
        <Stat icon={GraduationCap} label="Asignaciones activas" value={String(asignaciones.filter(a => a.estado === 'activa').length)} />
        <Stat icon={BookOpen} label="Cursos asignados" value={String(new Set(asignaciones.map(a => a.curso.id)).size)} />
        <Stat icon={Clock} label="Bloques horarios" value={String(asignaciones.reduce((acc, a) => acc + a.horarios.length, 0))} />
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1A1A1A]">Listado</h2>
        <div className="grid grid-cols-[1.4fr_1.4fr_120px_120px_1fr_60px] gap-3 h-10 px-3 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Docente</span><span>Curso</span><span>Aula</span><span>Periodo</span><span>Horario</span><span></span>
        </div>
        {loading && <div className="py-8 text-center text-xs text-gray-400">Cargando...</div>}
        {!loading && asignaciones.length === 0 && <div className="py-8 text-center text-xs text-gray-400">Aún no hay asignaciones.</div>}
        {asignaciones.map((a, i) => (
          <div key={a.id}>
            <div className="grid grid-cols-[1.4fr_1.4fr_120px_120px_1fr_60px] gap-3 min-h-14 px-3 items-center">
              <span className="text-xs font-semibold text-[#1A1A1A]">{a.docente.nombre}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-[#1A1A1A]">{a.curso.codigo} · {a.curso.nombre}</span>
                <span className="text-[10px] text-gray-400">{a.curso.grado}-{a.curso.seccion}</span>
              </div>
              <span className="text-[11px] text-gray-600">{a.aula ?? '—'}</span>
              <span className="text-[11px] text-gray-600">{a.periodo}</span>
              <div className="flex flex-wrap gap-1">
                {a.horarios.length === 0 && <span className="text-[10px] text-gray-400">—</span>}
                {a.horarios.slice(0, 3).map((h) => (
                  <span key={h.id} className="h-5 px-1.5 inline-flex items-center rounded text-[9px] font-semibold bg-inei-100 text-inei-700">
                    {h.dia_semana.slice(0, 3)} {h.hora_inicio.slice(0, 5)}
                  </span>
                ))}
                {a.horarios.length > 3 && <span className="text-[10px] text-gray-400">+{a.horarios.length - 3}</span>}
              </div>
              <button onClick={() => eliminar(a.id)} className="text-gray-400 hover:text-inei-600"><Trash2 size={14} /></button>
            </div>
            {i < asignaciones.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>

      {modalOpen && <NuevaAsignacionModal onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); load() }} />}
    </div>
  )
}

const GRADOS = ['1ro', '2do', '3ro', '4to', '5to']
const SECCIONES = ['A', 'B', 'C', 'D']

function NuevaAsignacionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [cursos, setCursos] = useState<CursoDTO[]>([])
  const [filtroGrado, setFiltroGrado] = useState<string>('')
  const [filtroSeccion, setFiltroSeccion] = useState<string>('')
  const [form, setForm] = useState({ id_docente: 0, id_curso: 0, aula: '304', periodo: '2026-I' })
  const [horarios, setHorarios] = useState<{ dia_semana: string; hora_inicio: string; hora_fin: string }[]>([
    { dia_semana: 'lunes', hora_inicio: '08:00', hora_fin: '09:30' },
  ])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.usuariosPorRol('docente').then((r) => {
      setDocentes(r.users)
      if (r.users[0]) setForm((f) => ({ ...f, id_docente: r.users[0].id }))
    })
    api.cursos().then((r) => {
      setCursos(r.cursos)
      if (r.cursos[0]) setForm((f) => ({ ...f, id_curso: r.cursos[0].id }))
    })
  }, [])

  // Filtrar cursos según grado/sección seleccionados
  const cursosFiltrados = cursos.filter((c) => {
    if (filtroGrado && c.grado !== filtroGrado) return false
    if (filtroSeccion && c.seccion !== filtroSeccion) return false
    return true
  })

  // Si el curso actual no está en los filtrados, autoseleccionar el primero
  useEffect(() => {
    if (cursosFiltrados.length > 0 && !cursosFiltrados.find((c) => c.id === form.id_curso)) {
      setForm((f) => ({ ...f, id_curso: cursosFiltrados[0].id }))
    }
  }, [filtroGrado, filtroSeccion, cursos.length])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setErr(null)
          try {
            await api.crearAsignacion({
              id_docente: form.id_docente,
              id_curso: form.id_curso,
              aula: form.aula || undefined,
              periodo: form.periodo,
              horarios: horarios.filter(h => h.dia_semana && h.hora_inicio && h.hora_fin),
            })
            onCreated()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Error')
          } finally {
            setSaving(false)
          }
        }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Nueva asignación</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {err && <div className="rounded-lg bg-inei-50 border border-inei-200 px-3 py-2 text-xs text-inei-700">{err}</div>}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Docente</label>
          <select className="input" value={form.id_docente} onChange={(e) => setForm({ ...form, id_docente: Number(e.target.value) })}>
            {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Filtrar por grado</label>
            <select className="input" value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)}>
              <option value="">Todos los grados</option>
              {GRADOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Filtrar por sección</label>
            <select className="input" value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)}>
              <option value="">Todas las secciones</option>
              {SECCIONES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">
            Curso <span className="text-gray-400">({cursosFiltrados.length} disponibles{filtroGrado || filtroSeccion ? ' con los filtros' : ''})</span>
          </label>
          <select
            className="input"
            value={form.id_curso}
            onChange={(e) => setForm({ ...form, id_curso: Number(e.target.value) })}
            disabled={cursosFiltrados.length === 0}
          >
            {cursosFiltrados.length === 0 && <option value="">No hay cursos para esa combinación</option>}
            {cursosFiltrados.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre} ({c.grado}-{c.seccion})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Aula</label>
            <input className="input" value={form.aula} maxLength={50} onChange={(e) => setForm({ ...form, aula: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Periodo</label>
            <input className="input" value={form.periodo} maxLength={20} onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-border-softer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1A1A1A]">Horarios</span>
            <button type="button" onClick={() => setHorarios([...horarios, { dia_semana: 'lunes', hora_inicio: '08:00', hora_fin: '09:30' }])} className="text-[11px] font-semibold text-inei-600">
              + Agregar bloque
            </button>
          </div>
          {horarios.map((h, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_90px_90px_24px] gap-2 items-center">
              <select className="input" value={h.dia_semana} onChange={(e) => setHorarios(horarios.map((x, i) => i === idx ? { ...x, dia_semana: e.target.value } : x))}>
                {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="time" className="input" value={h.hora_inicio} onChange={(e) => setHorarios(horarios.map((x, i) => i === idx ? { ...x, hora_inicio: e.target.value } : x))} />
              <input type="time" className="input" value={h.hora_fin} onChange={(e) => setHorarios(horarios.map((x, i) => i === idx ? { ...x, hora_fin: e.target.value } : x))} />
              <button type="button" onClick={() => setHorarios(horarios.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-inei-600"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-white border border-border-soft text-sm font-semibold text-gray-600">Cancelar</button>
          <button
            type="submit"
            disabled={saving || cursosFiltrados.length === 0 || !form.id_curso}
            className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold"
          >
            {saving ? 'Guardando...' : 'Crear asignación'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-inei-100 grid place-items-center"><Icon size={18} className="text-inei-600" /></div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-2xl font-bold text-[#1A1A1A]">{value}</span>
      </div>
    </div>
  )
}
