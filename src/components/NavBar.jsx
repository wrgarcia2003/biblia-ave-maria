import React from 'react'
import { Church } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const NavBar = ({ onGoBiblia, onGoCatequese, onGoOracoes, onGoSantos, onEntrar }) => {
  return (
    <div className="bg-white/90 backdrop-blur border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <button onClick={onGoBiblia} className="flex items-center gap-2">
          <Church className="w-6 h-6 text-brand-700" />
          <div className="font-bold text-brand-900">Bíblia Ave Maria</div>
        </button>
        <div className="hidden md:flex items-center gap-4">
          <button onClick={onGoBiblia} className="text-brand-800 hover:text-brand-900">Bíblia</button>
          <button onClick={onGoCatequese} className="text-brand-800 hover:text-brand-900">Catequese</button>
          <button onClick={onGoOracoes} className="text-brand-800 hover:text-brand-900">Orações</button>
          <button onClick={onGoSantos} className="text-brand-800 hover:text-brand-900">Santos do Dia</button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={onEntrar} className="px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700">Entrar</button>
        </div>
      </div>
    </div>
  )
}

export default NavBar

