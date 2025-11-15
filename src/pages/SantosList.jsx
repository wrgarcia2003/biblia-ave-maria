import React, { useEffect, useState } from 'react'
import { ArrowLeft, Play, Calendar } from 'lucide-react'
import * as santosService from '../services/santosService'

const SantosList = ({ onVoltar, onOpenDetail }) => {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [itens, setItens] = useState([])

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const r = await santosService.listarSantos({ limit: 60 })
      setItens(r || [])
    } catch (e) {
      setErro('Erro ao carregar santos do dia')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl font-bold text-brand-900">Santos do Dia</h1>
          </div>
          <button onClick={onVoltar} className="flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-800 rounded-lg hover:bg-accent-200">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{erro}</div>
        )}

        {carregando ? (
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center text-brand-700 bg-brand-50 border border-brand-100 rounded-lg p-6">Nenhum item encontrado</div>
        ) : (
          <div className="space-y-3">
            {itens.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpenDetail(s)}
                className="w-full text-left bg-white hover:bg-neutral-50 p-4 rounded-xl shadow-sm border border-neutral-100 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-brand-900">{s.titulo || s.santo_nome || 'Santo do Dia'}</div>
                    <div className="text-sm text-neutral-600">{s.data}</div>
                  </div>
                  <div className="px-3 py-1 rounded bg-accent-100 text-accent-800 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Assistir
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SantosList

