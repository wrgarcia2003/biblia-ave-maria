import React, { useEffect, useState } from 'react'
import { ArrowLeft, Play } from 'lucide-react'
import * as santosService from '../services/santosService'

const AdminSantos = ({ onVoltar }) => {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [lista, setLista] = useState([])
  const [data, setData] = useState('')
  const [titulo, setTitulo] = useState('')
  const [santoNome, setSantoNome] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [historia, setHistoria] = useState('')

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const r = await santosService.listarSantos({})
      setLista(r || [])
    } catch (e) {
      setErro('Erro ao carregar santos do dia')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const salvar = async () => {
    if (!data || !videoUrl) return
    const payload = { data, titulo, santo_nome: santoNome, video_url: videoUrl, historia_md: historia }
    const r = await santosService.salvarSanto(payload)
    if (r) { setData(''); setTitulo(''); setSantoNome(''); setVideoUrl(''); setHistoria(''); await carregar() }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-4xl mx-auto p-6 pb-24">
        <button onClick={onVoltar} className="flex items-center gap-2 text-brand-700 hover:text-brand-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-brand-900 mb-6">Gerenciar Santos do Dia</h1>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{erro}</div>
        )}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-800 mb-1">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded" />
            </div>
            <div>
              <label className="block text-sm text-brand-800 mb-1">Título</label>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded" />
            </div>
            <div>
              <label className="block text-sm text-brand-800 mb-1">Santo</label>
              <input value={santoNome} onChange={(e) => setSantoNome(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded" />
            </div>
            <div>
              <label className="block text-sm text-brand-800 mb-1">Link YouTube</label>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-3 py-2 border border-neutral-300 rounded" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-brand-800 mb-1">História</label>
            <textarea value={historia} onChange={(e) => setHistoria(e.target.value)} rows={6} className="w-full px-3 py-2 border border-neutral-300 rounded" />
          </div>
          <div className="mt-4">
            <button onClick={salvar} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">Salvar</button>
          </div>
        </div>

        <div className="space-y-3">
          {carregando ? (
            <div className="text-center text-brand-700">Carregando...</div>
          ) : (
            (lista || []).map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-brand-900">{s.titulo || s.santo_nome || 'Santo do Dia'}</div>
                    <div className="text-sm text-neutral-600">{s.data}</div>
                  </div>
                  <a href={s.video_url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-accent-100 text-accent-800 hover:bg-accent-200 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Assistir
                  </a>
                </div>
                {s.historia_md && (
                  <div className="mt-3 text-neutral-800 whitespace-pre-line">{s.historia_md}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSantos
