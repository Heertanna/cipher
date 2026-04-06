import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

function routerBasename() {
  const base = import.meta.env.BASE_URL
  if (import.meta.env.DEV) return '/'
  if (typeof base === 'string' && base.startsWith('/') && base.length > 1) {
    return base.replace(/\/$/, '')
  }
  // Production build uses base: './' — infer /{repo}/ for GitHub Pages project sites
  const seg = window.location.pathname.split('/').filter(Boolean)[0]
  return seg ? `/${seg}` : '/'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
