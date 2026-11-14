"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LayoutVariant, VariableCombination, Variable } from "@/types/dashboard"
import {
  TrendingUp,
  Users,
  Percent,
  Hash,
  BarChart3,
  Calendar,
  Tag,
  Filter,
  X,
  Download,
  ToggleLeft,
} from "lucide-react"
import { getRealLayoutDivisions, generateGridStyles, getGridDimensions, getComponentSize, analyzeLayoutQuality } from "@/lib/layout-engine"
import { useState, useEffect } from "react"
import { useDashboardInfo } from "@/store"
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts"

// Hook to get axis text color that updates with theme changes
const useAxisTextColor = () => {
  const [axisColor, setAxisColor] = useState('#000000')

  useEffect(() => {
    const updateAxisColor = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setAxisColor(isDark ? '#ffffff' : '#000000')
    }

    // Set initial color
    updateAxisColor()

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateAxisColor()
        }
      })
    })

    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    return () => observer.disconnect()
  }, [])

  return axisColor
}

interface DashboardDetailedPreviewProps {
  variant: LayoutVariant
  dashboardTitle?: string
  dashboardDescription?: string
}

export function DashboardDetailedPreview({
  variant,
  dashboardTitle: propTitle,
  dashboardDescription: propDescription,
}: DashboardDetailedPreviewProps) {
  const { combinations, variables } = variant
  
  // Get dashboard info from store, fallback to props
  const { dashboardTitle: storeTitle, dashboardDescription: storeDescription } = useDashboardInfo()
  const dashboardTitle = propTitle || storeTitle
  const dashboardDescription = propDescription || storeDescription

  const independentVariables = getIndependentVariables(variables)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const filterableVariables = variables.filter(
    (v) => v.type === "categorical" || v.type === "temporal" || v.type === "binary",
  )

  const handleFilterChange = (variableId: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [variableId]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  const handleDownloadPDF = async () => {
    try {
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

      // Obtener las divisiones reales del layout usando el layout engine
      const getRealLayoutDivisions = (layout: string, numCombinations: number) => {
        // Distribuciones optimizadas que reflejan mejor los layouts reales
        const numComps = Math.min(numCombinations, 12)
        
        switch (layout.toLowerCase()) {
          case 'grid':
            // Grid uniforme - distribución equitativa
            if (numComps <= 1) return [{ x: 0, y: 0, w: 12, h: 1 }]
            if (numComps === 2) return [
              { x: 0, y: 0, w: 6, h: 1 },
              { x: 6, y: 0, w: 6, h: 1 }
            ]
            if (numComps <= 3) return [
              { x: 0, y: 0, w: 4, h: 1 },
              { x: 4, y: 0, w: 4, h: 1 },
              { x: 8, y: 0, w: 4, h: 1 }
            ]
            if (numComps <= 4) return [
              { x: 0, y: 0, w: 6, h: 1 },
              { x: 6, y: 0, w: 6, h: 1 },
              { x: 0, y: 1, w: 6, h: 1 },
              { x: 6, y: 1, w: 6, h: 1 }
            ]
            if (numComps <= 6) return [
              { x: 0, y: 0, w: 4, h: 1 }, { x: 4, y: 0, w: 4, h: 1 }, { x: 8, y: 0, w: 4, h: 1 },
              { x: 0, y: 1, w: 4, h: 1 }, { x: 4, y: 1, w: 4, h: 1 }, { x: 8, y: 1, w: 4, h: 1 }
            ].slice(0, numComps)
            // Más de 6 componentes en grid 4x3
            const cols = 4
            const colWidth = 12 / cols
            return Array.from({ length: numComps }, (_, i) => ({
              x: (i % cols) * colWidth,
              y: Math.floor(i / cols),
              w: colWidth,
              h: 1
            }))

          case 'masonry':
            // Layout masonry - tamaños irregulares como cascada
            if (numComps <= 1) return [{ x: 0, y: 0, w: 12, h: 1 }]
            if (numComps === 2) return [
              { x: 0, y: 0, w: 8, h: 1 },   // Componente ancho
              { x: 8, y: 0, w: 4, h: 1 }    // Componente estrecho
            ]
            if (numComps <= 3) return [
              { x: 0, y: 0, w: 6, h: 1 },   // Mediano
              { x: 6, y: 0, w: 3, h: 1 },   // Pequeño
              { x: 9, y: 0, w: 3, h: 1 }    // Pequeño
            ]
            // Patrón masonry típico con variedad de tamaños
            const masonryPattern = [
              { x: 0, y: 0, w: 6, h: 1 },   // Grande izq
              { x: 6, y: 0, w: 3, h: 1 },   // Peq der arriba
              { x: 9, y: 0, w: 3, h: 1 },   // Peq der arriba
              { x: 0, y: 1, w: 4, h: 1 },   // Med izq abajo
              { x: 4, y: 1, w: 8, h: 1 },   // Ancho abajo
              { x: 0, y: 2, w: 3, h: 1 },   // Peq
              { x: 3, y: 2, w: 3, h: 1 },   // Peq
              { x: 6, y: 2, w: 6, h: 1 },   // Med
              ...Array.from({ length: Math.max(0, numComps - 8) }, (_, i) => ({
                x: (i % 4) * 3,
                y: 3 + Math.floor(i / 4),
                w: 3,
                h: 1
              }))
            ]
            return masonryPattern.slice(0, numComps)

          case 'dashboard':
            // Layout dashboard - header + métricas + gráficos
            if (numComps <= 1) return [{ x: 0, y: 0, w: 12, h: 1 }]
            if (numComps === 2) return [
              { x: 0, y: 0, w: 12, h: 1 }, // Header completo
              { x: 0, y: 1, w: 12, h: 1 }  // Contenido completo
            ]
            return [
              { x: 0, y: 0, w: 12, h: 1 }, // Header principal
              ...Array.from({ length: numComps - 1 }, (_, i) => {
                if (i < 3) {
                  // Primeros 3 como métricas (4 columnas cada uno)
                  return { x: i * 4, y: 1, w: 4, h: 1 }
                } else {
                  // Resto como gráficos (6 columnas cada uno)
                  const idx = i - 3
                  return { 
                    x: (idx % 2) * 6, 
                    y: 2 + Math.floor(idx / 2), 
                    w: 6, 
                    h: 1 
                  }
                }
              })
            ]

          case 'sidebar':
          case 'left-sidebar':
            // Layout con sidebar izquierdo fijo
            if (numComps <= 1) return [{ x: 0, y: 0, w: 12, h: 1 }]
            return [
              { x: 0, y: 0, w: 3, h: 3 }, // Sidebar izquierdo alto
              ...Array.from({ length: numComps - 1 }, (_, i) => ({
                x: 3 + (i % 3) * 3,
                y: Math.floor(i / 3),
                w: 3,
                h: 1
              }))
            ]

          case 'right-sidebar':
            // Layout con sidebar derecho
            if (numComps <= 1) return [{ x: 0, y: 0, w: 12, h: 1 }]
            return [
              { x: 9, y: 0, w: 3, h: 3 }, // Sidebar derecho alto
              ...Array.from({ length: numComps - 1 }, (_, i) => ({
                x: (i % 3) * 3,
                y: Math.floor(i / 3),
                w: 3,
                h: 1
              }))
            ]

          case 'kanban':
            // Layout kanban - columnas verticales
            if (numComps <= 1) return [{ x: 0, y: 0, w: 12, h: 1 }]
            const kanbanCols = Math.min(numComps, 4)
            const kanbanColWidth = 12 / kanbanCols
            return Array.from({ length: numComps }, (_, i) => ({
              x: (i % kanbanCols) * kanbanColWidth,
              y: Math.floor(i / kanbanCols),
              w: kanbanColWidth,
              h: 1
            }))

          default:
            // Layout por defecto - grid simple
            const defaultCols = numComps <= 2 ? 2 : 3
            const defaultColWidth = 12 / defaultCols
            return Array.from({ length: numComps }, (_, i) => ({
              x: (i % defaultCols) * defaultColWidth,
              y: Math.floor(i / defaultCols),
              w: defaultColWidth,
              h: 1
            }))
        }
      }

      type LayoutDivision = { x: number; y: number; w: number; h: number }
      // Obtener las divisiones usando el layout exacto seleccionado por el usuario
      const divisions: LayoutDivision[] = getRealLayoutDivisions(userLayout, combinations.length)
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

      // Verificar que las divisiones coincidan con el número de componentes del usuario
      if (divisions.length !== combinations.length) {
        console.warn(`Layout mismatch: ${divisions.length} divisions vs ${combinations.length} components for layout "${userLayout}"`)
      }

      // Renderizar cada componente según su división real - SIEMPRE el mismo número que seleccionó el usuario
      combinations.forEach((chart, index) => {
        const division = divisions[index] || divisions[divisions.length - 1] // Usar la última división como fallback
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
      
    } catch (error) {
      console.error("Error al generar PDF:", error)
      alert("Hubo un error al generar el PDF. Por favor, revisa la consola para más detalles.")
    }
  }

  // Universal layout renderer - ahora usando módulo centralizado
  const renderUniversalLayout = (variant: LayoutVariant) => {
    try {
      const divisions = getRealLayoutDivisions(variant.layout, variant.combinations.length)
      if (divisions.length === 0) {
        console.warn(`No divisions found for layout: ${variant.layout} with ${variant.combinations.length} combinations`)
        return null
      }

      // Usar las dimensiones del grid centralizadas
      const { maxRows, maxColumns } = getGridDimensions(divisions)
      
      // Debug info en desarrollo con validación de calidad
      if (process.env.NODE_ENV === 'development') {
        const quality = analyzeLayoutQuality(divisions)
        
        // Advertencias si hay problemas
        if (quality.spaceUtilization < 50) {
          console.warn(`⚠️ Bajo aprovechamiento de espacio: ${quality.spaceUtilization}%`)
        }
        if (quality.hasOverlaps) {
          console.warn(`❌ Solapamientos detectados en el layout`)
        }
        if (!quality.isValid) {
          console.error(`💥 Layout inválido detectado`)
        }
      }
      
      return (
        <div 
          className="relative w-full" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${maxColumns}, 1fr)`, 
            gridTemplateRows: `repeat(${maxRows}, minmax(280px, auto))`, 
            gap: '1rem' 
          }}
        >
          {divisions.map((division, index) => {
            // Asegurar que no renderizamos más elementos que combinaciones disponibles
            if (index >= variant.combinations.length) {
              console.warn(`Division ${index} exceeds available combinations (${variant.combinations.length})`)
              return null
            }
            
            const combination = variant.combinations[index]
            if (!combination) {
              console.warn(`No combination found for index ${index}`)
              return null
            }
            
            // Usar función centralizada para calcular el tamaño
            const size = getComponentSize(division)
            // Usar estilos unificados de grid
            const gridStyles = generateGridStyles(division)
            
            return (
              <div
                key={combination.id}
                style={gridStyles}
                className="relative"
              >
                <CombinationCard 
                  combination={combination} 
                  palette={variant.palette} 
                  index={index} 
                  size={size}
                />
              </div>
            )
          })}
        </div>
      )
    } catch (error) {
      console.error(`Error rendering layout ${variant.layout}:`, error)
      // Fallback rendering
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variant.combinations.map((combination, index) => (
            <div key={combination.id} className="relative">
              <CombinationCard 
                combination={combination} 
                palette={variant.palette} 
                index={index} 
                size="medium"
              />
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div className="space-y-8 px-4 py-6 lg:px-6" data-dashboard-preview="true">
      {/* Modern Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-background/80 via-background/50 to-background/30 backdrop-blur-xl border border-border/50 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/20">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {dashboardTitle || "Vista Detallada del Dashboard"}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                      {variant.layout}
                    </Badge>
                    <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 text-xs px-2 py-0.5">
                      {variant.palette.name}
                    </Badge>
                  </div>
                </div>
              </div>
              {dashboardDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  {dashboardDescription}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 px-3 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
                <span className="text-xs font-semibold text-foreground">
                  {combinations.length} Visualizaciones
                </span>
              </div>
              <Button 
                onClick={handleDownloadPDF} 
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-1.5 px-4 text-xs"
              >
                <Download className="h-3 w-3" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {filterableVariables.length > 0 && (
        <div className="rounded-lg bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
                <Filter className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Filtros Dinámicos</h2>
                <p className="text-xs text-muted-foreground">Personaliza la vista de tus datos</p>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 h-7 px-2 text-xs"
              >
                <X className="h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filterableVariables.map((variable) => (
              <FilterCard
                key={variable.id}
                variable={variable}
                value={filters[variable.id] || "default"}
                onChange={(value) => handleFilterChange(variable.id, value)}
              />
            ))}
          </div>
        </div>
      )}

      {independentVariables.length > 0 && (
        <div className="rounded-lg bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent/15 to-primary/15 backdrop-blur-sm border border-accent/20">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Métricas Principales</h2>
              <p className="text-xs text-muted-foreground">Indicadores clave de rendimiento</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {independentVariables.map((variable, index) => (
              <IndependentVariableCard
                key={variable.id}
                variable={variable}
                color={variant.palette.colors[index % variant.palette.colors.length]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Layout Preview */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-background/80 via-background/50 to-background/30 backdrop-blur-xl border border-border/50 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
        
        {/* Layout Header */}
        <div className="relative border-b border-border/50 bg-gradient-to-r from-background/60 to-background/30 backdrop-blur-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/20">
                <BarChart3 className="h-3 w-3 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Vista Previa del Dashboard</h3>
                <p className="text-xs text-muted-foreground">Layout: {variant.layout} • {combinations.length} visualizaciones</p>
              </div>
            </div>
            
            {/* Información de calidad del layout */}
            {(() => {
              const divisions = getRealLayoutDivisions(variant.layout, variant.combinations.length)
              const quality = analyzeLayoutQuality(divisions)
              const { maxRows, maxColumns } = getGridDimensions(divisions)
              
              return (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/60 border border-border/30">
                    <span className="text-muted-foreground">Grid:</span>
                    <span className="font-medium text-foreground">{maxColumns}×{maxRows}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/60 border border-border/30">
                    <span className="text-muted-foreground">Uso:</span>
                    <span className={`font-medium ${
                      quality.spaceUtilization >= 70 ? 'text-green-600' : 
                      quality.spaceUtilization >= 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {quality.spaceUtilization}%
                    </span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Layout Content - Universal renderer that matches PDF exactly */}
        <div id="dashboard-layout-preview" className="relative p-4">
          {renderUniversalLayout(variant)}
        </div>
      </div>
    </div>
  )
}

function FilterCard({
  variable,
  value,
  onChange,
}: {
  variable: Variable
  value: string
  onChange: (value: string) => void
}) {
  const Icon = getIconForVariableType(variable.type)

  if (variable.type === "categorical" || variable.type === "binary") {
    const categories = generateCategoriesForVariable(variable)

    return (
      <Card className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">{variable.name}</span>
          </div>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-8 rounded-md border-border/50 bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70 hover:border-primary/30 transition-all duration-200 text-xs">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    )
  }

  if (variable.type === "temporal") {
    return (
      <Card className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">{variable.name}</span>
          </div>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-8 rounded-md border-border/50 bg-background/50 backdrop-blur-sm text-foreground hover:bg-background/70 hover:border-primary/30 transition-all duration-200 text-xs">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Todos los períodos</SelectItem>
              <SelectItem value="last-7-days">Últimos 7 días</SelectItem>
              <SelectItem value="last-30-days">Últimos 30 días</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
              <SelectItem value="last-year">Último año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    )
  }

  return null
}

function IndependentVariableCard({ variable, color }: { variable: Variable; color: string }) {
  const metric = generateMetricForVariable(variable)
  const Icon = getIconForVariableType(variable.type)

  return (
    <Card className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="absolute top-0 right-0 h-12 w-12 bg-gradient-to-br from-transparent via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-sm border border-primary/20">
              <Icon className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground capitalize">{metric.label}</span>
          </div>
        </div>
        
        <div className="space-y-0.5">
          <div 
            className="text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${color}, ${color}80)`
            }}
          >
            {metric.value}
          </div>
          <p className="text-xs font-medium text-foreground">{variable.name}</p>
          {metric.subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed">{metric.subtitle}</p>
          )}
        </div>

        {/* Decorative element */}
        <div 
          className="absolute bottom-0 right-0 h-0.5 w-full bg-gradient-to-r from-transparent opacity-30"
          style={{ 
            backgroundImage: `linear-gradient(90deg, transparent, ${color}40, ${color})`
          }}
        />
      </div>
    </Card>
  )
}

function generateMetricForVariable(variable: Variable): {
  value: string
  label: string
  subtitle?: string
} {
  switch (variable.type) {
    case "numeric": {
      // Generate simulated dataset
      const dataset = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10000) + 1000)

      // Calculate different aggregations
      const aggregations = [
        {
          label: "Total",
          value: dataset.reduce((a, b) => a + b, 0).toLocaleString(),
          subtitle: `Suma de ${dataset.length} registros`,
        },
        {
          label: "Promedio",
          value: Math.floor(dataset.reduce((a, b) => a + b, 0) / dataset.length).toLocaleString(),
          subtitle: `Media de ${dataset.length} registros`,
        },
        {
          label: "Mediana",
          value: calculateMedian(dataset).toLocaleString(),
          subtitle: `Valor central de ${dataset.length} registros`,
        },
        {
          label: "Desv. Estándar",
          value: calculateStdDev(dataset).toLocaleString(),
          subtitle: `Variabilidad de los datos`,
        },
      ]

      // Randomly select one aggregation type
      return aggregations[Math.floor(Math.random() * aggregations.length)]
    }

    case "categorical": {
      // Generate simulated data for categories
      const categories = generateCategoriesForVariable(variable)
      const categoryData = categories.map((cat) => ({
        name: cat,
        value: Math.floor(Math.random() * 50000) + 10000,
      }))

      // Find top category
      const topCategory = categoryData.reduce((max, current) => (current.value > max.value ? current : max))

      return {
        label: "Categoría Principal",
        value: topCategory.name,
        subtitle: `$${topCategory.value.toLocaleString()} en ventas`,
      }
    }

    case "percentage-progress": {
      const value = Math.floor(Math.random() * 40) + 50
      return {
        label: "Progreso",
        value: `${value}%`,
        subtitle: "Completado",
      }
    }

    case "percentage-ratio": {
      const value = Math.floor(Math.random() * 30) + 10
      return {
        label: "Proporción",
        value: `${value}%`,
        subtitle: "Del total",
      }
    }

    case "temporal": {
      return {
        label: "Período",
        value: new Date().toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
        subtitle: "Último actualizado",
      }
    }

    case "text": {
      return {
        label: "Estado",
        value: "Activo",
        subtitle: "Sistema operativo",
      }
    }

    case "binary": {
      const value = Math.random() < 0.7 // Simulate a 70% chance of being true
      return {
        label: "Estado",
        value: value ? "Sí" : "No",
        subtitle: "Valor binario",
      }
    }

    default:
      return {
        label: "Valor",
        value: "N/A",
      }
  }
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.floor((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

function calculateStdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.floor(Math.sqrt(variance))
}

function generateCategoriesForVariable(variable: Variable): string[] {
  const name = variable.name.toLowerCase()

  if (variable.type === "binary") {
    if (name.includes("activo") || name.includes("active")) {
      return ["Activo", "Inactivo"]
    }
    if (name.includes("estado") || name.includes("status")) {
      return ["Sí", "No"]
    }
    if (name.includes("aprobado") || name.includes("approved")) {
      return ["Aprobado", "Rechazado"]
    }
    if (name.includes("completado") || name.includes("completed")) {
      return ["Completado", "Pendiente"]
    }
    return ["Sí", "No"]
  }

  if (name.includes("categoria") || name.includes("category")) {
    return ["Electrónica", "Ropa", "Alimentos", "Hogar", "Deportes"]
  }
  if (name.includes("region") || name.includes("zona")) {
    return ["Norte", "Sur", "Este", "Oeste", "Centro"]
  }
  if (name.includes("producto") || name.includes("product")) {
    return ["Prod A", "Prod B", "Prod C", "Prod D", "Prod E"]
  }
  if (name.includes("tipo") || name.includes("type")) {
    return ["Tipo Premium", "Tipo Estándar", "Tipo Básico", "Tipo Especial"]
  }
  if (name.includes("canal") || name.includes("channel")) {
    return ["Online", "Tienda", "Móvil", "Tel", "Email"]
  }
  if (name.includes("cliente") || name.includes("customer")) {
    return ["Corp", "PYME", "Indiv", "Gob"]
  }

  return ["Cat A", "Cat B", "Cat C", "Cat D", "Cat E"]
}

function getIconForVariableType(type: Variable["type"]) {
  switch (type) {
    case "numeric":
      return Hash
    case "percentage-progress":
    case "percentage-ratio":
      return Percent
    case "categorical":
      return Tag
    case "binary":
      return ToggleLeft
    case "temporal":
      return Calendar
    default:
      return BarChart3
  }
}

function getIndependentVariables(variables: Variable[]): Variable[] {
  // These will display aggregations (sum, average, median, std dev) even if they're used in combinations
  return variables.filter(
    (v) => v.type === "numeric" || v.type === "percentage-progress" || v.type === "percentage-ratio",
  )
}

interface CombinationCardProps {
  combination: VariableCombination
  palette: LayoutVariant["palette"]
  index: number
  size: "small" | "medium" | "large"
}

function CombinationCard({ combination, palette, index, size }: CombinationCardProps) {
  const heightClass = size === "large" ? "h-96" : size === "medium" ? "h-80" : "h-64"
  const color = palette.colors[index % palette.colors.length]

  return (
    <Card className={`${heightClass} group relative overflow-hidden rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex h-full flex-col p-4">
        {/* Modern Header */}
        <div className="mb-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm border transition-all duration-200"
              style={{ 
                backgroundColor: `${color}15`,
                borderColor: `${color}30`
              }}
            >
              {getIconForChartType(combination.chartType, color)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">{combination.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {combination.numericVariable.name}
                {combination.categoricalVariable && ` • ${combination.categoricalVariable.name}`}
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs capitalize font-medium rounded-lg border-0 text-foreground/80"
            style={{ 
              backgroundColor: `${color}10`,
              color: color
            }}
          >
            {combination.chartType}
          </Badge>
        </div>

        {/* Chart Container - Optimizado para escalado */}
        <div className="flex-1 min-h-0 w-full rounded-lg bg-gradient-to-br from-background/60 to-background/20 backdrop-blur-sm border border-border/30 overflow-hidden">
          <div className={`w-full h-full ${
            combination.chartType === "progress" || combination.chartType === "metric" 
              ? "p-4" 
              : "p-2"
          }`}>
            {combination.chartType === "bar" && <BarChart color={color} combination={combination} size={size} />}
            {combination.chartType === "horizontal-bar" && (
              <HorizontalBarChart color={color} combination={combination} size={size} />
            )}
            {combination.chartType === "line" && <LineChart color={color} combination={combination} size={size} />}
            {combination.chartType === "area" && <AreaChart color={color} combination={combination} size={size} />}
            {combination.chartType === "pie" && (
              <PieChart colors={palette.colors} combination={combination} size={size} />
            )}
            {combination.chartType === "donut" && (
              <DonutChart colors={palette.colors} combination={combination} size={size} />
            )}
            {combination.chartType === "radial" && (
              <RadialChart colors={palette.colors} combination={combination} size={size} />
            )}
            {combination.chartType === "progress" && <ProgressBar color={color} size={size} />}
            {combination.chartType === "metric" && <MetricDisplay color={color} name={combination.name} size={size} />}
          </div>
        </div>

        {/* Subtle bottom gradient indicator */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-40"
          style={{ 
            background: `linear-gradient(90deg, transparent 20%, ${color}40 50%, transparent 80%)`
          }}
        />
      </div>
    </Card>
  )
}

function getIconForChartType(chartType: VariableCombination["chartType"], color?: string) {
  const iconClass = color ? "h-4 w-4" : "h-5 w-5 text-muted-foreground"
  const iconStyle = color ? { color } : {}

  switch (chartType) {
    case "bar":
      return <BarChart3 className={iconClass} style={iconStyle} />
    case "line":
    case "area":
      return <TrendingUp className={iconClass} style={iconStyle} />
    case "pie":
    case "donut":
      return <Users className={iconClass} style={iconStyle} />
    case "progress":
      return <Percent className={iconClass} style={iconStyle} />
    case "metric":
      return <Hash className={iconClass} style={iconStyle} />
    default:
      return <BarChart3 className={iconClass} style={iconStyle} />
  }
}

function BarChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateBarData(combination)
  const fontSize = size === "large" ? 13 : size === "medium" ? 11 : 9
  const barSize = size === "large" ? undefined : size === "medium" ? 25 : 18
  const margin =
    size === "large"
      ? { top: 10, right: 15, left: 15, bottom: 20 }
      : size === "medium"
        ? { top: 8, right: 12, left: 12, bottom: 15 }
        : { top: 5, right: 8, left: 8, bottom: 12 }

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
        />
        <YAxis
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
          width={size === "small" ? 35 : 45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={barSize} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

function LineChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateLineData(combination)
  const fontSize = size === "large" ? 13 : size === "medium" ? 11 : 9
  const strokeWidth = size === "large" ? 3 : 2
  const margin =
    size === "large"
      ? { top: 10, right: 15, left: 15, bottom: 20 }
      : size === "medium"
        ? { top: 8, right: 12, left: 12, bottom: 15 }
        : { top: 5, right: 8, left: 8, bottom: 12 }

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
        />
        <YAxis
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
          width={size === "small" ? 35 : 45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={{ fill: color, r: size === "small" ? 3 : 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

function AreaChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateLineData(combination)
  const fontSize = size === "large" ? 13 : size === "medium" ? 11 : 9
  const strokeWidth = size === "large" ? 3 : 2
  const margin =
    size === "large"
      ? { top: 10, right: 15, left: 15, bottom: 20 }
      : size === "medium"
        ? { top: 8, right: 12, left: 12, bottom: 15 }
        : { top: 5, right: 8, left: 8, bottom: 12 }

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
        />
        <YAxis
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
          width={size === "small" ? 35 : 45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={strokeWidth} fill={color} fillOpacity={0.2} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}

function PieChart({
  colors,
  combination,
  size,
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generatePieData(combination)
  // Radius adaptativo basado en porcentaje del contenedor disponible
  const outerRadius = size === "large" ? "80%" : size === "medium" ? "70%" : "60%"
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          dataKey="value"
          label={size === "large"}
          labelLine={size === "large"}
        >
          {data.map((entry, index) => {
            const fillColor = colors[index % colors.length]
            return <Cell key={`cell-${index}`} fill={fillColor} stroke="hsl(var(--border))" strokeWidth={1} />
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        {size !== "small" && (
          <Legend
            wrapperStyle={{
              fontSize: `${fontSize}px`,
              color: "hsl(var(--card-foreground))",
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

function DonutChart({
  colors,
  combination,
  size,
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generatePieData(combination)
  // Radios adaptativos basados en porcentaje del contenedor disponible
  const innerRadius = size === "large" ? "40%" : size === "medium" ? "35%" : "30%"
  const outerRadius = size === "large" ? "80%" : size === "medium" ? "70%" : "60%"
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          label={size === "large"}
          labelLine={size === "large"}
        >
          {data.map((entry, index) => {
            const fillColor = colors[index % colors.length]
            return <Cell key={`cell-${index}`} fill={fillColor} stroke="hsl(var(--border))" strokeWidth={1} />
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        {size !== "small" && (
          <Legend
            wrapperStyle={{
              fontSize: `${fontSize}px`,
              color: "hsl(var(--card-foreground))",
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

function generateBarData(combination: VariableCombination) {
  const categories = getCategoriesFromCombination(combination)
  return categories.map((cat) => ({
    name: cat,
    value: Math.floor(Math.random() * 5000) + 1000,
  }))
}

function generateLineData(combination: VariableCombination) {
  const timePoints = getTimePointsFromCombination(combination)
  return timePoints.map((point) => ({
    name: point,
    value: Math.floor(Math.random() * 5000) + 1000,
  }))
}

function generatePieData(combination: VariableCombination) {
  const categories = getCategoriesFromCombination(combination)
  return categories.map((cat) => ({
    name: cat,
    value: Math.floor(Math.random() * 100) + 20,
  }))
}

function getCategoriesFromCombination(combination: VariableCombination): string[] {
  // Extract categorical variable from combination
  const categoricalVar = combination.categoricalVariable

  if (categoricalVar) {
    return generateCategoriesForVariable(categoricalVar)
  }

  return ["Cat A", "Cat B", "Cat C", "Cat D", "Cat E"]
}

function getTimePointsFromCombination(combination: VariableCombination): string[] {
  // Check if any variable name suggests temporal data
  const numericName = combination.numericVariable.name.toLowerCase()
  const categoricalName = combination.categoricalVariable?.name.toLowerCase() || ""

  if (
    numericName.includes("mes") ||
    numericName.includes("month") ||
    categoricalName.includes("mes") ||
    categoricalName.includes("month")
  ) {
    return ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
  }
  if (
    numericName.includes("trimestre") ||
    numericName.includes("quarter") ||
    categoricalName.includes("trimestre") ||
    categoricalName.includes("quarter")
  ) {
    return ["Q1", "Q2", "Q3", "Q4"]
  }
  if (
    numericName.includes("año") ||
    numericName.includes("year") ||
    categoricalName.includes("año") ||
    categoricalName.includes("year")
  ) {
    return ["2020", "2021", "2022", "2023", "2024"]
  }
  if (
    numericName.includes("dia") ||
    numericName.includes("day") ||
    categoricalName.includes("dia") ||
    categoricalName.includes("day")
  ) {
    return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  }

  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
}

function ProgressBar({ color, size }: { color: string; size: "small" | "medium" | "large" }) {
  const value = Math.floor(Math.random() * 40) + 50 // 50-90%
  const textSize = size === "large" ? "text-5xl" : size === "medium" ? "text-4xl" : "text-3xl"
  const gapSize = size === "large" ? "gap-6" : size === "medium" ? "gap-4" : "gap-3"
  const padding = size === "large" ? "px-8" : size === "medium" ? "px-6" : "px-4"

  return (
    <div className={`flex h-full flex-col items-center justify-center ${gapSize} ${padding}`}>
      <div className="text-center">
        <div className={`${textSize} font-bold text-card-foreground`} style={{ color }}>
          {value}%
        </div>
        <p className={`mt-2 ${size === "large" ? "text-sm" : "text-xs"} font-medium text-card-foreground opacity-80`}>
          Progreso Actual
        </p>
      </div>
      <div className={`${size === "large" ? "h-4" : size === "medium" ? "h-3" : "h-2"} w-full overflow-hidden rounded-full bg-secondary`}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className={`flex w-full justify-between ${size === "large" ? "text-xs" : "text-xs"} font-medium text-card-foreground opacity-70`}>
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

function MetricDisplay({ color, name, size }: { color: string; name: string; size: "small" | "medium" | "large" }) {
  const value = Math.floor(Math.random() * 100000) + 10000
  const change = (Math.random() * 30 - 10).toFixed(1)
  const isPositive = Number.parseFloat(change) > 0
  
  const textSize = size === "large" ? "text-4xl" : size === "medium" ? "text-3xl" : "text-2xl"
  const padding = size === "large" ? "px-4" : size === "medium" ? "px-3" : "px-2"
  const cardPadding = size === "large" ? "p-4" : size === "medium" ? "p-3" : "p-2"
  const gapSize = size === "large" ? "gap-4" : "gap-3"

  return (
    <div className={`flex h-full flex-col justify-center ${gapSize} ${padding}`}>
      <div className={`rounded-lg border border-border bg-secondary/30 ${cardPadding}`}>
        <div className={`${textSize} font-bold text-card-foreground`} style={{ color }}>
          {value.toLocaleString()}
        </div>
        <p className={`mt-1 ${size === "large" ? "text-sm" : "text-xs"} font-medium text-card-foreground opacity-80`}>
          {name}
        </p>
      </div>
      <div className={`flex items-center gap-2 ${size === "large" ? "text-sm" : "text-xs"} font-medium`}>
        <TrendingUp className={`${size === "large" ? "h-4 w-4" : "h-3 w-3"} ${isPositive ? "text-green-500" : "text-red-500"}`} />
        <span className={`font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}
          {change}%
        </span>
        <span className="text-card-foreground opacity-70">vs mes anterior</span>
      </div>
    </div>
  )
}

function HorizontalBarChart({
  color,
  combination,
  size,
}: { color: string; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateBarData(combination)
  const fontSize = size === "large" ? 13 : size === "medium" ? 12 : 10
  const barSize = size === "large" ? undefined : size === "medium" ? 25 : 18
  const margin =
    size === "large"
      ? { top: 10, right: 30, left: 10, bottom: 10 }
      : size === "medium"
        ? { top: 5, right: 25, left: 5, bottom: 5 }
        : { top: 5, right: 20, left: 0, bottom: 5 }
  const yAxisWidth = size === "large" ? 90 : size === "medium" ? 80 : 70

  const axisColor = useAxisTextColor()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} layout="vertical" margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          type="number"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          tickMargin={5}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={axisColor}
          fontSize={fontSize}
          tick={{ fill: axisColor, fontSize }}
          axisLine={{ stroke: axisColor }}
          tickLine={{ stroke: axisColor }}
          width={yAxisWidth}
          tickMargin={5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={barSize} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

function RadialChart({
  colors,
  combination,
  size,
}: { colors: string[]; combination: VariableCombination; size: "small" | "medium" | "large" }) {
  const data = generateRadialData(combination, colors)
  const fontSize = size === "large" ? 12 : size === "medium" ? 11 : 10

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius={size === "large" ? "20%" : "25%"}
        outerRadius={size === "large" ? "90%" : "85%"}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          background={{ fill: "hsl(var(--muted))" }}
          dataKey="value"
          cornerRadius={10}
        />
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{
            fontSize: `${fontSize}px`,
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}

function generateRadialData(combination: VariableCombination, colors: string[]) {
  const categories = getCategoriesFromCombination(combination)
  return categories.slice(0, 5).map((cat, index) => ({
    name: cat,
    value: Math.floor(Math.random() * 80) + 20,
    fill: colors[index % colors.length],
  }))
}
