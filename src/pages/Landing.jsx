import React, { useEffect, useState } from 'react'
import { Book, Headphones, Calendar, Heart } from 'lucide-react'
import NavBar from '../components/NavBar'
import Carousel from '../components/Carousel'
import { publicUrl } from '../services/storageService'

const BUCKET = 'landing-images'

const Landing = ({ onEntrar, onGoBiblia, onGoCatequese, onGoOracoes, onGoSantos }) => {
  const [images, setImages] = useState([])
  useEffect(() => {
    (async () => {
      try {
        const url = publicUrl(BUCKET, 'index.json')
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          const names = Array.isArray(data.images) ? data.images : []
          const imgs = names.map(n => (
            typeof n === 'string'
              ? { src: publicUrl(BUCKET, n), title: '' }
              : { src: publicUrl(BUCKET, n.name), title: n.title || '', credit: n.credit || '', featured: !!n.featured, order: Number(n.order || 0) }
          ))
          setImages(imgs)
          return
        }
      } catch (_) {}
      setImages([])
    })()
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <NavBar
        onGoBiblia={onGoBiblia}
        onGoCatequese={onGoCatequese}
        onGoOracoes={onGoOracoes}
        onGoSantos={onGoSantos}
        onEntrar={onEntrar}
      />

      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-brand-900 leading-tight">Leitura Católica com Áudio, Catequese e Santos do Dia</h1>
          <p className="mt-4 text-neutral-700 text-lg">A Bíblia Ave Maria com player sincronizado, conteúdos de catequese e uma seleção de orações — tudo em um só lugar, com visual moderno e agradável.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onEntrar} className="px-5 py-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700">Começar Agora</button>
            <button onClick={onGoBiblia} className="px-5 py-3 rounded-lg bg-brand-100 text-brand-800 hover:bg-brand-200">Bíblia</button>
            <button onClick={onGoSantos} className="px-5 py-3 rounded-lg bg-accent-100 text-accent-800 hover:bg-accent-200">Santos do Dia</button>
            <button onClick={onGoCatequese} className="px-5 py-3 rounded-lg bg-neutral-100 text-brand-900 hover:bg-neutral-200">Catequese</button>
          </div>
        </div>
        <div className="relative">
          {images.length > 0 ? (
            <Carousel images={[...images].sort((a, b) => {
              const fa = a.featured ? 0 : 1
              const fb = b.featured ? 0 : 1
              if (fa !== fb) return fa - fb
              return (a.order || 0) - (b.order || 0)
            })} interval={5000} />
          ) : (
            <div className="rounded-2xl border border-neutral-200 h-[360px] bg-neutral-100" />
          )}
          <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-neutral-100 hidden md:flex items-center gap-3">
            <Headphones className="w-6 h-6 text-brand-600" />
            <div>
              <div className="font-semibold text-brand-900">Áudio sincronizado</div>
              <div className="text-sm text-neutral-600">Leitura com destaque automático do texto</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.length > 0 ? (
          [...images].sort((a, b) => {
            const fa = a.featured ? 0 : 1
            const fb = b.featured ? 0 : 1
            if (fa !== fb) return fa - fb
            return (a.order || 0) - (b.order || 0)
          }).map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl shadow-sm border border-neutral-100">
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/50 to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white drop-shadow">
                {img.title && (<div className="font-medium">{img.title}</div>)}
                {img.credit && (<div className="text-xs">{img.credit}</div>)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-neutral-700">Nenhuma imagem enviada ainda.</div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-900 mb-6">Como funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="text-sm font-semibold text-brand-600">1. Escolha</div>
            <div className="mt-2 text-brand-900 font-semibold">Livro, Catequese ou Oração</div>
            <div className="mt-1 text-neutral-700">Selecione o conteúdo desejado pela navegação ou pela Home.</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="text-sm font-semibold text-brand-600">2. Ouça e leia</div>
            <div className="mt-2 text-brand-900 font-semibold">Player com sincronia</div>
            <div className="mt-1 text-neutral-700">O texto acompanha o áudio com destaque automático.</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="text-sm font-semibold text-brand-600">3. Aprofunde</div>
            <div className="mt-2 text-brand-900 font-semibold">Planos e Santos do Dia</div>
            <div className="mt-1 text-neutral-700">Organize sua leitura e veja o vídeo e história dos santos.</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-900 mb-6">Depoimentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="text-neutral-800">“A sincronia do texto com o áudio me ajuda muito na meditação.”</div>
            <div className="mt-3 text-sm text-neutral-600">Maria, catequista</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="text-neutral-800">“Gostei das orações com áudio e dos planos de leitura diários.”</div>
            <div className="mt-3 text-sm text-neutral-600">João, leitor</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="text-neutral-800">“Os Santos do Dia com vídeo e história são um destaque.”</div>
            <div className="mt-3 text-sm text-neutral-600">Ana, jovem</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <Book className="w-7 h-7 text-brand-600" />
          <div className="mt-3 font-semibold text-brand-900">Bíblia com Áudio</div>
          <div className="mt-1 text-neutral-700">Leitura com player e sincronia por versículo.</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <Headphones className="w-7 h-7 text-brand-600" />
          <div className="mt-3 font-semibold text-brand-900">Catequese</div>
          <div className="mt-1 text-neutral-700">Aulas com áudio e texto sincronizado.</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <Heart className="w-7 h-7 text-brand-600" />
          <div className="mt-3 font-semibold text-brand-900">Orações</div>
          <div className="mt-1 text-neutral-700">Seleção de orações com áudio e texto.</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
          <Calendar className="w-7 h-7 text-brand-600" />
          <div className="mt-3 font-semibold text-brand-900">Santos do Dia</div>
          <div className="mt-1 text-neutral-700">Vídeo do YouTube e história escrita.</div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-900 mb-6">Recursos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="font-semibold text-brand-900 mb-2">Design moderno</div>
            <div className="text-neutral-700">Tema claro/escuro, tipografia legível e cores harmonizadas.</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="font-semibold text-brand-900 mb-2">Performance</div>
            <div className="text-neutral-700">Carregamento inteligente e navegação rápida.</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
            <div className="font-semibold text-brand-900 mb-2">Acessibilidade</div>
            <div className="text-neutral-700">Contraste, foco visível e controles acessíveis.</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-900 mb-6">Contato</h2>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <div className="text-neutral-700">Quer colaborar ou enviar sugestões? Entre em contato e participe.</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="https://wa.me/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-neutral-100 text-brand-900 hover:bg-neutral-200">WhatsApp</a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-neutral-100 text-brand-900 hover:bg-neutral-200">Instagram</a>
            <a href="https://youtube.com/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-neutral-100 text-brand-900 hover:bg-neutral-200">YouTube</a>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="text-xl font-semibold">Pronto para começar sua jornada?</div>
          <div className="flex gap-3">
            <button onClick={onEntrar} className="px-5 py-3 rounded-lg bg-white text-brand-800 hover:bg-neutral-100">Entrar</button>
            <button onClick={onGoOracoes} className="px-5 py-3 rounded-lg bg-accent-500 hover:bg-accent-600">Explorar Orações</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
