import React from 'react'
import { Book, BookOpen, Heart, Calendar } from 'lucide-react'

const BottomNav = ({ onGoBiblia, onGoPlanos, onGoCatequese, onGoOracoes, onGoSantos }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="max-w-4xl mx-auto p-2 grid grid-cols-5 gap-2">
        <button onClick={onGoBiblia} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-brand-800 dark:text-neutral-100">
          <Book className="w-5 h-5 mx-auto" />
          <div className="text-xs">Bíblia</div>
        </button>
        <button onClick={onGoPlanos} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-brand-800 dark:text-neutral-100">
          <BookOpen className="w-5 h-5 mx-auto" />
          <div className="text-xs">Planos</div>
        </button>
        <button onClick={onGoCatequese} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-brand-800 dark:text-neutral-100">
          <BookOpen className="w-5 h-5 mx-auto" />
          <div className="text-xs">Catequese</div>
        </button>
        <button onClick={onGoOracoes} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-brand-800 dark:text-neutral-100">
          <Heart className="w-5 h-5 mx-auto" />
          <div className="text-xs">Orações</div>
        </button>
        <button onClick={onGoSantos} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-brand-800 dark:text-neutral-100">
          <Calendar className="w-5 h-5 mx-auto" />
          <div className="text-xs">Santos</div>
        </button>
      </div>
    </div>
  )
}

export default BottomNav
