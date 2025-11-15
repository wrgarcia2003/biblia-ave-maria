const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

const supabaseCall = async (endpoint, options = {}) => {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) return []
  return response.json()
}

export const listarSantos = async ({ limit = 30 } = {}) => {
  return supabaseCall(`santos_dia?select=*&order=data.desc&limit=${limit}`)
}

export const salvarSanto = async (payload) => {
  const url = `${SUPABASE_URL}/rest/v1/santos_dia`
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json && json[0] ? json[0] : null
}

