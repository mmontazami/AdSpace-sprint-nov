import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { reportedQuestionsApiPlugin } from './server/viteReportedQuestionsPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), reportedQuestionsApiPlugin()],
})
