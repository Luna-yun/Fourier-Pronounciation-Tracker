import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PronunciationChecker from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PronunciationChecker />
  </StrictMode>,
)
