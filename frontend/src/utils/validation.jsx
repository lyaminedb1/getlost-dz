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
  // Strip all non-digit/+ chars for analysis
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')

  // Patterns per country code (digits after country code)
  const patterns = {
    '+213': /^\+213\s?[567]\d{8}$/,       // Algeria: 05/06/07 + 8 digits
    '+33':  /^\+33\s?[1-9]\d{8}$/,         // France: 9 digits after +33
    '+212': /^\+212\s?[5-7]\d{8}$/,        // Morocco: 5/6/7 + 8 digits
    '+216': /^\+216\s?[2-9]\d{7}$/,        // Tunisia: 8 digits
    '+44':  /^\+44\s?[1-9]\d{9,10}$/,      // UK: 10-11 digits
    '+49':  /^\+49\s?[1-9]\d{8,11}$/,      // Germany: 9-12 digits
    '+34':  /^\+34\s?[6-9]\d{8}$/,         // Spain: 9 digits
    '+39':  /^\+39\s?[0-9]\d{8,10}$/,      // Italy: 9-11 digits
    '+90':  /^\+90\s?[5]\d{9}$/,           // Turkey: 5 + 9 digits
    '+966': /^\+966\s?[5]\d{8}$/,          // Saudi: 5 + 8 digits
    '+971': /^\+971\s?[2-9]\d{7,8}$/,      // UAE: 8-9 digits
    '+1':   /^\+1\s?[2-9]\d{9}$/,          // US/Canada: 10 digits
    '+86':  /^\+86\s?1[3-9]\d{9}$/,        // China: 1 + 10 digits
    '+91':  /^\+91\s?[6-9]\d{9}$/,         // India: 10 digits
    '+7':   /^\+7\s?[0-9]\d{9}$/,          // Russia: 10 digits
    '+55':  /^\+55\s?[1-9]\d{9,10}$/,      // Brazil: 10-11 digits
    '+20':  /^\+20\s?[1-9]\d{8,9}$/,       // Egypt: 9-10 digits
    '+218': /^\+218\s?[9]\d{8}$/,          // Libya: 9 + 8 digits
    '+222': /^\+222\s?[2-9]\d{7}$/,        // Mauritania: 8 digits
    '+223': /^\+223\s?[2-9]\d{7}$/,        // Mali: 8 digits
  }

  // Find matching pattern
  for (const [code, regex] of Object.entries(patterns)) {
    if (cleaned.startsWith(code)) {
      return { valid: regex.test(cleaned), code }
    }
  }

  // Fallback: at least 8 digits
  const digits = phone.replace(/\D/g, '')
  return { valid: digits.length >= 8, code: null }
}

// Simple boolean version for backward compat
export const isPhoneValid = (phone) => validatePhone(phone).valid

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
