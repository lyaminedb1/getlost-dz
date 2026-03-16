const BASE = '/api'

export async function api(path, opts = {}) {
  const token = localStorage.getItem('glz_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(opts.method && { method: opts.method }),
    ...(opts.body && { body: JSON.stringify(opts.body) }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}
