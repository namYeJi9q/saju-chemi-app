import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const PRODUCTION_URL = 'https://saju-chemi-app.vercel.app'

/**
 * 링크 미리보기(og:image)는 전체 주소가 필요하다.
 * Vercel이 빌드할 때 알려 주는 배포 주소를 넣고, 로컬에서는 실제 사이트 주소를 쓴다.
 *   - 실제 사이트(production): VERCEL_PROJECT_PRODUCTION_URL
 *   - 미리보기(preview): VERCEL_URL (그 배포만의 주소)
 */
function siteUrl(): string {
  const env = process.env
  if (env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return PRODUCTION_URL
}

function injectSiteUrl(): Plugin {
  return {
    name: 'inject-site-url',
    // Vite가 meta 태그의 주소를 손대기 전에(pre) 바꿔야 앞에 '/'가 붙지 않는다
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('__SITE_URL__', siteUrl()),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectSiteUrl()],
})
