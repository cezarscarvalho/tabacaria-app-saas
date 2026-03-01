import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remova qualquer linha que tenha "root: 'utils'" ou algo parecido aqui!
})s