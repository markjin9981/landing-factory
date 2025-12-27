import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // --------------------------------------------------------------------------
  // [매우 중요] GitHub Pages 배포 설정입니다.
  // --------------------------------------------------------------------------
  // 아래 '/landing-page-factory/' 부분에서 'landing-page-factory'를
  // 고객님의 실제 GitHub 저장소(Repository) 이름으로 반드시 변경해주세요.
  //
  // 예시: GitHub 저장소 이름이 'my-landing-page' 라면
  // base: '/my-landing-page/',
  // --------------------------------------------------------------------------
  base: '/landing-factory/', 
})
