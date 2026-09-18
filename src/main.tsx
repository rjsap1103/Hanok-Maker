import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { useBuildStore, useUIStore, useCameraStore, useRoofStore } from './store'

// 초보자 친화적 디버깅 및 시각적 검증을 위해 window 객체에 전역 스토어 노출
if (typeof window !== 'undefined') {
  (window as any).useBuildStore = useBuildStore;
  (window as any).useUIStore = useUIStore;
  (window as any).useCameraStore = useCameraStore;
  (window as any).useRoofStore = useRoofStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

