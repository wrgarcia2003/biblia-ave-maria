import React, { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Search } from 'lucide-react'
import * as catequeseService from '../services/catequeseService'

const CatequeseList = ({ onVoltar, onOpenDetail }) => {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [categorias, setCategorias] = useState([])
  const [itens, setItens] = useState([])
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('')

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const [cats, list] = await Promise.all([
        catequeseService.listarCategorias(),
        catequeseService.listarCatequeses({ categoria: categoria || null, q }),
      ])
      setCategorias(cats || [])
      setItens(list || [])
    } catch (e) {
      setErro('Erro ao carregar catequeses')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoria])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl font-bold text-brand-900">Catequese</h1>
          </div>
          <button onClick={onVoltar} className="flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-800 rounded-lg hover:bg-accent-200">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{erro}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-brand-500 w-4 h-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar títulos..."
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Todas as categorias</option>
              {(categorias || []).map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {carregando ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center text-brand-700 bg-brand-50 border border-brand-100 rounded-lg p-6">Nenhum conteúdo encontrado</div>
        ) : (
          <div className="space-y-3">
            {itens.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenDetail(item)}
                className="w-full text-left bg-white hover:bg-neutral-50 p-4 rounded-xl shadow-sm border border-neutral-100 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-brand-900">{item.titulo}</span>
                  <span className="text-sm text-brand-600">{item.categoria}</span>
                </div>
                <div className="text-sm text-neutral-600 mt-1">
                  {item.autor || 'Autor desconhecido'} {item.fonte ? `• ${item.fonte}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CatequeseList

