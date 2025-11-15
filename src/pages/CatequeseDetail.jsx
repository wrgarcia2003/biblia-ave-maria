import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import * as catequeseService from '../services/catequeseService'

const renderTexto = (md) => {
  if (!md) return null
  return md.split('\n').map((l, i) => (
    <p key={i} className="mb-4 text-lg leading-relaxed text-neutral-800">{l}</p>
  ))
}

const CatequeseDetail = ({ item, onVoltar }) => {
  const [segmentos, setSegmentos] = useState([])
  const [tocando, setTocando] = useState(false)
  const [duracao, setDuracao] = useState(0)
  const [ativo, setAtivo] = useState(0)
  const audioRef = useRef(null)
  const containerRef = useRef(null)
  const startsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => { if (!item?.id) return; (async () => { const s = await catequeseService.listarSegmentos(item.id); setSegmentos(s || []) })() }, [item?.id])
  useEffect(() => { startsRef.current = segmentos.map((s) => parseFloat(s.tempo_inicio) || 0) }, [segmentos])
  useEffect(() => {
    const tick = () => {
      if (!audioRef.current) return
      const now = audioRef.current.currentTime || 0
      const arr = startsRef.current
      if (arr.length > 0) {
        let idx = 0
        for (let i = 0; i < arr.length; i++) { if (now >= arr[i]) idx = i }
        if (idx !== ativo) {
          setAtivo(idx)
          setTimeout(() => {
            const el = document.getElementById(`seg-${idx}`)
            const c = containerRef.current
            if (el && c) { const er = el.getBoundingClientRect(); const cr = c.getBoundingClientRect(); const st = c.scrollTop; const offset = er.top - cr.top + st - 20; c.scrollTo({ top: offset, behavior: 'smooth' }) }
          }, 50)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    if (tocando) { rafRef.current = requestAnimationFrame(tick); return () => rafRef.current && cancelAnimationFrame(rafRef.current) }
    return undefined
  }, [tocando, ativo])

  if (!item) return null
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl font-bold text-brand-900">{item.titulo}</h1>
          </div>
          <button onClick={onVoltar} className="flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-800 rounded-lg hover:bg-accent-200">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
        <div className="text-sm text-neutral-600 mb-4">
          {item.categoria} {item.autor ? `• ${item.autor}` : ''} {item.fonte ? `• ${item.fonte}` : ''}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
          {item.audio_url && (
            <div className="mb-6">
              <div className="mb-3">
                <audio
                  ref={audioRef}
                  src={item.audio_url}
                  onPlay={() => setTocando(true)}
                  onPause={() => setTocando(false)}
                  onLoadedMetadata={(e) => setDuracao(e.target.duration || 0)}
                />
              </div>
              <div className="flex items-center justify-center gap-6 mb-4">
                <button className="p-3 hover:bg-neutral-100 rounded-full" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10))}><SkipBack className="w-6 h-6 text-brand-800" /></button>
                <button className="p-4 bg-brand-600 hover:bg-brand-700 rounded-full shadow" onClick={() => audioRef.current && (tocando ? audioRef.current.pause() : audioRef.current.play())}>{tocando ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}</button>
                <button className="p-3 hover:bg-neutral-100 rounded-full" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.min(duracao, audioRef.current.currentTime + 10))}><SkipForward className="w-6 h-6 text-brand-800" /></button>
              </div>
            </div>
          )}
          <div ref={containerRef} className="max-h-96 overflow-y-auto">
            {(segmentos.length > 0 ? segmentos.map((s, i) => (
              <p key={s.id} id={`seg-${i}`} className={`mb-4 text-lg leading-relaxed ${i === ativo ? 'bg-accent-100 -mx-4 px-4 py-2 rounded-lg font-medium text-brand-900' : 'text-neutral-800'}`}> <sup className="font-bold text-brand-600 mr-2">{s.numero}</sup> {s.texto}</p>
            )) : renderTexto(item.conteudo_md || item.conteudo || ''))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CatequeseDetail
