import { act, render, screen } from '@testing-library/react'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'
import { metadata } from '@/app/layout'

jest.mock('geist/font/sans', () => ({ GeistSans: { variable: '' } }))
jest.mock('geist/font/mono', () => ({ GeistMono: { variable: '' } }))
jest.mock('@vercel/analytics/next', () => ({ Analytics: () => null }))

const publicDir = join(__dirname, '../../public')

function renderView(showLanding: boolean) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState({ showLanding })
  })
  render(<DashboardGenerator />)
}

describe('brand mark', () => {
  it.each([
    ['landing', true],
    ['builder', false],
  ])('shows the Rapidash logo on the %s', (_view, showLanding) => {
    renderView(showLanding)
    expect(screen.getByRole('img', { name: 'Rapidash' })).toBeInTheDocument()
  })

  it('uses the brand blue, not the old rainbow circle, for the vector icons', () => {
    for (const file of ['favicon.svg', 'favicon-16.svg']) {
      const svg = readFileSync(join(publicDir, file), 'utf8')
      expect(svg).toContain('#0054ee')
      expect(svg).not.toContain('#FF6B6B')
    }
  })

  it('declares raster icons that browsers, iOS and installed apps can use, and every one exists', () => {
    const isPng = (file: string) => readFileSync(join(publicDir, file)).subarray(1, 4).toString() === 'PNG'

    expect(metadata.icons).toEqual({
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    })
    expect(existsSync(join(publicDir, 'favicon.ico'))).toBe(true)
    expect(isPng('apple-touch-icon.png')).toBe(true)

    const manifest = JSON.parse(readFileSync(join(publicDir, 'manifest.json'), 'utf8'))
    expect(manifest.theme_color).toBe('#0054ee')
    expect(manifest.icons).toEqual([
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ])
    for (const icon of manifest.icons) expect(existsSync(join(publicDir, icon.src))).toBe(true)
    expect(isPng('icon-192.png') && isPng('icon-512.png')).toBe(true)
  })
})
