import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import * as catequeseService from '../services/catequeseService'

const slugify = (s) => s
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/[^a-z0-9_]/g, '')

const AdminCatequese = ({ onVoltar }) => {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [lista, setLista] = useState([])
  const [itemSel, setItemSel] = useState(null)
  const [segmentos, setSegmentos] = useState([])
  const [processando, setProcessando] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const focoRef = useRef(null)

  const carregarLista = async () => {
    setCarregando(true)
    setErro('')
    try {
      const r = await catequeseService.listarCatequeses({})
      setLista(r || [])
    } catch (e) {
      setErro('Erro ao carregar catequeses')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarLista() }, [])

  const carregarSegmentos = async (id) => {
    const segs = await catequeseService.listarSegmentos(id)
    setSegmentos(segs || [])
  }

  const handleUploadAudio = async (e, item) => {
    const file = e.target.files?.[0]
    if (!file || !item) return
    setProcessando(true)
    setUploadProgress(25)
    const name = `${slugify(item.titulo)}.mp3`
    const url = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/audios-catequese/${name}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { apikey: process.env.REACT_APP_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`, 'Content-Type': file.type || 'audio/mpeg', 'x-upsert': 'true' },
      body: file,
    })
    if (!res.ok) { setProcessando(false); return }
    setUploadProgress(50)
    const publicUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/audios-catequese/${name}`
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    await new Promise((resolve) => { audio.onloadedmetadata = resolve })
    const dur = Math.round(audio.duration || 0)
    const patch = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/catequeses?id=eq.${item.id}`, {
      method: 'PATCH',
      headers: { apikey: process.env.REACT_APP_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ audio_url: publicUrl, audio_duracao_segundos: dur }),
    })
    if (!patch.ok) { setProcessando(false); return }
    setUploadProgress(100)
    setTimeout(() => setProcessando(false), 300)
  }

  const handleImportarTexto = async (e, item) => {
    const file = e.target.files?.[0]
    if (!file || !item) return
    setProcessando(true)
    const texto = await file.text()
    const linhas = texto.split('\n').filter((l) => l.trim())
    const segs = linhas.map((l, i) => ({ catequese_id: item.id, numero: i + 1, texto: l.trim(), tempo_inicio: null, tempo_fim: null }))
    await catequeseService.deletarSegmentos(item.id)
    await catequeseService.inserirSegmentos(segs)
    await carregarSegmentos(item.id)
    setProcessando(false)
  }

  const calcularTimestamps = async (item, metodo = 'uniforme') => {
    const dur = item.audio_duracao_segundos || 0
    if (!dur || segmentos.length === 0) return
    let tempos = []
    if (metodo === 'uniforme') {
      const porSeg = dur / segmentos.length
      tempos = segmentos.map((s, i) => ({ id: s.id, inicio: porSeg * i, fim: porSeg * (i + 1) }))
    } else {
      const tamanhos = segmentos.map((s) => s.texto?.length || 50)
      const total = tamanhos.reduce((a, b) => a + b, 0)
      let acc = 0
      tempos = segmentos.map((s, i) => { const p = tamanhos[i] / total; const d = dur * p; const ini = acc; const fim = acc + d; acc = fim; return { id: s.id, inicio: ini, fim } })
    }
    for (const t of tempos) { await catequeseService.atualizarTimestamp(t.id, Number(t.inicio.toFixed(2)), Number(t.fim.toFixed(2))) }
    await carregarSegmentos(item.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-4xl mx-auto p-6 pb-32 md:pb-6">
        <button onClick={onVoltar} className="flex items-center gap-2 text-brand-700 hover:text-brand-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-brand-900 mb-6">Gerenciar Catequese</h1>
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{erro}</div>
        )}
        {carregando ? (
          <div className="text-center text-brand-700">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {lista.map((it) => (
              <div key={it.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-brand-900 font-semibold">{it.titulo}</div>
                  <button
                    onClick={async () => { setItemSel(it); await carregarSegmentos(it.id); focoRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                    className={`text-sm px-4 py-2 rounded-lg ${itemSel?.id === it.id ? 'bg-green-100 text-green-800' : 'bg-accent-100 text-accent-800 hover:bg-accent-200'}`}
                  >
                    {itemSel?.id === it.id ? 'Selecionado' : 'Selecionar'}
                  </button>
                </div>
                {itemSel?.id === it.id && (
                  <div ref={focoRef}>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <label className="cursor-pointer">
                        <div className="bg-brand-100 text-brand-700 px-4 py-3 rounded text-sm text-center hover:bg-brand-200 min-h-[44px] font-medium">Áudio</div>
                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleUploadAudio(e, it)} disabled={processando} />
                      </label>
                      <label className="cursor-pointer">
                        <div className="bg-purple-100 text-purple-700 px-4 py-3 rounded text-sm text-center hover:bg-purple-200 min-h-[44px] font-medium">Texto</div>
                        <input type="file" accept=".txt" className="hidden" onChange={(e) => handleImportarTexto(e, it)} disabled={processando} />
                      </label>
                      {it.audio_url && (
                        <button onClick={() => calcularTimestamps(it, 'proporcional')} className="bg-green-100 text-green-700 px-4 py-3 rounded text-sm hover:bg-green-200 min-h-[44px] font-medium" disabled={processando}>Sync</button>
                      )}
                    </div>
                    <div className="mt-4 text-sm text-neutral-700">Segmentos: {segmentos.length}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {processando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <p className="text-center font-semibold mb-4">Processando...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCatequese
