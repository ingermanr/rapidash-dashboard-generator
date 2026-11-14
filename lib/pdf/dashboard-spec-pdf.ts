import { getRealLayoutDivisions } from "@/lib/layout-engine"
import type { LayoutVariant } from "@/types/dashboard"

export interface DashboardSpecPdfInput {
  variant: LayoutVariant
  title: string
  description: string
}

/** Builds the dashboard specification PDF and triggers its download. Throws if generation fails. */
export async function exportDashboardSpecPdf({
  variant,
  title: dashboardTitle,
  description: dashboardDescription,
}: DashboardSpecPdfInput): Promise<void> {
  const { combinations, variables } = variant
  const { jsPDF } = await import("jspdf")
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 102, 204]
  }

  // Extract primary color
  const primaryColor = variant.palette.colors[0] || "#0066cc"
  const [primaryR, primaryG, primaryB] = hexToRgb(primaryColor)

  // Check if we need a new page
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPosition + spaceNeeded > pageHeight - 25) {
      doc.addPage()
      yPosition = margin + 10
      return true
    }
    return false
  }

  // Header function
  const addHeader = (title: string, pageNum?: number) => {
    doc.setFillColor(primaryR, primaryG, primaryB)
    doc.rect(0, 0, pageWidth, 30, "F")
    
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text(title, margin, 20)
    
    if (pageNum) {
      doc.setFontSize(10)
      doc.text(`Página ${pageNum}`, pageWidth - 30, 20)
    }
    
    yPosition = 45
  }

  // Footer function
  const addFooter = () => {
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")} - Dashboard Generator`, margin, pageHeight - 8)
  }

  // ====== PÁGINA 1: PORTADA E INFORMACIÓN GENERAL ======
  addHeader("Especificación de Dashboard", 1)
  
  // Logo y título con mejor espaciado
  doc.setFillColor(primaryR, primaryG, primaryB)
  doc.rect(margin, yPosition, 40, 40, "F")
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("DG", margin + 15, yPosition + 25)
  
  // Título principal
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(40, 40, 40)
  const title = dashboardTitle || "Dashboard Sin Título"
  doc.text(title, margin + 55, yPosition + 20)
  
  // Subtítulo
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text("Especificación Técnica y Visual", margin + 55, yPosition + 35)
  
  yPosition += 60

  // Tabla de contenidos mejorada
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text("Tabla de Contenidos", margin, yPosition)
  yPosition += 15

  const tocItems = [
    ["1. Información General", "1"],
    ["2. Paleta de Colores", "2"], 
    ["3. Gráficos y Variables", "3"],
    ["4. Visualización del Layout", "4"]
  ]

  // Crear tabla de contenidos con mejor estructura
  tocItems.forEach((item, index) => {
    const itemY = yPosition + (index * 12)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    doc.text(item[0], margin + 5, itemY + 8)
    
    // Puntos de separación
    const dotsCount = Math.floor((pageWidth - margin * 2 - 80) / 3)
    const dots = ".".repeat(dotsCount)
    doc.setTextColor(150, 150, 150)
    doc.text(dots, margin + 100, itemY + 8)
    
    doc.setTextColor(60, 60, 60)
    doc.text(item[1], pageWidth - margin - 15, itemY + 8)
  })

  yPosition += tocItems.length * 12 + 25

  // Verificar espacio para información general
  checkPageBreak(120)
  
  // Información general con mejor espaciado
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text("Información General", margin, yPosition)
  yPosition += 20

  const infoData = [
    ["Nombre del Proyecto", dashboardTitle || "Sin título"],
    ["Paleta de Colores", variant.palette.name],
    ["Tipo de Layout", variant.layout],
    ["Total de Gráficos", combinations.length.toString()],
    ["Variables Configuradas", variables.length.toString()],
    ["Fecha de Creación", new Date().toLocaleDateString("es-ES")]
  ]

  const tableWidth = pageWidth - (margin * 2)
  const col1Width = tableWidth * 0.4
  const col2Width = tableWidth * 0.6
  const rowHeight = 18

  // Header de la tabla con mejor proporción
  doc.setFillColor(primaryR, primaryG, primaryB)
  doc.rect(margin, yPosition, tableWidth, rowHeight, "F")
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("Atributo", margin + 5, yPosition + 12)
  doc.text("Valor", margin + col1Width + 5, yPosition + 12)
  yPosition += rowHeight

  infoData.forEach((row, index) => {
    const currentY = yPosition + (index * rowHeight)
    
    // Verificar si necesitamos nueva página
    checkPageBreak(rowHeight + 5)
    
    // Fondo alternado
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250)
      doc.rect(margin, currentY, tableWidth, rowHeight, "F")
    }
    
    // Bordes
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.rect(margin, currentY, col1Width, rowHeight, "S")
    doc.rect(margin + col1Width, currentY, col2Width, rowHeight, "S")
    
    // Texto con mejor espaciado
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(70, 70, 70)
    doc.text(row[0], margin + 5, currentY + 12)
    
    doc.setFont("helvetica", "normal")
    doc.setTextColor(40, 40, 40)
    doc.text(row[1], margin + col1Width + 5, currentY + 12)
  })

  yPosition += infoData.length * rowHeight + 30

  // Descripción si existe
  if (dashboardDescription) {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(60, 60, 60)
    doc.text("Descripción del Proyecto", margin, yPosition)
    yPosition += 15
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    const descLines = doc.splitTextToSize(dashboardDescription, pageWidth - (margin * 2))
    doc.text(descLines, margin, yPosition)
    yPosition += descLines.length * 6 + 20
  }

  addFooter()

  addFooter()

  // ====== PÁGINA 2: PALETA DE COLORES ======
  doc.addPage()
  addHeader("Paleta de Colores", 2)

  // Información de la paleta
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text(`Paleta: ${variant.palette.name}`, margin, yPosition)
  yPosition += 20

  // Crear tabla de colores más compacta
  const colorTableWidth = pageWidth - (margin * 2)
  const colorRowHeight = 25
  const colWidths = [20, 50, 60, colorTableWidth - 130] // #, Muestra, Código, Uso

  // Header de la tabla
  doc.setFillColor(primaryR, primaryG, primaryB)
  doc.rect(margin, yPosition, colorTableWidth, colorRowHeight, "F")
  
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("#", margin + 8, yPosition + 16)
  doc.text("Color", margin + colWidths[0] + 20, yPosition + 16)
  doc.text("Código", margin + colWidths[0] + colWidths[1] + 5, yPosition + 16)
  doc.text("Uso Recomendado", margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPosition + 16)
  
  yPosition += colorRowHeight

  // Mostrar hasta 8 colores para evitar desbordamiento
  const colorsToShow = variant.palette.colors.slice(0, 8)
  
  colorsToShow.forEach((color, index) => {
    const currentY = yPosition + (index * colorRowHeight)
    
    // Verificar espacio en página
    checkPageBreak(colorRowHeight + 5)
    
    // Fondo alternado
    if (index % 2 === 1) {
      doc.setFillColor(248, 249, 250)
      doc.rect(margin, currentY, colorTableWidth, colorRowHeight, "F")
    }
    
    // Bordes de tabla
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.rect(margin, currentY, colWidths[0], colorRowHeight, "S")
    doc.rect(margin + colWidths[0], currentY, colWidths[1], colorRowHeight, "S")
    doc.rect(margin + colWidths[0] + colWidths[1], currentY, colWidths[2], colorRowHeight, "S")
    doc.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], currentY, colWidths[3], colorRowHeight, "S")
    
    // Número
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    doc.text((index + 1).toString(), margin + 8, currentY + 16)
    
    // Muestra de color
    const rgb = hexToRgb(color)
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(margin + colWidths[0] + 8, currentY + 6, 35, 13, "F")
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.5)
    doc.rect(margin + colWidths[0] + 8, currentY + 6, 35, 13, "S")
    
    // Código del color
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(40, 40, 40)
    doc.text(color.toUpperCase(), margin + colWidths[0] + colWidths[1] + 5, currentY + 16)
    
    // Uso recomendado
    const uses = ["Principal", "Secundario", "Acento", "Datos", "Auxiliar", "Extra", "Complemento", "Adicional"]
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text(uses[index] || "Color Adicional", margin + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 16)
  })

  yPosition += colorsToShow.length * colorRowHeight + 30

  addFooter()

  // ====== PÁGINA 3: GRÁFICOS Y VARIABLES ======
  doc.addPage()
  addHeader("Gráficos y Variables", 3)

  // Sección de gráficos
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text("Componentes del Dashboard", margin, yPosition)
  yPosition += 20

  // Lista de gráficos más compacta
  const chartsToShow = combinations.slice(0, 12) // Mostrar hasta 12 gráficos
  
  chartsToShow.forEach((chart, index) => {
    checkPageBreak(22)
    
    // Fondo alternado para cada ítem
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250)
      doc.rect(margin, yPosition - 2, pageWidth - (margin * 2), 18, "F")
    }
    
    // Bullet point visual con color de la paleta
    const bulletColor = variant.palette.colors[index % variant.palette.colors.length]
    const rgb = hexToRgb(bulletColor)
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(margin + 3, yPosition + 4, 4, 4, "F")
    
    // Nombre del gráfico
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(40, 40, 40)
    doc.text(`${chart.name || `Gráfico ${index + 1}`}`, margin + 12, yPosition + 8)
    
    // Información del gráfico
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 120, 120)
    const chartType = chart.chartType || "chart"
    const variables = []
    if (chart.numericVariable?.name) variables.push(chart.numericVariable.name)
    if (chart.categoricalVariable?.name) variables.push(chart.categoricalVariable.name)
    const variablesText = variables.length > 0 ? variables.join(" × ") : 'N/A'
    doc.text(`${chartType} • ${variablesText}`, margin + 12, yPosition + 14)
    
    yPosition += 20
  })

  yPosition += 25

  // Sección de variables
  checkPageBreak(40)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text("Variables de Datos", margin, yPosition)
  yPosition += 20

  // Tabla de variables más organizada
  if (variables.length > 0) {
    const varTableWidth = pageWidth - (margin * 2)
    const varRowHeight = 16
    const varColWidths = [varTableWidth * 0.4, varTableWidth * 0.3, varTableWidth * 0.3]

    // Header de tabla de variables
    doc.setFillColor(primaryR, primaryG, primaryB)
    doc.rect(margin, yPosition, varTableWidth, varRowHeight, "F")
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("Nombre", margin + 5, yPosition + 11)
    doc.text("Tipo", margin + varColWidths[0] + 5, yPosition + 11)
    doc.text("Uso", margin + varColWidths[0] + varColWidths[1] + 5, yPosition + 11)
    
    yPosition += varRowHeight

    // Lista de variables más compacta
    variables.slice(0, 15).forEach((variable, index) => {
      checkPageBreak(varRowHeight + 5)
      
      // Fondo alternado
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250)
        doc.rect(margin, yPosition, varTableWidth, varRowHeight, "F")
      }
      
      // Bordes
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.rect(margin, yPosition, varColWidths[0], varRowHeight, "S")
      doc.rect(margin + varColWidths[0], yPosition, varColWidths[1], varRowHeight, "S")
      doc.rect(margin + varColWidths[0] + varColWidths[1], yPosition, varColWidths[2], varRowHeight, "S")
      
      // Nombre de variable
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(40, 40, 40)
      doc.text(variable.name, margin + 5, yPosition + 11)
      
      // Tipo de variable con color
      doc.setFont("helvetica", "normal")
      const typeColors = {
        'numeric': [52, 152, 219],
        'categorical': [46, 204, 113],
        'temporal': [155, 89, 182]
      }
      const typeColor = typeColors[variable.type as keyof typeof typeColors] || [149, 165, 166]
      doc.setTextColor(typeColor[0], typeColor[1], typeColor[2])
      
      const typeLabels = {
        'numeric': 'Numérica',
        'categorical': 'Categórica',
        'temporal': 'Temporal'
      }
      const typeLabel = typeLabels[variable.type as keyof typeof typeLabels] || 'Desconocido'
      doc.text(typeLabel, margin + varColWidths[0] + 5, yPosition + 11)
      
      // Uso/Propósito
      doc.setTextColor(80, 80, 80)
      const usage = variable.type === 'numeric' ? 'Medición' : 
                   variable.type === 'categorical' ? 'Agrupación' : 
                   variable.type === 'temporal' ? 'Tiempo' : 'General'
      doc.text(usage, margin + varColWidths[0] + varColWidths[1] + 5, yPosition + 11)
      
      yPosition += varRowHeight
    })

    yPosition += 10
  } else {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 120, 120)
    doc.text("No hay variables configuradas", margin, yPosition)
    yPosition += 20
  }

  addFooter()

  // ====== PÁGINA 4: LAYOUT VISUAL (LANDSCAPE) ======
  doc.addPage("l")
  const lsWidth = doc.internal.pageSize.getHeight()
  const lsHeight = doc.internal.pageSize.getWidth()
  
  // Header en landscape con mejor proporción
  doc.setFillColor(primaryR, primaryG, primaryB)
  doc.rect(0, 0, lsWidth, 30, "F")
  
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("Visualización del Layout", 15, 20)
  
  doc.setFontSize(10)
  doc.text(`${variant.layout} - ${combinations.length} componentes`, lsWidth - 150, 20)
  
  // Grid que refleja la distribución real del layout del usuario - ULTRA COMPACTO HORIZONTAL
  const gridMargin = 20
  const maxGridWidth = 120 // Ancho MUCHO más pequeño
  const gridWidth = Math.min(lsWidth - 60, maxGridWidth) // Dejar más margen
  const gridX = gridMargin + 10 // Comenzar más cerca del margen izquierdo
  const gridY = 50
  const gridHeight = 80 // Altura también reducida

  // Obtener el layout exacto seleccionado por el usuario
  const userLayout = variant.layout || 'grid' // Fallback a grid si no está definido
  
  // Título del layout - SIEMPRE muestra el layout exacto seleccionado por el usuario
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  const layoutName = userLayout.charAt(0).toUpperCase() + userLayout.slice(1)
  doc.text(`Layout: ${layoutName} (${combinations.length} componentes)`, gridX, gridY - 10)

  // Same divisions as the on-screen preview, from the layout engine
  const divisions = getRealLayoutDivisions(userLayout, combinations.length).map((d) => ({ x: d.x, y: d.y, w: d.width, h: d.height }))
  type LayoutDivision = (typeof divisions)[number]
  const maxRows = Math.max(...divisions.map((d: LayoutDivision) => d.y + d.h))
  const gridColWidth = gridWidth / 12 // Ancho de columna ULTRA pequeño (120/12 = 10pt por columna)
  const cellRowHeight = Math.min(25, gridHeight / Math.max(maxRows, 3)) // Altura también reducida

  // Fondo del contenedor
  doc.setFillColor(248, 249, 250)
  doc.rect(gridX, gridY, gridWidth, gridHeight, "F")
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(gridX, gridY, gridWidth, gridHeight, "S")

  // Líneas de guía del grid - MUY SIMPLIFICADAS
  doc.setDrawColor(240, 240, 240)
  doc.setLineWidth(0.1)
  for (let i = 3; i < 12; i += 3) { // Solo cada 3 columnas
    const x = gridX + (i * gridColWidth)
    doc.line(x, gridY, x, gridY + gridHeight)
  }

  // Números de columnas - ULTRA SIMPLIFICADO
  doc.setFontSize(3)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(180, 180, 180)
  for (let i = 3; i <= 12; i += 3) { // Solo cada 3 columnas
    const x = gridX + ((i - 0.5) * gridColWidth)
    if (gridColWidth > 3) { // Solo si hay espacio mínimo
      doc.text(i.toString(), x - 0.5, gridY - 1)
    }
  }

  // Renderizar cada componente según su división real - SIEMPRE el mismo número que seleccionó el usuario
  combinations.forEach((chart, index) => {
    const division = divisions[index]
    if (!division) return

    const x = gridX + (division.x * gridColWidth)
    const y = gridY + (division.y * cellRowHeight)
    const width = Math.max(6, division.w * gridColWidth - 2) // Ancho ULTRA mínimo
    const height = Math.max(10, division.h * cellRowHeight - 2) // Alto mínimo reducido

    // Verificar que no se salga del grid
    if (x + width > gridX + gridWidth || y + height > gridY + gridHeight) return

    // Fondo del componente en gris
    doc.setFillColor(220, 220, 220)
    doc.rect(x + 1, y + 1, width, height, "F")
    
    // Borde del componente
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.5)
    doc.rect(x + 1, y + 1, width, height, "S")

    // Solo mostrar el número si el componente es mínimamente visible
    if (width > 6 && height > 6) {
      // Número del componente ultra-pequeño
      doc.setFontSize(3)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.setFillColor(100, 100, 100)
      const numSize = Math.min(4, width / 8, height / 4)
      if (numSize >= 2) {
        doc.rect(x + 0.5, y + 0.5, numSize, numSize, "F")
        doc.text(`${index + 1}`, x + 1, y + 2.5)
      }
    }
  })
  
  // Información adicional más compacta - ajustada para no sobreponerse
  const infoY = gridY + gridHeight + 10
  const maxInfoY = lsHeight - 25 // Dejar espacio para el pie de página
  
  // Solo mostrar info si hay espacio suficiente
  if (infoY + 30 < maxInfoY) {
    // Caja de información más pequeña
    const infoBoxX = gridX
    const infoBoxY = infoY
    const infoBoxWidth = gridWidth
    const infoBoxHeight = 25 // Altura reducida
    
    doc.setFillColor(248, 250, 252)
    doc.rect(infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight, "F")
    doc.setDrawColor(primaryR, primaryG, primaryB)
    doc.setLineWidth(0.5)
    doc.rect(infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight, "S")
    
    // Información en una sola línea compacta
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(primaryR, primaryG, primaryB)
    const specText = `${variant.layout.toUpperCase()} • ${combinations.length} componentes • Grid 12 col • ${variant.palette.name}`
    doc.text(specText, infoBoxX + 10, infoBoxY + 16)
  }

  // Footer landscape más elegante
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(15, lsHeight - 12, lsWidth - 15, lsHeight - 12)
  
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Dashboard Layout - Generado el ${new Date().toLocaleDateString("es-ES")} - Dashboard Generator`, 15, lsHeight - 5)
  doc.text("Página 4", lsWidth - 30, lsHeight - 5)

  // Guardar PDF
  const fileName = dashboardTitle 
    ? `dashboard-${dashboardTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`
    : "dashboard-specification.pdf"
  
  doc.save(fileName)
}
