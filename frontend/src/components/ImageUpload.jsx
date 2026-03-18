import { useState, useRef } from 'react'
import { api } from '../api'
import { useToast } from '../context/ToastContext'

/**
 * ImageUpload — upload images via Cloudinary.
 *
 * Props:
 *   value       — single URL string or array of URLs
 *   onChange    — called with URL string (single) or array (multi)
 *   type        — 'avatar' | 'logo' | 'offer' | 'review'
 *   multiple    — allow multi upload (default false)
 *   maxFiles    — max files for multi (default 6)
 *   shape       — 'circle' | 'square' | 'wide' (affects preview)
 *   size        — pixel size for preview (default 100)
 *   label       — label text
 */
export default function ImageUpload({
  value = '', onChange, type = 'offer', multiple = false, maxFiles = 6,
  shape = 'square', size = 100, label = ''
}) {
  const { show } = useToast()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const urls = multiple ? (Array.isArray(value) ? value : value ? [value] : []) : []
  const singleUrl = !multiple ? (value || '') : ''

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      show('Format image uniquement', 'err')
      return null
    }
    const maxSize = { avatar: 2, logo: 2, offer: 5, review: 3 }[type] || 5
    if (file.size > maxSize * 1_000_000) {
      show(`Image trop grande (max ${maxSize}MB)`, 'err')
      return null
    }
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = await api('/upload', {
            method: 'POST',
            body: { image: e.target.result, type }
          })
          resolve(data.url)
        } catch (err) {
          show(err.message || 'Erreur upload', 'err')
          resolve(null)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files) => {
    if (!files.length) return
    setUploading(true)

    if (multiple) {
      const remaining = maxFiles - urls.length
      const toUpload = Array.from(files).slice(0, remaining)
      const results = []
      for (const f of toUpload) {
        const url = await uploadFile(f)
        if (url) results.push(url)
      }
      if (results.length) {
        onChange([...urls, ...results])
      }
    } else {
      const url = await uploadFile(files[0])
      if (url) onChange(url)
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (idx) => {
    if (multiple) {
      onChange(urls.filter((_, i) => i !== idx))
    } else {
      onChange('')
    }
  }

  const previewRadius = shape === 'circle' ? '50%' : shape === 'wide' ? 12 : 12
  const previewW = shape === 'wide' ? size * 1.5 : size
  const previewH = size

  // Single image mode
  if (!multiple) {
    return (
      <div>
        {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            width: previewW, height: previewH, borderRadius: previewRadius,
            border: dragOver ? '2px dashed var(--teal)' : '2px dashed #DDE5E8',
            background: dragOver ? 'var(--teal3)' : '#FAFCFC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', position: 'relative',
            transition: 'all .2s'
          }}
        >
          {uploading ? (
            <div style={{ fontSize: 12, color: 'var(--teal2)', fontWeight: 700 }}>Upload…</div>
          ) : singleUrl ? (
            <>
              <img src={singleUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity .2s'
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>📷 Changer</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 8 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Cliquer ou glisser</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)} />
      </div>
    )
  }

  // Multi image mode
  return (
    <div>
      {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {urls.map((url, i) => (
          <div key={i} style={{
            width: 110, height: 80, borderRadius: 10, overflow: 'hidden',
            position: 'relative', border: '1px solid #EEF3F5'
          }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => removeImage(i)} style={{
              position: 'absolute', top: 4, right: 4, width: 22, height: 22,
              borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff',
              border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', lineHeight: 1
            }}>×</button>
            {i === 0 && <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(13,185,168,.85)',
              fontSize: 9, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '2px 0'
            }}>COVER</div>}
          </div>
        ))}
        {urls.length < maxFiles && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              width: 110, height: 80, borderRadius: 10,
              border: dragOver ? '2px dashed var(--teal)' : '2px dashed #DDE5E8',
              background: dragOver ? 'var(--teal3)' : '#FAFCFC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .2s'
            }}
          >
            {uploading ? (
              <div style={{ fontSize: 11, color: 'var(--teal2)', fontWeight: 700 }}>Upload…</div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20 }}>+</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{urls.length}/{maxFiles}</div>
              </div>
            )}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}
