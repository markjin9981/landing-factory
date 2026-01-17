import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 성능 최적화: 빌드 설정
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 핵심 React 라이브러리 분리
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          // 차트 라이브러리 분리 (Admin 페이지에서만 사용)
          'charts': ['recharts'],
          // 애니메이션 라이브러리 분리 (DynamicStep, Rehab에서만 사용)
          'animation': ['framer-motion'],
        }
      }
    },
    // 청크 사이즈 경고 조정
    chunkSizeWarningLimit: 500,
  },

  // --------------------------------------------------------------------------
  // [매우 중요] GitHub Pages 배포 설정입니다.
  // --------------------------------------------------------------------------
  // 아래 '/landing-page-factory/' 부분에서 'landing-page-factory'를
  // 고객님의 실제 GitHub 저장소(Repository) 이름으로 반드시 변경해주세요.
  //
  // 예시: GitHub 저장소 이름이 'my-landing-page' 라면
  // base: '/my-landing-page/',
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  base: '/',
})
