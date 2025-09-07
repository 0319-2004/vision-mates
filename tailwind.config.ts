import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // レトロゲーム風カラーパレット
        retro: {
          // ダークレッド
          red: '#8B1538',
          // ブライトオレンジ  
          orange: '#FF6B35',
          // ブライトイエロー
          yellow: '#F7931E',
          // ライムグリーン
          green: '#7CB518',
          // サイアン
          cyan: '#0DB9DB',
          // パープル
          purple: '#7B68EE',
          // ピンク
          pink: '#FF1493',
          // ダークグレー（背景用）
          darkGray: '#2A2A2A',
          // ライトグレー（テキスト用）
          lightGray: '#E0E0E0',
          // ブラック（フレーム用）
          black: '#000000',
          // ホワイト（ハイライト用）
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        // ピクセルフォント風（システムフォントの代替）
        pixel: ['Courier New', 'monospace'],
        arcade: ['Impact', 'Arial Black', 'sans-serif'],
      },
      boxShadow: {
        // レトロゲーム風の影
        'retro': '4px 4px 0px 0px #000000',
        'retro-lg': '8px 8px 0px 0px #000000',
        'retro-pressed': '2px 2px 0px 0px #000000',
      },
      animation: {
        // ブリンク効果
        blink: 'blink 1s infinite',
        // グロー効果
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px currentColor' },
          '100%': { textShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
      },
    },
  },
  plugins: [],
}
export default config 