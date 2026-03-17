// Validation utilities

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(email)
}

export const validatePassword = (password) => {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score, valid: score === 3 }
}

export const validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8
}

export const PasswordStrengthBar = ({ password }) => {
  if (!password) return null
  const { checks, score } = validatePassword(password)
  const colors = ['#EF4444', '#F59E0B', '#10B981']
  const labels = ['Faible', 'Moyen', 'Fort']
  const color = colors[score - 1] || '#E2E8F0'
  const label = labels[score - 1] || ''
  return (
    <div style={{ marginTop: -8, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= score ? color : '#E2E8F0',
            transition: 'background .3s'
          }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            [checks.length,    '8+ caractères'],
            [checks.uppercase, '1 majuscule'],
            [checks.number,    '1 chiffre'],
          ].map(([ok, txt]) => (
            <span key={txt} style={{ color: ok ? '#10B981' : '#94A3B8', fontWeight: 600 }}>
              {ok ? '✓' : '○'} {txt}
            </span>
          ))}
        </div>
        {label && <span style={{ color, fontWeight: 700 }}>{label}</span>}
      </div>
    </div>
  )
}
