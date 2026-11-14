import { act, render, screen } from '@testing-library/react'
import DashboardGenerator from '@/app/page'
import { useDashboardStore } from '@/store'

function setState(state: Partial<ReturnType<typeof useDashboardStore.getState>>) {
  act(() => {
    useDashboardStore.getState().reset()
    useDashboardStore.setState(state)
  })
}

afterEach(() => jest.restoreAllMocks())

describe('storage status banner', () => {
  it('warns when the browser storage is full, without breaking the edit, and clears once saving works again', () => {
    setState({ showLanding: false })
    render(<DashboardGenerator />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => act(() => useDashboardStore.getState().setDashboardTitle('Ventas'))).not.toThrow()

    expect(useDashboardStore.getState().dashboardTitle).toBe('Ventas')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudieron guardar tus cambios: el almacenamiento del navegador está lleno.',
    )

    setItem.mockRestore()
    act(() => useDashboardStore.getState().setDashboardTitle('Ventas 2026'))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('dashboard-storage')!).state.dashboardTitle).toBe('Ventas 2026')
  })

  it('explains when the browser does not allow saving at all', () => {
    setState({ showLanding: false })
    render(<DashboardGenerator />)

    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    act(() => useDashboardStore.getState().setDashboardTitle('Privado'))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El navegador no permite guardar datos en este sitio. Tus cambios se perderán al cerrar la pestaña.',
    )
  })
})
