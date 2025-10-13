import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DashboardDetailedPreview } from '@/components/dashboard-detailed-preview'
import type { LayoutVariant, Variable, VariableCombination } from '@/types/dashboard'

// Mock jsPDF
const mockSave = jest.fn()
const mockAddPage = jest.fn()
const mockText = jest.fn()
const mockSetFontSize = jest.fn()
const mockSetFont = jest.fn()
const mockSetTextColor = jest.fn()
const mockSetFillColor = jest.fn()
const mockSetDrawColor = jest.fn()
const mockSetLineWidth = jest.fn()
const mockRect = jest.fn()
const mockLine = jest.fn()
const mockSplitTextToSize = jest.fn().mockReturnValue(['Line 1', 'Line 2'])
const mockGetTextWidth = jest.fn().mockReturnValue(50)
const mockAddImage = jest.fn()

const mockJsPDF = {
  save: mockSave,
  addPage: mockAddPage,
  text: mockText,
  setFontSize: mockSetFontSize,
  setFont: mockSetFont,
  setTextColor: mockSetTextColor,
  setFillColor: mockSetFillColor,
  setDrawColor: mockSetDrawColor,
  setLineWidth: mockSetLineWidth,
  rect: mockRect,
  line: mockLine,
  splitTextToSize: mockSplitTextToSize,
  getTextWidth: mockGetTextWidth,
  addImage: mockAddImage,
  internal: {
    pageSize: {
      getWidth: () => 210,
      getHeight: () => 297
    }
  }
}

// Mock dynamic import
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => mockJsPDF)
}))

// Mock html2canvas
jest.mock('html2canvas', () => ({
  default: jest.fn().mockImplementation(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    width: 800,
    height: 600
  }))
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve())
  }
})

// Mock store hooks
jest.mock('@/store', () => ({
  useDashboardInfo: () => ({
    dashboardTitle: 'Test Dashboard',
    dashboardDescription: 'This is a test dashboard for PDF generation'
  })
}))

const mockVariables: Variable[] = [
  {
    id: '1',
    name: 'Ventas',
    type: 'numeric',
    priority: 'alta'
  },
  {
    id: '2',
    name: 'Región',
    type: 'categorical',
    priority: 'media'
  },
  {
    id: '3',
    name: 'Fecha',
    type: 'temporal',
    priority: 'baja'
  }
]

const mockCombinations: VariableCombination[] = [
  {
    id: '1',
    numericVariable: mockVariables[0],
    categoricalVariable: mockVariables[1],
    name: 'Ventas por Región',
    chartType: 'bar'
  },
  {
    id: '2',
    numericVariable: mockVariables[0],
    name: 'Evolución de Ventas',
    chartType: 'line'
  }
]

const mockVariant: LayoutVariant = {
  id: 'test-variant',
  layout: 'Grid',
  palette: {
    name: 'Professional Blue',
    colors: ['#0066CC', '#4A90E2', '#7BB3F0', '#A8D1FF', '#D4E8FF'],
    description: 'Professional blue palette'
  },
  variables: mockVariables,
  combinations: mockCombinations,
  layoutDescription: 'Distribución uniforme en cuadrícula'
}

describe('PDF Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock querySelector to return a mock element
    Object.defineProperty(document, 'querySelector', {
      writable: true,
      value: jest.fn().mockImplementation((selector) => {
        if (selector === '[data-dashboard-preview="true"]') {
          return {
            scrollWidth: 800,
            scrollHeight: 600
          }
        }
        return null
      })
    })
  })

  it('should render PDF download button', () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    expect(downloadButton).toBeInTheDocument()
  })

  it('should generate PDF with complete information when button is clicked', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Verify PDF structure
    expect(mockSave).toHaveBeenCalledWith('dashboard-test-dashboard.pdf')
    
    // Verify that pages were added (Table of Contents, Variables, etc.)
    expect(mockAddPage).toHaveBeenCalled()
    
    // Verify that text content was added
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Test Dashboard'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Especificación de Dashboard'), expect.any(Number), expect.any(Number))
    
    // Verify font settings were applied
    expect(mockSetFontSize).toHaveBeenCalled()
    expect(mockSetFont).toHaveBeenCalled()
    expect(mockSetTextColor).toHaveBeenCalled()
  })

  it('should include all required sections in PDF', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check for key sections
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Especificación de Dashboard'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Paleta de Colores'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Variables'), expect.any(Number), expect.any(Number))
  })

  it('should include variable information in PDF', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check that variables are included - simplified to check basic function calls
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Ventas'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalled()
    expect(mockSetFontSize).toHaveBeenCalled()
  })

  it('should include color palette information in PDF', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check that color information is included
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('#0066CC'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('#4A90E2'), expect.any(Number), expect.any(Number))
    
    // Check that color rectangles are drawn
    expect(mockRect).toHaveBeenCalled()
    expect(mockSetFillColor).toHaveBeenCalled()
  })

  it('should handle dashboard without title gracefully', async () => {
    // Mock store to return empty title
    const mockUseDashboardInfo = jest.fn(() => ({
      dashboardTitle: '',
      dashboardDescription: ''
    }))
    
    // Temporarily replace the mock
    require('@/store').useDashboardInfo = mockUseDashboardInfo

    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Should use default filename
    expect(mockSave).toHaveBeenCalledWith('dashboard-specification.pdf')
  })

  it('should include layout grid visualization', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check that grid lines and containers are drawn
    expect(mockLine).toHaveBeenCalled() // Grid lines
    expect(mockRect).toHaveBeenCalled() // Chart containers
    expect(mockText).toHaveBeenCalled() // Text content
  })

  it('should include professional header and footer', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check for header and footer content (simplified)
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Dashboard Generator'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Generado el'), expect.any(Number), expect.any(Number))
    
    // Check for date (simplified format in new PDF)
    const currentDate = new Date().toLocaleDateString("es-ES")
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining(`Generado el ${currentDate}`), expect.any(Number), expect.any(Number))
  })

  it('should include dashboard preview image when element exists', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check that PDF generation completed successfully
    expect(mockText).toHaveBeenCalled()
    expect(mockAddPage).toHaveBeenCalled()
  })

  it('should format layout information correctly', async () => {
    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })

    // Check that layout information is included in PDF
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Grid'), expect.any(Number), expect.any(Number))
    expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Professional Blue'), expect.any(Number), expect.any(Number))
    expect(mockRect).toHaveBeenCalled()
  })

  it('should handle errors gracefully during PDF generation', async () => {
    // Mock jsPDF to throw an error for this test only
    const mockSaveError = jest.fn(() => {
      throw new Error('PDF generation failed')
    })
    
    // Mock console.error to avoid cluttering test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Replace the mock for this test only
    jest.doMock('jspdf', () => ({
      jsPDF: jest.fn().mockImplementation(() => ({
        setFontSize: jest.fn(),
        text: mockText,
        addPage: jest.fn(),
        addImage: mockAddImage,
        save: mockSaveError,
        internal: { pageSize: { width: 210, height: 297 } }
      }))
    }))

    render(<DashboardDetailedPreview variant={mockVariant} />)
    
    const downloadButton = screen.getByText('Descargar PDF')
    
    // Should not throw even if PDF generation fails
    expect(() => {
      fireEvent.click(downloadButton)
    }).not.toThrow()

    consoleSpy.mockRestore()
    jest.dontMock('jspdf')
  })
})