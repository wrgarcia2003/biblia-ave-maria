const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

const supabaseCall = async (endpoint, options = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (!response.ok) return []
  return response.json()
}

export const listarCategorias = async () => {
  return supabaseCall('temas_catequese?select=*&order=nome')
}

export const listarCatequeses = async ({ categoria = null, q = '', limit = 20, offset = 0 } = {}) => {
  let query = `catequeses?select=id,titulo,categoria,autor,fonte,created_at&order=created_at.desc&limit=${limit}&offset=${offset}`
  if (categoria) query += `&categoria=eq.${encodeURIComponent(categoria)}`
  if (q) query += `&titulo=ilike.%25${encodeURIComponent(q)}%25`
  return supabaseCall(query)
}

export const obterCatequese = async (id) => {
  const res = await supabaseCall(`catequeses?select=*&id=eq.${id}&limit=1`)
  return res && res[0] ? res[0] : null
}

export const listarSegmentos = async (catequeseId) => {
  return supabaseCall(`catequese_segmentos?select=*&catequese_id=eq.${catequeseId}&order=numero`)
}

export const deletarSegmentos = async (catequeseId) => {
  const url = `${SUPABASE_URL}/rest/v1/catequese_segmentos?catequese_id=eq.${catequeseId}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  return res.ok
}

export const inserirSegmentos = async (segmentos) => {
  const url = `${SUPABASE_URL}/rest/v1/catequese_segmentos`
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(segmentos),
  })
  if (!res.ok) return []
  return res.json()
}

export const atualizarTimestamp = async (id, inicio, fim) => {
  const url = `${SUPABASE_URL}/rest/v1/catequese_segmentos?id=eq.${id}`
  await fetch(url, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ tempo_inicio: inicio, tempo_fim: fim }),
  })
  return true
}
