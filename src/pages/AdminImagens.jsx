import React, { useEffect, useState } from 'react'
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'
import { listObjects, publicUrl, uploadObjectWithProgress, uploadObject } from '../services/storageService'
import { supabaseClient } from '../lib/supabase'

const slugify = (s) => s
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/[^\w.-]/g, '')

const BUCKET = 'landing-images'

const AdminImagens = ({ onVoltar }) => {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [imagens, setImagens] = useState([])
  const [processando, setProcessando] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sessaoOk, setSessaoOk] = useState(false)
  const [ultimoStatus, setUltimoStatus] = useState(null)
  const [meta, setMeta] = useState({})

  const carregar = async () => {
    setCarregando(true)
    setErro('')
    try {
      const objs = await listObjects(BUCKET, '')
      const arr = objs.map((o) => ({ name: o.name, url: publicUrl(BUCKET, o.name) }))
      setImagens(arr)
      try {
        const res = await fetch(publicUrl(BUCKET, 'index.json'))
        if (res.ok) {
          const idx = await res.json()
          const map = {}
          (idx.images || []).forEach((it) => {
            if (typeof it === 'string') map[it] = { title: '', credit: '', featured: false, order: 0 }
            else map[it.name] = {
              title: it.title || '',
              credit: it.credit || '',
              featured: !!it.featured,
              order: Number(it.order || 0),
            }
          })
          setMeta(map)
        }
      } catch (_) {}
    } catch (e) {
      setErro('Erro ao listar imagens. Verifique se o bucket "landing-images" existe e é público.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSessaoOk(!!data?.session?.access_token)
    })
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessando(true)
    setUploadProgress(0)
    setErro('')
    try {
      if (!sessaoOk) {
        throw new Error('Sessão ausente')
      }
      const nameBase = file.name?.split('.')?.slice(0, -1).join('.') || 'imagem'
      const ext = file.name?.split('.')?.pop() || 'jpg'
      const name = `${slugify(nameBase)}.${ext}`
      const result = await uploadObjectWithProgress(BUCKET, file, name, (p) => setUploadProgress(p))
      setUltimoStatus(result?.status ?? null)
      if (!result?.ok) throw new Error('Falha no upload')
      await carregar()
      try {
        const imagesForIndex = imagens.map((i) => ({ name: i.name, ...(meta[i.name] || {}) }))
        const indexBlob = new Blob([JSON.stringify({ images: imagesForIndex }, null, 2)], { type: 'application/json' })
        await uploadObject(BUCKET, indexBlob, 'index.json')
      } catch (_) {}
    } catch (e) {
      setErro(`Erro ao enviar imagem. ${ultimoStatus ? `Status ${ultimoStatus}. ` : ''}Verifique sessão, permissões e bucket público.`)
    } finally {
      setProcessando(false)
      e.target.value = ''
    }
  }

  const atualizarIndex = async () => {
    try {
      const imagesForIndex = imagens.map((i) => ({ name: i.name, ...(meta[i.name] || {}) }))
      const indexBlob = new Blob([JSON.stringify({ images: imagesForIndex }, null, 2)], { type: 'application/json' })
      await uploadObject(BUCKET, indexBlob, 'index.json')
    } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-4xl mx-auto p-6 pb-24">
        <button onClick={onVoltar} className="flex items-center gap-2 text-brand-700 hover:text-brand-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-brand-900 mb-2">Gerenciar Imagens da Landing</h1>
        <div className={`mb-4 text-sm ${sessaoOk ? 'text-green-700' : 'text-red-700'}`}>{sessaoOk ? 'Sessão Supabase: OK' : 'Sessão Supabase: ausente. Faça login para enviar.'}</div>
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{erro}</div>
        )}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <div className="px-4 py-2 rounded-lg bg-accent-100 text-accent-800 hover:bg-accent-200 inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Enviar Imagem
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={processando || !sessaoOk} />
            </label>
            <button onClick={atualizarIndex} className="px-4 py-2 rounded-lg bg-neutral-100 text-brand-900 hover:bg-neutral-200">Salvar</button>
            {processando && (
              <div className="flex items-center gap-3">
                <div className="w-40 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-brand-600" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-sm text-brand-700">{uploadProgress}%</div>
              </div>
            )}
          </div>
        </div>

        {carregando ? (
          <div className="text-center text-brand-700">Carregando imagens...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imagens.map((img) => (
              <div key={img.name} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <img src={img.url} alt={img.name} className="w-full h-32 object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem' }} />
                <div className="p-2 text-xs text-neutral-700 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-brand-600" />
                  {img.name}
                </div>
                <div className="p-3 border-t border-neutral-100 text-xs grid gap-2">
                  <input
                    value={meta[img.name]?.title || ''}
                    onChange={(e) => setMeta((m) => ({ ...m, [img.name]: { ...(m[img.name] || {}), title: e.target.value } }))}
                    placeholder="Título/Legenda"
                    className="px-2 py-1 border border-neutral-300 rounded"
                  />
                  <input
                    value={meta[img.name]?.credit || ''}
                    onChange={(e) => setMeta((m) => ({ ...m, [img.name]: { ...(m[img.name] || {}), credit: e.target.value } }))}
                    placeholder="Crédito da imagem"
                    className="px-2 py-1 border border-neutral-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={!!meta[img.name]?.featured}
                        onChange={(e) => setMeta((m) => ({ ...m, [img.name]: { ...(m[img.name] || {}), featured: e.target.checked } }))}
                      />
                      Destaque
                    </label>
                    <input
                      type="number"
                      value={meta[img.name]?.order || 0}
                      onChange={(e) => setMeta((m) => ({ ...m, [img.name]: { ...(m[img.name] || {}), order: Number(e.target.value || 0) } }))}
                      className="w-16 px-2 py-1 border border-neutral-300 rounded"
                      placeholder="Ordem"
                    />
                  </div>
                </div>
              </div>
            ))}
            {imagens.length === 0 && (
              <div className="text-neutral-700">Nenhuma imagem enviada ainda.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminImagens
