import React from 'react'
import { ArrowLeft, Play } from 'lucide-react'

const toEmbedUrl = (url) => {
  if (!url) return ''
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const parts = u.pathname.split('/')
      const last = parts[parts.length - 1]
      if (u.pathname.includes('/embed/')) return url
      return last ? `https://www.youtube.com/embed/${last}` : ''
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '')
      return `https://www.youtube.com/embed/${id}`
    }
    return url
  } catch { return url }
}

const SantosDetail = ({ item, onVoltar }) => {
  if (!item) return null
  const embed = toEmbedUrl(item.video_url)
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Play className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl font-bold text-brand-900">{item.titulo || item.santo_nome || 'Santo do Dia'}</h1>
          </div>
          <button onClick={onVoltar} className="flex items-center gap-2 px-4 py-2 bg-accent-100 text-accent-800 rounded-lg hover:bg-accent-200">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
        <div className="mb-4 text-sm text-neutral-600">{item.data}</div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 mb-6">
          {embed && (
            <div className="aspect-video">
              <iframe
                title="Santo do Dia"
                width="100%"
                height="100%"
                src={embed}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
        {item.historia_md && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 whitespace-pre-line text-neutral-800">
            {item.historia_md}
          </div>
        )}
      </div>
    </div>
  )
}

export default SantosDetail

