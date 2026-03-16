const _sid = sessionStorage.getItem('glz_sid') || (() => {
  const id = Math.random().toString(36).slice(2)
  sessionStorage.setItem('glz_sid', id)
  return id
})()

export function track(type, extra = {}) {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      session_id: _sid,
      lang: localStorage.getItem('glz_lang') || 'fr',
      ...extra,
    }),
  }).catch(() => {})
}
