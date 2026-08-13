import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(rootDir, '..', 'frontend')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function arquivoSeguro(raiz: string, relativo: string) {
  const resolvido = path.resolve(raiz, relativo)
  const dentro = path.relative(raiz, resolvido)
  if (!dentro || dentro.startsWith('..') || path.isAbsolute(dentro)) {
    return null
  }
  return resolvido
}

function servirAdmin(): Plugin {
  const middleware: Connect.NextHandleFunction = (
    req: IncomingMessage,
    res: ServerResponse,
    next,
  ) => {
    const bruto = req.url?.split('?')[0] || ''
    let arquivo: string | null = null

    if (bruto === '/admin' || bruto === '/admin/') {
      res.statusCode = 302
      res.setHeader('Location', '/admin/login.html')
      res.end()
      return
    }

    if (bruto.startsWith('/admin/')) {
      arquivo = arquivoSeguro(path.join(frontendDir, 'admin'), bruto.slice(7))
    } else if (bruto.startsWith('/css/admin/')) {
      arquivo = arquivoSeguro(path.join(frontendDir, 'css', 'admin'), bruto.slice(11))
    }

    if (!arquivo || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      next()
      return
    }

    const tipo = MIME[path.extname(arquivo).toLowerCase()] || 'application/octet-stream'
    res.setHeader('Content-Type', tipo)
    fs.createReadStream(arquivo).pipe(res)
  }

  return {
    name: 'serve-admin-static',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), servirAdmin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(rootDir, 'node_modules/react'),
      'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['framer-motion', '@react-spring/web'],
  },
})
