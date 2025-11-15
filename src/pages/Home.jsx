import React from 'react'
import { Book, BookOpen, Heart, Target, Calendar } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import NavBar from '../components/NavBar'

const Home = ({ onGoBiblia, onGoPlanos, onGoCatequese, onGoOracoes, onGoSantos }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-50">
      <NavBar
        onGoBiblia={onGoBiblia}
        onGoCatequese={onGoCatequese}
        onGoOracoes={onGoOracoes}
        onGoSantos={onGoSantos}
        onEntrar={onGoBiblia}
      />
      <div className="max-w-4xl mx-auto p-6 pb-24">
        <h1 className="text-3xl font-bold text-brand-900 mb-6">Início</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button onClick={onGoBiblia} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md text-left">
            <Book className="w-8 h-8 text-brand-600 mb-3" />
            <div className="font-semibold text-brand-900">Bíblia</div>
            <div className="text-sm text-neutral-600">Ler e ouvir capítulos</div>
          </button>

          <button onClick={onGoPlanos} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md text-left">
            <Target className="w-8 h-8 text-accent-600 mb-3" />
            <div className="font-semibold text-brand-900">Planos</div>
            <div className="text-sm text-neutral-600">Organize sua leitura</div>
          </button>

          <button onClick={onGoCatequese} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md text-left">
            <BookOpen className="w-8 h-8 text-brand-600 mb-3" />
            <div className="font-semibold text-brand-900">Catequese</div>
            <div className="text-sm text-neutral-600">Doutrina e formação</div>
          </button>

          <button onClick={onGoOracoes} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md text-left">
            <Heart className="w-8 h-8 text-brand-600 mb-3" />
            <div className="font-semibold text-brand-900">Orações</div>
            <div className="text-sm text-neutral-600">Textos devocionais</div>
          </button>

          <button onClick={onGoSantos} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md text-left">
            <Calendar className="w-8 h-8 text-brand-600 mb-3" />
            <div className="font-semibold text-brand-900">Santos do Dia</div>
            <div className="text-sm text-neutral-600">Vídeo e história</div>
          </button>
        </div>

        <BottomNav
          onGoBiblia={onGoBiblia}
          onGoPlanos={onGoPlanos}
          onGoCatequese={onGoCatequese}
          onGoOracoes={onGoOracoes}
          onGoSantos={onGoSantos}
        />
      </div>
    </div>
  )
}

export default Home
