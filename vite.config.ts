import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const screenshotPlugin = () => ({
  name: 'save-screenshot-middleware',
  configureServer(server: any) {
    server.middlewares.use('/api/save-screenshot', (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const { filename, image } = JSON.parse(body)
            const base64Data = image.replace(/^data:image\/png;base64,/, '')
            const targetDir = 'C:/Users/mbc/.gemini/antigravity-ide/brain/cf0c4694-a610-461e-ab1d-cb904d1a9346'
            fs.writeFileSync(path.join(targetDir, filename), base64Data, 'base64')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
          } catch (err: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      } else {
        res.statusCode = 404
        res.end()
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), screenshotPlugin()],
})

