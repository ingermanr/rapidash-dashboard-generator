import { act, render, screen } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'

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

  it('uses the brand blue, not the old rainbow circle, for every app icon', () => {
    for (const file of ['favicon.svg', 'favicon-16.svg', 'apple-touch-icon.svg']) {
      const svg = readFileSync(join(__dirname, '../../public', file), 'utf8')
      expect(svg).toContain('#0054ee')
      expect(svg).not.toContain('#FF6B6B')
    }
    const manifest = JSON.parse(readFileSync(join(__dirname, '../../public/manifest.json'), 'utf8'))
    expect(manifest.theme_color).toBe('#0054ee')
  })
})
