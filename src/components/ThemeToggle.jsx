import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'imgconv.theme.v1'

function getInitialTheme() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (saved === 'light' || saved === 'dark') return saved

  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  return prefersDark ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  const nextTheme = useMemo(() => (theme === 'dark' ? 'light' : 'dark'), [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      Theme: {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
