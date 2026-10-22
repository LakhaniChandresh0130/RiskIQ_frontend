import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './styles/global.css'
createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
