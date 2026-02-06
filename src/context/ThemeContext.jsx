import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('subtrackr-theme')
    if (savedTheme) {
      return savedTheme
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }

    return 'dark'
  }

  const [theme, setTheme] = useState(getInitialTheme)

  // Update theme in localStorage and DOM
  useEffect(() => {
    // Update root element class
    const root = document.documentElement

    // Remove both classes first to ensure clean state
    root.classList.remove('light', 'dark')

    // Add the current theme class
    root.classList.add(theme)

    // Save to localStorage
    localStorage.setItem('subtrackr-theme', theme)
  }, [theme])

  // Force initial theme application on mount
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
