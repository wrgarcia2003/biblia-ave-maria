import React from 'react'
import { Church } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const NavBar = ({ onGoLanding, onGoBiblia, onGoCatequese, onGoOracoes, onGoSantos, onEntrar, onLogout, usuario }) => {
  return (
    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-neutral-900 dark:text-neutral-100">
        <button onClick={onGoLanding} className="flex items-center gap-2">
          <Church className="w-6 h-6 text-brand-700 dark:text-neutral-100" />
          <div className="font-bold text-brand-900 dark:text-neutral-100">Bíblia Ave Maria</div>
        </button>
        <div className="hidden md:flex items-center gap-4">
          <button onClick={onGoLanding} className="text-brand-800 dark:text-neutral-100 hover:text-brand-900">Início</button>
          <button onClick={onGoBiblia} className="text-brand-800 dark:text-neutral-100 hover:text-brand-900">Bíblia</button>
          <button onClick={onGoCatequese} className="text-brand-800 dark:text-neutral-100 hover:text-brand-900">Catequese</button>
          <button onClick={onGoOracoes} className="text-brand-800 dark:text-neutral-100 hover:text-brand-900">Orações</button>
          <button onClick={onGoSantos} className="text-brand-800 dark:text-neutral-100 hover:text-brand-900">Santos do Dia</button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {usuario?.email ? (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">Logado: {usuario.email}</span>
              <button onClick={onLogout} className="px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700">Sair</button>
            </div>
          ) : (
            <button onClick={onEntrar} className="px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700">Entrar</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NavBar
