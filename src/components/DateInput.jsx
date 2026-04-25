import { useState, useEffect } from 'react'

// Converts ISO yyyy-mm-dd → dd/mm/yyyy for display
function isoToDisplay(iso) {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.split('-')
  return d && m && y ? `${d}/${m}/${y}` : ''
}

// Accepts dd/mm/yyyy or ddmmyyyy (8 digits) → ISO yyyy-mm-dd
function parseToIso(str) {
  if (!str) return ''
  const trimmed = str.trim()
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, d, m, y] = slashMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
  }
  return ''
}

export default function DateInput({ value = '', onChange, style, ...rest }) {
  const [display, setDisplay] = useState(() => isoToDisplay(value))

  // Sync when parent resets the value (e.g. form clear)
  useEffect(() => {
    setDisplay(isoToDisplay(value))
  }, [value])

  function handleChange(e) {
    setDisplay(e.target.value)
  }

  function handleBlur() {
    const iso = parseToIso(display)
    if (iso) {
      setDisplay(isoToDisplay(iso))
      onChange({ target: { value: iso } })
    } else if (!display.trim()) {
      setDisplay('')
      onChange({ target: { value: '' } })
    }
    // If unparseable non-empty input, leave display as-is so user can correct it
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="jj/mm/aaaa"
      maxLength={10}
      style={style}
    />
  )
}
