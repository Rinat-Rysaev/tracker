import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Block pinch-to-zoom on iOS (Safari ignores user-scalable=no since iOS 10)
document.addEventListener('touchmove', (e: TouchEvent) => {
  if (e.touches.length > 1) e.preventDefault()
}, { passive: false })
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import './index.css'
import App from './App.tsx'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
)
