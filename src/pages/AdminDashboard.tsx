import { useEffect, useState } from 'react'
import { BookOpen, CircleCheck, GraduationCap, Users, ClipboardList } from 'lucide-react'
import { api, type CursosResponse, type UsuarioBreve } from '../lib/api'

export default function AdminDashboard() {
  const [data, setData] = useState<CursosResponse | null>(null)
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [estudiantes, setEstudiantes] = useState<UsuarioBreve[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.cursos(),
      api.usuariosPorRol('docente'),
      api.usuariosPorRol('estudiante'),
    ])
      .then(([c, d, e]) => {
        setData(c)
        setDocentes(d.users)
        setEstudiantes(e.users)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard Newest</h1>
        <p className="text-sm text-gray-600">
          Resumen general del periodo académico 2026 - I
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card icon={BookOpen} label="Cursos" value={loading ? '—' : String(data?.totales.cursos ?? 0)} />
        <Card icon={CircleCheck} label="Cursos activos" value={loading ? '—' : String(data?.totales.activos ?? 0)} />
        <Card icon={GraduationCap} label="Estudiantes" value={loading ? '—' : String(estudiantes.length)} />
        <Card icon={Users} label="Docentes" value={loading ? '—' : String(docentes.length)} highlight />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Cursos más activos</h2>
            <span className="text-[11px] text-gray-400">Top 5 por estudiantes</span>
          </div>
          {data?.cursos.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-inei-100 grid place-items-center text-inei-600 text-xs font-bold">
                {c.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">{c.nombre}</div>
                <div className="text-[10px] text-gray-400">{c.codigo} · {c.docente}</div>
              </div>
              <span className="text-xs font-semibold text-gray-600">{c.estudiantes} est.</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1A1A1A]">Actividad reciente</h2>
            <span className="text-[11px] text-gray-400">Últimos eventos</span>
          </div>
          <Activity icon={ClipboardList} text="Sistema operativo · 6 módulos académicos activos" />
          <Activity icon={GraduationCap} text={`${estudiantes.length} estudiantes registrados en el sistema`} />
          <Activity icon={Users} text={`${docentes.length} docentes asignados a cursos del periodo`} />
          <Activity icon={BookOpen} text={`${data?.cursos.length ?? 0} cursos creados en el periodo`} />
        </div>
      </div>
    </div>
  )
}

function Card({ icon: Icon, label, value, highlight = false }: { icon: typeof BookOpen; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-2.5 ${highlight ? 'bg-inei-600 text-white' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${highlight ? 'text-white/80' : 'text-gray-400'}`}>{label}</span>
        <div className={`h-8 w-8 rounded-lg grid place-items-center ${highlight ? 'bg-white/15' : 'bg-inei-100'}`}>
          <Icon size={16} className={highlight ? 'text-white' : 'text-inei-600'} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${highlight ? '' : 'text-[#1A1A1A]'}`}>{value}</div>
    </div>
  )
}

function Activity({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <div className="h-8 w-8 rounded-lg bg-surface-muted grid place-items-center">
        <Icon size={14} className="text-inei-600" />
      </div>
      <span>{text}</span>
    </div>
  )
}
