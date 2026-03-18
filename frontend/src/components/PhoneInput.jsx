import { useState } from 'react'
import COUNTRY_CODES from '../utils/countryCodes'
import { validatePhone } from '../utils/validation.jsx'

/**
 * PhoneInput — phone number field with country code dropdown + validation.
 *
 * Props:
 *   value       — full phone string (e.g. "+213 0770123456")
 *   onChange    — called with full string "{code} {number}"
 *   dark        — if true, use dark theme (for OfferModal booking bar)
 *   style       — extra style on the outer wrapper
 *   placeholder — placeholder for the number part
 *   showHint    — show validation hint below (default true)
 */
export default function PhoneInput({ value = '', onChange, dark = false, style = {}, placeholder = '770 123 456', showHint = true }) {
  const parseValue = (v) => {
    for (const cc of COUNTRY_CODES) {
      if (v.startsWith(cc.code + ' ') || v.startsWith(cc.code)) {
        return { code: cc.code, number: v.slice(cc.code.length).trim() }
      }
    }
    return { code: '+213', number: v }
  }

  const { code: initCode, number: initNumber } = parseValue(value)
  const [code, setCode] = useState(initCode)
  const [number, setNumber] = useState(initNumber)
  const [touched, setTouched] = useState(false)

  const fullValue = `${code} ${number}`.trim()
  const { valid } = validatePhone(fullValue)
  const showError = touched && number.length > 0 && !valid
  const showOk = touched && number.length > 0 && valid

  const emit = (c, n) => {
    onChange(`${c} ${n}`.trim())
  }

  const handleCodeChange = (e) => {
    setCode(e.target.value)
    emit(e.target.value, number)
  }

  const handleNumberChange = (e) => {
    setNumber(e.target.value)
    emit(code, e.target.value)
    if (!touched) setTouched(true)
  }

  const baseBg = dark ? 'rgba(255,255,255,.12)' : '#fff'
  const baseBorder = dark
    ? `1.5px solid ${showError ? '#EF4444' : showOk ? '#10B981' : 'rgba(255,255,255,.25)'}`
    : `1.5px solid ${showError ? '#EF4444' : showOk ? '#10B981' : '#E2EBF0'}`
  const baseColor = dark ? '#fff' : 'var(--text)'

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, ...style }}>
        <select
          value={code}
          onChange={handleCodeChange}
          style={{
            background: baseBg,
            border: baseBorder,
            borderRight: 'none',
            borderRadius: '10px 0 0 10px',
            padding: '11px 8px 11px 12px',
            fontSize: 13,
            fontWeight: 600,
            color: baseColor,
            cursor: 'pointer',
            minWidth: 95,
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${dark ? '%23ffffff' : '%23999'}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: 24,
          }}
        >
          {COUNTRY_CODES.map(cc => (
            <option key={cc.code} value={cc.code}>
              {cc.flag} {cc.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: baseBg,
            border: baseBorder,
            borderLeft: 'none',
            borderRadius: '0 10px 10px 0',
            padding: '11px 14px',
            fontSize: 14,
            color: baseColor,
          }}
        />
        {showOk && <span style={{ position: 'relative', right: 30, top: 12, fontSize: 14 }}>✅</span>}
        {showError && <span style={{ position: 'relative', right: 30, top: 12, fontSize: 14 }}>❌</span>}
      </div>
      {showHint && showError && (
        <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>
          ⚠ Numéro invalide pour {COUNTRY_CODES.find(c=>c.code===code)?.label || code}
        </div>
      )}
    </div>
  )
}
