import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 성능 최적화: 빌드 설정
  build: {
    // Minification 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 핵심 React 라이브러리 분리
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          // 차트 라이브러리 분리 (Admin 페이지에서만 사용)
          'charts': ['recharts'],
          // 애니메이션 라이브러리 분리 (DynamicStep, Rehab에서만 사용)
          'animation': ['framer-motion'],
          // Supabase 분리 (인증/DB 기능)
          'supabase': ['@supabase/supabase-js'],
          // 엑셀 라이브러리 분리 (내보내기 시에만 사용)
          'xlsx': ['xlsx'],
        }
      }
    },
    // 청크 사이즈 경고 조정
    chunkSizeWarningLimit: 500,
    // 소스맵 비활성화 (프로덕션 빌드 크기 감소)
    sourcemap: false,
  },

  // 개발 서버 최적화
  server: {
    // HMR 최적화
    hmr: {
      overlay: false,
    },
  },

  // 의존성 최적화
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },

  // --------------------------------------------------------------------------
  // [매우 중요] GitHub Pages 배포 설정입니다.
  // --------------------------------------------------------------------------
  base: '/',
})
