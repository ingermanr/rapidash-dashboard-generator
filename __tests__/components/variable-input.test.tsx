import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VariableInput } from '@/components/variable-input'
import type { Variable } from '@/types/dashboard'

// Mock del hook useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock del store
const mockAddVariable = jest.fn()
const mockRemoveVariable = jest.fn()
const mockVariableExists = jest.fn()

jest.mock('@/store', () => ({
  useVariables: () => ({
    variables: [],
    addVariable: mockAddVariable,
    removeVariable: mockRemoveVariable,
    variableExists: mockVariableExists,
  }),
}))

describe('VariableInput Component', () => {
  beforeEach(() => {
    mockAddVariable.mockClear()
    mockRemoveVariable.mockClear()
    mockVariableExists.mockClear()
  })

  it('renders the component with initial elements', () => {
    render(<VariableInput />)

    // Verificar que los elementos principales estén presentes
    expect(screen.getByLabelText(/nombre de la variable/i)).toBeTruthy()
    expect(screen.getByText(/agregar/i)).toBeTruthy()
    expect(screen.getByText(/define variables/i)).toBeTruthy()
  })

  it('calls addVariable when form is submitted with valid data', async () => {
    const user = userEvent.setup()
    mockVariableExists.mockReturnValue(false) // No existe la variable
    
    render(<VariableInput />)

    // Llenar el formulario
    const nameInput = screen.getByLabelText(/nombre de la variable/i)
    await user.type(nameInput, 'Ventas')

    const addButton = screen.getByText(/agregar/i)
    await user.click(addButton)

    // Verificar que se llamó addVariable
    await waitFor(() => {
      expect(mockAddVariable).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ventas',
          type: 'numeric',
          id: expect.any(String),
        })
      )
    })
  })

  it('shows error when trying to add duplicate variable name', async () => {
    const user = userEvent.setup()
    mockVariableExists.mockReturnValue(true) // La variable ya existe
    
    render(<VariableInput />)

    // Intentar agregar variable con nombre duplicado
    const nameInput = screen.getByLabelText(/nombre de la variable/i)
    await user.type(nameInput, 'Ventas')

    const addButton = screen.getByText(/agregar/i)
    await user.click(addButton)

    // Verificar que aparece el error
    await waitFor(() => {
      expect(screen.getByText(/ya existe una variable con este nombre/i)).toBeTruthy()
    })

    // Verificar que no se llamó addVariable
    expect(mockAddVariable).not.toHaveBeenCalled()
  })
})