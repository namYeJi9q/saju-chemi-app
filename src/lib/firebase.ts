import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

/**
 * Firebase 연결.
 * 설정값은 .env.local(개발)과 Vercel 환경 변수(배포)에서만 읽는다. 저장소에는 올리지 않는다.
 * 이 파일은 공유 관계도 화면에서만 불러온다(혼자 쓰기 화면은 Firebase를 쓰지 않음).
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(config).every((v) => typeof v === 'string' && v.length > 0)

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfigured) throw new Error('Firebase 설정값이 없어요')
  app ??= initializeApp(config)
  return app
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp())
}
