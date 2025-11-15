import React, { useEffect, useState } from 'react'

const Carousel = ({ images = [], interval = 4000 }) => {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (!images || images.length === 0) return
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images, interval])
  const current = images[idx]
  if (!current) return null
  const onErr = (e) => {
    const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-size="48">Imagem</text></svg>')
    e.currentTarget.src = `data:image/svg+xml;charset=UTF-8,${svg}`
  }
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200">
      <img src={current?.src} alt={current?.title || ''} className="w-full h-[360px] object-cover" referrerPolicy="no-referrer" onError={onErr} />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent" />
      <div className="absolute bottom-3 left-4 text-white drop-shadow">
        {current?.title ? (<div className="font-semibold">{current.title}</div>) : null}
        {current?.credit ? (<div className="text-xs">{current.credit}</div>) : null}
      </div>
      <div className="absolute right-3 bottom-3 flex gap-1">
        {images.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}

export default Carousel
