import { defineConfig } from 'vite'
import eslintPlugin from 'vite-plugin-eslint'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import svgrPlugin from 'vite-plugin-svgr'
import { splitVendorChunkPlugin } from 'vite'

import rollupNodePolyFill from 'rollup-plugin-polyfill-node'
import filterReplace from 'vite-plugin-filter-replace'

export default defineConfig({
    plugins: [
      filterReplace(
        [
          {
            filter: 'node_modules/@airgap/beacon-ui/dist/esm/utils/qr.js',
            replace: {
              from: "import * as qrcode from 'qrcode-generator';",
              to: "import qrcode from 'qrcode-generator';",
            },
          },
          {
            filter: [
              'node_modules/@airgap/beacon-dapp/dist/walletbeacon.dapp.min.js',
              'node_modules/@airgap/beacon-ui/dist/cjs/ui/alert/alert-templates.js',
              'node_modules/@airgap/beacon-ui/dist/esm/ui/alert/alert-templates.js',
            ],
            replace: {
              from: /\\n@media\s*\(min-height:\s*700px\).*translateY\(-50%\);\\n\s*\}\\n\}/g,
              to: '',
            },
          },
        ],
        {
          apply: 'build',
          enforce: 'post',
        }
      ),
      react(),
      splitVendorChunkPlugin(),
      viteTsconfigPaths(),
      svgrPlugin(),
      // ViteEjsPlugin(),
    ],
    // define: {
    //   global: 'global',
    // },
    server: {
      host: true,
      port: 3000,
    },
    build: {
      outDir: 'build',
      rollupOptions: {
        plugins: [rollupNodePolyFill()],
        output: {
          manualChunks: {
            contracts: [
              '@taquito/beacon-wallet',
              '@taquito/michelson-encoder',
              '@stablelib/ed25519',
              '@stablelib/nacl',
              '@stablelib/x25519-session',
              '@taquito/taquito',
            ],
            pdf: ['react-pdf', 'pdfjs-dist'],
            ui: [
              'classnames',
              'react',
              'react-router-dom',
              'react-dom',
              'framer-motion',
            ],
          },
        },
      },
    },
    optimizeDeps: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      esbuildOptions: {
        inject: ['./src/node_polyfill.js'],
      },
    },
    resolve: {
      alias: {
        'readable-stream': 'vite-compatible-readable-stream',
        stream: 'vite-compatible-readable-stream',
        path: require.resolve('path-browserify'),
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        process: 'rollup-plugin-node-polyfills/polyfills/process-es6'
        
      },
    },
  }) 