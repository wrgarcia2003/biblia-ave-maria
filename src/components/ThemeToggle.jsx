import React, { useEffect, useState } from 'react'

const ThemeToggle = () => {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('theme:dark') === 'true'
    setDark(saved)
    document.documentElement.classList.toggle('dark', saved)
  }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('theme:dark', String(next))
    document.documentElement.classList.toggle('dark', next)
  }
  return (
    <button
      onClick={toggle}
      className={`px-3 py-2 rounded-lg text-sm ${dark ? 'bg-neutral-800 text-neutral-100' : 'bg-neutral-100 text-neutral-800'}`}
      title={dark ? 'Tema escuro' : 'Tema claro'}
    >
      {dark ? '🌙' : '☀️'}
    </button>
  )
}

export default ThemeToggle

