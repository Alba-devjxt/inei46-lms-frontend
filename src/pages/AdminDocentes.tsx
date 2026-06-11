import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type UsuarioBreve } from '../lib/api'

export default function AdminDocentes() {
  const [docentes, setDocentes] = useState<UsuarioBreve[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    api.usuariosPorRol('docente')
      .then((r) => setDocentes(r.users))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    if (!term) return docentes
    return docentes.filter((d) =>
      `${d.nombres} ${d.apellidos} ${d.dni}`.toLowerCase().includes(term)
    )
  }, [q, docentes])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Nuevos Docentes</h1>
          <p className="text-sm text-gray-600">
            {docentes.length} docentes asignados a cursos del periodo 2026 - I
          </p>
        </div>
        <Link
          to="/registro"
          className="h-10 px-4 rounded-lg bg-inei-600 hover:bg-inei-700 text-white text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo docente
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 h-9 w-72 px-3 rounded-lg bg-surface-muted">
            <Search size={14} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="flex-1 text-xs bg-transparent focus:outline-none"
            />
          </div>
          <span className="text-[11px] text-gray-400">{filtered.length} resultado(s)</span>
        </div>

        <div className="grid grid-cols-[60px_140px_1fr_140px] gap-3 h-10 px-3.5 bg-surface-muted rounded-lg items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Foto</span>
          <span>DNI</span>
          <span>Nombres y apellidos</span>
          <span>Acciones</span>
        </div>

        {loading && (
          <div className="py-8 text-center text-xs text-gray-400">Cargando docentes...</div>
        )}

        {filtered.map((d, i) => (
          <div key={d.id}>
            <div className="grid grid-cols-[60px_140px_1fr_140px] gap-3 min-h-14 px-3.5 items-center py-2">
              <div className="h-9 w-9 rounded-full bg-[#1A1A1A] grid place-items-center text-white text-xs font-bold">
                {d.nombres.charAt(0)}{d.apellidos.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-[#1A1A1A]">{d.dni}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#1A1A1A]">{d.nombres} {d.apellidos}</span>
                <span className="text-[10px] text-gray-400">Docente</span>
              </div>
              <Link
                to="/cursos"
                className="text-[11px] font-semibold text-inei-600 hover:text-inei-700 inline-flex items-center gap-1"
              >
                <BookOpen size={12} /> Ver cursos
              </Link>
            </div>
            {i < filtered.length - 1 && <div className="h-px bg-border-softer" />}
          </div>
        ))}
      </div>
    </div>
  )
}
