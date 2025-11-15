import React, { useEffect, useState } from 'react'

const Carousel = ({ images = [], interval = 4000 }) => {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (!images || images.length === 0) return
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images, interval])
  const current = images[idx]
  const onErr = (e) => {
    e.currentTarget.src = 'https://via.placeholder.com/1600x900?text=Imagem'
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
