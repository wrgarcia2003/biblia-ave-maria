import { supabaseClient } from '../lib/supabase'
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const publicUrl = (bucket, path) => `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

export const listObjects = async (bucket, prefix = '') => {
  const url = `${SUPABASE_URL}/storage/v1/object/list/${bucket}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix, limit: 100, offset: 0 }),
  })
  if (!res.ok) return []
  const arr = await res.json()
  return Array.isArray(arr) ? arr : []
}

export const uploadObject = async (bucket, file, path) => {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`
  const { data } = await supabaseClient.auth.getSession()
  const token = data?.session?.access_token || ''
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_KEY}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: file,
  })
  return res.ok
}

export const uploadObjectWithProgress = async (bucket, file, path, onProgress) => {
  const { data } = await supabaseClient.auth.getSession()
  const token = data?.session?.access_token || ''
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('apikey', SUPABASE_KEY)
    xhr.setRequestHeader('Authorization', token ? `Bearer ${token}` : `Bearer ${SUPABASE_KEY}`)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    }
    xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status })
    xhr.onerror = () => resolve({ ok: false, status: xhr.status })
    xhr.send(file)
  })
}
