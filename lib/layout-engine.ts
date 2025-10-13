import type { VariableCombination } from "@/types/dashboard"

/**
 * Layout Division - Representa la posición y tamaño de un componente en el grid
 */
export interface LayoutDivision {
  x: number      // Posición horizontal (0-11 en grid de 12 columnas)
  y: number      // Posición vertical (0-based)
  width: number  // Ancho en columnas del grid (1-12)
  height: number // Alto en filas del grid (1+)
}

/**
 * Grid Configuration - Configuración estándar del sistema de grid
 */
export const GRID_CONFIG = {
  COLUMNS: 12,           // Total de columnas en el grid
  MIN_COMPONENT_WIDTH: 3, // Ancho mínimo de un componente
  MIN_COMPONENT_HEIGHT: 1, // Alto mínimo de un componente
  DEFAULT_HEIGHT: 1,     // Alto por defecto
} as const

/**
 * Función centralizada para obtener las divisiones reales del layout
 * Esta es la única fuente de verdad para todos los layouts del sistema
 */
export function getRealLayoutDivisions(layout: string, combinationsCount: number): LayoutDivision[] {
  if (combinationsCount === 0) return []
  
  switch (layout) {
    case "Grid": {
      // Grid simple de 3 columnas
      const divisions: LayoutDivision[] = []
      for (let i = 0; i < combinationsCount; i++) {
        const col = i % 3
        const row = Math.floor(i / 3)
        divisions.push({ 
          x: col * 4, 
          y: row, 
          width: 4, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Hero + Grid": {
      const divisions: LayoutDivision[] = []
      // Primer elemento ocupa todo el ancho (hero)
      divisions.push({ x: 0, y: 0, width: 12, height: 2 })
      
      // Elementos restantes en grid de 3 columnas debajo
      for (let i = 1; i < combinationsCount; i++) {
        const col = (i - 1) % 3
        const row = Math.floor((i - 1) / 3) + 2
        divisions.push({ 
          x: col * 4, 
          y: row, 
          width: 4, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Compact Grid": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount <= 2) {
        // Layout simple de 2 columnas para 1-2 elementos
        for (let i = 0; i < combinationsCount; i++) {
          divisions.push({ 
            x: i * 6, 
            y: 0, 
            width: 6, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else {
        // Primer elemento destacado (2x2) + grid de 4 columnas para el resto
        divisions.push({ x: 0, y: 0, width: 6, height: 2 })
        
        for (let i = 1; i < combinationsCount; i++) {
          const adjustedIndex = i - 1
          const col = adjustedIndex % 2
          const row = Math.floor(adjustedIndex / 2)
          divisions.push({ 
            x: 6 + col * 3, 
            y: row, 
            width: 3, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Focus Grid": {
      const divisions: LayoutDivision[] = []
      // Área de enfoque grande (8/12 del ancho, 2 filas de alto)
      divisions.push({ x: 0, y: 0, width: 8, height: 2 })
      
      // Elementos en la columna lateral (4/12 del ancho)
      if (combinationsCount >= 2) {
        divisions.push({ x: 8, y: 0, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      if (combinationsCount >= 3) {
        divisions.push({ x: 8, y: 1, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      // Fila inferior para elementos restantes - usando valores enteros
      for (let i = 3; i < combinationsCount; i++) {
        const col = (i - 3) % 4
        const row = Math.floor((i - 3) / 4) + 2
        divisions.push({ 
          x: col * 3, 
          y: row, 
          width: 3, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "F-Pattern": {
      const divisions: LayoutDivision[] = []
      // Barra superior (ancho completo)
      divisions.push({ x: 0, y: 0, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
      
      if (combinationsCount >= 2) {
        // Segunda fila izquierda (2/3 del ancho)
        divisions.push({ x: 0, y: 1, width: 8, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      if (combinationsCount >= 3) {
        // Segunda fila derecha (1/3 del ancho)
        divisions.push({ x: 8, y: 1, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      // Elementos restantes en grid de 3 columnas
      let currentRow = 2
      for (let i = 3; i < combinationsCount; i++) {
        const col = (i - 3) % 3
        if (col === 0 && i > 3) currentRow++
        divisions.push({ 
          x: col * 4, 
          y: currentRow, 
          width: 4, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Z-Pattern": {
      const divisions: LayoutDivision[] = []
      // Fila superior (ancho completo)
      divisions.push({ x: 0, y: 0, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
      
      if (combinationsCount >= 2) {
        // Diagonal media (flujo visual derecha a izquierda)
        divisions.push({ x: 8, y: 1, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      if (combinationsCount >= 3) {
        divisions.push({ x: 4, y: 2, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      if (combinationsCount >= 4) {
        // Fila inferior (ancho completo)
        divisions.push({ x: 0, y: 3, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      // Elementos adicionales en patrón de grid
      for (let i = 4; i < combinationsCount; i++) {
        const col = (i - 4) % 3
        const row = Math.floor((i - 4) / 3) + 4
        divisions.push({ 
          x: col * 4, 
          y: row, 
          width: 4, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Asymmetric": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount === 1) {
        divisions.push({ x: 0, y: 0, width: 12, height: 2 })
      } else if (combinationsCount === 2) {
        divisions.push({ x: 0, y: 0, width: 6, height: 2 })
        divisions.push({ x: 6, y: 0, width: 6, height: 2 })
      } else {
        // Tarjeta destacada grande (2/3 del ancho, 2 filas)
        divisions.push({ x: 0, y: 0, width: 8, height: 2 })
        
        // Tarjetas laterales
        divisions.push({ x: 8, y: 0, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
        if (combinationsCount >= 3) {
          divisions.push({ x: 8, y: 1, width: 4, height: GRID_CONFIG.DEFAULT_HEIGHT })
        }
        
        // Elementos adicionales en grid debajo
        for (let i = 3; i < combinationsCount; i++) {
          const col = (i - 3) % 3
          const row = Math.floor((i - 3) / 3) + 2
          divisions.push({ 
            x: col * 4, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Split View": {
      const divisions: LayoutDivision[] = []
      const leftSide = Math.ceil(combinationsCount / 2)
      const rightSide = combinationsCount - leftSide
      
      // Columna izquierda
      for (let i = 0; i < leftSide; i++) {
        divisions.push({ x: 0, y: i, width: 6, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      // Columna derecha
      for (let i = 0; i < rightSide; i++) {
        divisions.push({ x: 6, y: i, width: 6, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      return divisions
    }

    case "Pyramid": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount === 1) {
        divisions.push({ x: 0, y: 0, width: 12, height: 2 })
      } else if (combinationsCount === 2) {
        divisions.push({ x: 0, y: 0, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
        divisions.push({ x: 0, y: 1, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
      } else if (combinationsCount === 3) {
        divisions.push({ x: 0, y: 0, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
        divisions.push({ x: 0, y: 1, width: 6, height: GRID_CONFIG.DEFAULT_HEIGHT })
        divisions.push({ x: 6, y: 1, width: 6, height: GRID_CONFIG.DEFAULT_HEIGHT })
      } else {
        // Superior (1 grande)
        divisions.push({ x: 0, y: 0, width: 12, height: GRID_CONFIG.DEFAULT_HEIGHT })
        
        // Medio (hasta 2 medianos)
        const middleCount = Math.min(2, combinationsCount - 1)
        for (let i = 1; i <= middleCount; i++) {
          divisions.push({ 
            x: (i - 1) * 6, 
            y: 1, 
            width: 6, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
        
        // Inferior (restantes en 3 columnas)
        for (let i = 3; i < combinationsCount; i++) {
          const col = (i - 3) % 3
          const row = Math.floor((i - 3) / 3) + 2
          divisions.push({ 
            x: col * 4, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Sidebar Focus": {
      const divisions: LayoutDivision[] = []
      const mainContentCount = Math.ceil(combinationsCount * 0.7)
      const sidebarCount = combinationsCount - mainContentCount
      
      // Contenido principal (primeros 70%)
      if (mainContentCount > 0) {
        divisions.push({ x: 0, y: 0, width: 9, height: GRID_CONFIG.DEFAULT_HEIGHT })
        
        for (let i = 1; i < mainContentCount; i++) {
          const col = (i - 1) % 2
          const row = Math.floor((i - 1) / 2) + 1
          divisions.push({ 
            x: col * 4, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      
      // Contenido del sidebar (30% restante)
      for (let i = 0; i < sidebarCount; i++) {
        divisions.push({ x: 9, y: i, width: 3, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      return divisions
    }

    case "Dashboard Classic": {
      const divisions: LayoutDivision[] = []
      // Fila superior de métricas (máximo 4)
      const topRowCount = Math.min(4, combinationsCount)
      for (let i = 0; i < topRowCount; i++) {
        divisions.push({ x: i * 3, y: 0, width: 3, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      // Elementos restantes en grid de 2 columnas
      for (let i = topRowCount; i < combinationsCount; i++) {
        const col = (i - topRowCount) % 2
        const row = Math.floor((i - topRowCount) / 2) + 1
        divisions.push({ 
          x: col * 6, 
          y: row, 
          width: 6, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Masonry": {
      const divisions: LayoutDivision[] = []
      for (let i = 0; i < combinationsCount; i++) {
        const pattern = i % 4
        const baseRow = Math.floor(i / 4) * 2
        
        if (pattern === 0) {
          // Tarjeta grande (2 columnas, 2 filas)
          divisions.push({ x: 0, y: baseRow, width: 6, height: 2 })
        } else if (pattern === 1) {
          divisions.push({ x: 6, y: baseRow, width: 3, height: GRID_CONFIG.DEFAULT_HEIGHT })
        } else if (pattern === 2) {
          divisions.push({ x: 9, y: baseRow, width: 3, height: GRID_CONFIG.DEFAULT_HEIGHT })
        } else {
          divisions.push({ x: 6, y: baseRow + 1, width: 6, height: GRID_CONFIG.DEFAULT_HEIGHT })
        }
      }
      return divisions
    }

    case "Column Flow": {
      const divisions: LayoutDivision[] = []
      // Distribución inteligente basada en cantidad de combinaciones
      let cols = 3
      if (combinationsCount <= 2) cols = 2
      else if (combinationsCount <= 6) cols = 3
      else if (combinationsCount <= 12) cols = 4
      else if (combinationsCount <= 20) cols = 5
      else cols = 6
      
      const cellWidth = Math.floor(GRID_CONFIG.COLUMNS / cols)
      
      for (let i = 0; i < combinationsCount; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        divisions.push({ 
          x: col * cellWidth, 
          y: row, 
          width: cellWidth, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Staggered": {
      const divisions: LayoutDivision[] = []
      for (let i = 0; i < combinationsCount; i++) {
        const pattern = i % 5
        const baseRow = Math.floor(i / 5)
        
        if (pattern < 3) {
          // Tarjetas pequeñas (2 columnas cada una)
          divisions.push({ 
            x: pattern * 4, 
            y: baseRow, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        } else {
          // Tarjetas medianas (3 columnas cada una)
          divisions.push({ 
            x: (pattern - 3) * 6, 
            y: baseRow + 1, 
            width: 6, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Pinned Sidebar": {
      const divisions: LayoutDivision[] = []
      const pinnedCount = Math.min(2, combinationsCount)
      
      // Elementos fijados a la izquierda
      for (let i = 0; i < pinnedCount; i++) {
        divisions.push({ x: 0, y: i, width: 3, height: GRID_CONFIG.DEFAULT_HEIGHT })
      }
      
      // Elementos flotantes a la derecha en grid de 3 columnas para llenar todo el espacio
      for (let i = pinnedCount; i < combinationsCount; i++) {
        const adjustedIndex = i - pinnedCount
        const col = adjustedIndex % 3
        const row = Math.floor(adjustedIndex / 3)
        divisions.push({ 
          x: 3 + col * 3, 
          y: row, 
          width: 3, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Golden Ratio": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount === 1) {
        divisions.push({ x: 0, y: 0, width: 12, height: 2 })
      } else if (combinationsCount === 2) {
        // Proporción áurea: 8:4
        divisions.push({ x: 0, y: 0, width: 8, height: 2 })
        divisions.push({ x: 8, y: 0, width: 4, height: 2 })
      } else {
        // Elemento principal con proporción áurea
        divisions.push({ x: 0, y: 0, width: 8, height: 2 })
        
        // Elementos secundarios en la sección menor (4 columnas de ancho, divididas en bloques de 4)
        const remainingCount = combinationsCount - 1
        for (let i = 0; i < remainingCount; i++) {
          const row = i
          divisions.push({ 
            x: 8, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Magazine Layout": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount <= 3) {
        // Layout de revista simple
        divisions.push({ x: 0, y: 0, width: 8, height: 2 }) // Artículo principal
        if (combinationsCount >= 2) {
          divisions.push({ x: 8, y: 0, width: 4, height: 1 }) // Secundario superior
        }
        if (combinationsCount >= 3) {
          divisions.push({ x: 8, y: 1, width: 4, height: 1 }) // Secundario inferior
        }
      } else {
        // Layout complejo estilo revista
        divisions.push({ x: 0, y: 0, width: 6, height: 2 }) // Principal
        divisions.push({ x: 6, y: 0, width: 3, height: 1 }) // Lateral superior
        divisions.push({ x: 9, y: 0, width: 3, height: 1 }) // Lateral superior derecha
        divisions.push({ x: 6, y: 1, width: 6, height: 1 }) // Barra inferior
        
        // Elementos adicionales en grid
        for (let i = 4; i < combinationsCount; i++) {
          const col = (i - 4) % 3
          const row = Math.floor((i - 4) / 3) + 2
          divisions.push({ 
            x: col * 4, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Dashboard Grid": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount <= 4) {
        // Grid 2x2 optimizado
        const positions = [
          { x: 0, y: 0, width: 6, height: 1 },
          { x: 6, y: 0, width: 6, height: 1 },
          { x: 0, y: 1, width: 6, height: 1 },
          { x: 6, y: 1, width: 6, height: 1 }
        ]
        for (let i = 0; i < combinationsCount; i++) {
          divisions.push(positions[i])
        }
      } else if (combinationsCount <= 6) {
        // Grid 3x2 
        const positions = [
          { x: 0, y: 0, width: 4, height: 1 },
          { x: 4, y: 0, width: 4, height: 1 },
          { x: 8, y: 0, width: 4, height: 1 },
          { x: 0, y: 1, width: 4, height: 1 },
          { x: 4, y: 1, width: 4, height: 1 },
          { x: 8, y: 1, width: 4, height: 1 }
        ]
        for (let i = 0; i < combinationsCount; i++) {
          divisions.push(positions[i])
        }
      } else if (combinationsCount <= 12) {
        // Grid denso 4 columnas
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 4
          const row = Math.floor(i / 4)
          divisions.push({ 
            x: col * 3, 
            y: row, 
            width: 3, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else if (combinationsCount <= 20) {
        // Grid súper denso 6 columnas para 13-20 elementos (2 columnas de ancho cada una)
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 6
          const row = Math.floor(i / 6)
          divisions.push({ 
            x: col * 2, 
            y: row, 
            width: 2, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else {
        // Grid ultra denso 6 columnas para 20+ elementos
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 6
          const row = Math.floor(i / 6)
          divisions.push({ 
            x: col * 2, 
            y: row, 
            width: 2, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Newspaper": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount === 1) {
        divisions.push({ x: 0, y: 0, width: 12, height: 2 })
      } else if (combinationsCount === 2) {
        divisions.push({ x: 0, y: 0, width: 12, height: 1 }) // Titular principal
        divisions.push({ x: 0, y: 1, width: 12, height: 1 }) // Subtítulo
      } else {
        divisions.push({ x: 0, y: 0, width: 12, height: 1 }) // Titular principal
        divisions.push({ x: 0, y: 1, width: 6, height: 1 })  // Columna izquierda
        divisions.push({ x: 6, y: 1, width: 6, height: 1 })  // Columna derecha
        
        // Artículos adicionales en 3 columnas
        for (let i = 3; i < combinationsCount; i++) {
          const col = (i - 3) % 3
          const row = Math.floor((i - 3) / 3) + 2
          divisions.push({ 
            x: col * 4, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Mosaic": {
      const divisions: LayoutDivision[] = []
      // Patrón de mosaico irregular pero balanceado
      const patterns = [
        [{ x: 0, y: 0, width: 6, height: 2 }, { x: 6, y: 0, width: 3, height: 1 }, { x: 9, y: 0, width: 3, height: 1 }, { x: 6, y: 1, width: 6, height: 1 }],
        [{ x: 0, y: 0, width: 4, height: 1 }, { x: 4, y: 0, width: 8, height: 1 }, { x: 0, y: 1, width: 6, height: 1 }, { x: 6, y: 1, width: 6, height: 1 }],
        [{ x: 0, y: 0, width: 3, height: 2 }, { x: 3, y: 0, width: 6, height: 1 }, { x: 9, y: 0, width: 3, height: 2 }, { x: 3, y: 1, width: 6, height: 1 }]
      ]
      
      const patternIndex = combinationsCount % patterns.length
      const selectedPattern = patterns[patternIndex]
      
      for (let i = 0; i < Math.min(combinationsCount, selectedPattern.length); i++) {
        divisions.push(selectedPattern[i])
      }
      
      // Elementos adicionales en grid regular
      for (let i = selectedPattern.length; i < combinationsCount; i++) {
        const col = (i - selectedPattern.length) % 3
        const row = Math.floor((i - selectedPattern.length) / 3) + 2
        divisions.push({ 
          x: col * 4, 
          y: row, 
          width: 4, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }

    case "Accordion": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount <= 6) {
        // Diseño acordeón vertical
        for (let i = 0; i < combinationsCount; i++) {
          const height = i === 0 ? 2 : 1 // Primer elemento más alto
          const y = i === 0 ? 0 : (i - 1) + 2
          divisions.push({ 
            x: 0, 
            y: y, 
            width: 12, 
            height: height 
          })
        }
      } else {
        // Acordeón con columnas para más elementos
        const leftColumn = Math.ceil(combinationsCount / 2)
        for (let i = 0; i < leftColumn; i++) {
          divisions.push({ 
            x: 0, 
            y: i, 
            width: 6, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
        for (let i = leftColumn; i < combinationsCount; i++) {
          divisions.push({ 
            x: 6, 
            y: i - leftColumn, 
            width: 6, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Spotlight": {
      const divisions: LayoutDivision[] = []
      if (combinationsCount === 1) {
        divisions.push({ x: 0, y: 0, width: 12, height: 3 }) // Elemento destacado grande
      } else {
        // Elemento principal en spotlight
        divisions.push({ x: 0, y: 0, width: 9, height: 2 })
        
        // Elementos secundarios en columna lateral
        const sidebarCount = Math.min(2, combinationsCount - 1)
        for (let i = 0; i < sidebarCount; i++) {
          divisions.push({ 
            x: 9, 
            y: i, 
            width: 3, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
        
        // Elementos adicionales en fila inferior
        for (let i = 1 + sidebarCount; i < combinationsCount; i++) {
          const col = (i - 1 - sidebarCount) % 4
          const row = Math.floor((i - 1 - sidebarCount) / 4) + 2
          divisions.push({ 
            x: col * 3, 
            y: row, 
            width: 3, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Tile Grid": {
      const divisions: LayoutDivision[] = []
      // Grid de azulejos con tamaños variados pero organizados
      if (combinationsCount <= 4) {
        // Patrón 2x2 con tamaños iguales
        const positions = [
          { x: 0, y: 0, width: 6, height: 2 },
          { x: 6, y: 0, width: 6, height: 2 },
          { x: 0, y: 2, width: 6, height: 2 },
          { x: 6, y: 2, width: 6, height: 2 }
        ]
        for (let i = 0; i < combinationsCount; i++) {
          divisions.push(positions[i])
        }
      } else {
        // Patrón mixto con elementos de diferentes tamaños
        divisions.push({ x: 0, y: 0, width: 4, height: 2 }) // Grande
        divisions.push({ x: 4, y: 0, width: 4, height: 1 }) // Mediano superior
        divisions.push({ x: 8, y: 0, width: 4, height: 1 }) // Mediano superior
        divisions.push({ x: 4, y: 1, width: 8, height: 1 }) // Ancho inferior
        
        // Elementos adicionales en grid pequeño
        for (let i = 4; i < combinationsCount; i++) {
          const col = (i - 4) % 4
          const row = Math.floor((i - 4) / 4) + 2
          divisions.push({ 
            x: col * 3, 
            y: row, 
            width: 3, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Ultra Dense Grid": {
      const divisions: LayoutDivision[] = []
      // Layout especializado para 20+ elementos
      if (combinationsCount <= 24) {
        // Grid 6 columnas para hasta 24 elementos
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 6
          const row = Math.floor(i / 6)
          divisions.push({ 
            x: col * 2, 
            y: row, 
            width: 2, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else if (combinationsCount <= 36) {
        // Grid 6 columnas con altura reducida para máxima densidad
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 6
          const row = Math.floor(i / 6)
          divisions.push({ 
            x: col * 2, 
            y: row, 
            width: 2, 
            height: 1
          })
        }
      } else {
        // Grid ultra compacto para más de 36 elementos
        const cols = Math.min(12, Math.ceil(Math.sqrt(combinationsCount)))
        const cellWidth = Math.floor(12 / cols)
        
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % cols
          const row = Math.floor(i / cols)
          divisions.push({ 
            x: col * cellWidth, 
            y: row, 
            width: cellWidth, 
            height: 1
          })
        }
      }
      return divisions
    }

    case "Adaptive Flow": {
      const divisions: LayoutDivision[] = []
      
      // Layout que se adapta inteligentemente al número de combinaciones
      if (combinationsCount <= 3) {
        // Pocos elementos: layout espacioso
        for (let i = 0; i < combinationsCount; i++) {
          divisions.push({ 
            x: 0, 
            y: i * 2, 
            width: 12, 
            height: 1 
          })
        }
      } else if (combinationsCount <= 8) {
        // Elementos moderados: 2 columnas
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 2
          const row = Math.floor(i / 2)
          divisions.push({ 
            x: col * 6, 
            y: row, 
            width: 6, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else if (combinationsCount <= 15) {
        // Muchos elementos: 3 columnas
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 3
          const row = Math.floor(i / 3)
          divisions.push({ 
            x: col * 4, 
            y: row, 
            width: 4, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else if (combinationsCount <= 24) {
        // Alta densidad: 4 columnas
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 4
          const row = Math.floor(i / 4)
          divisions.push({ 
            x: col * 3, 
            y: row, 
            width: 3, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      } else {
        // Ultra alta densidad: 6 columnas
        for (let i = 0; i < combinationsCount; i++) {
          const col = i % 6
          const row = Math.floor(i / 6)
          divisions.push({ 
            x: col * 2, 
            y: row, 
            width: 2, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    case "Hierarchical Dense": {
      const divisions: LayoutDivision[] = []
      
      if (combinationsCount <= 3) {
        // Layout jerárquico simple
        divisions.push({ x: 0, y: 0, width: 12, height: 2 }) // Principal
        if (combinationsCount >= 2) {
          divisions.push({ x: 0, y: 2, width: 6, height: 1 })
        }
        if (combinationsCount >= 3) {
          divisions.push({ x: 6, y: 2, width: 6, height: 1 })
        }
      } else {
        // Elemento principal destacado
        divisions.push({ x: 0, y: 0, width: 8, height: 2 })
        
        // Elementos secundarios en sidebar
        const sidebarCount = Math.min(4, combinationsCount - 1)
        for (let i = 0; i < sidebarCount; i++) {
          const row = Math.floor(i / 2)
          const col = i % 2
          divisions.push({ 
            x: 8 + col * 2, 
            y: row, 
            width: 2, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
        
        // Resto en grid denso
        const remainingStart = sidebarCount + 1
        for (let i = remainingStart; i < combinationsCount; i++) {
          const adjustedIndex = i - remainingStart
          const cols = combinationsCount > 20 ? 6 : 4
          const cellWidth = Math.floor(12 / cols)
          
          const col = adjustedIndex % cols
          const row = Math.floor(adjustedIndex / cols) + 2
          divisions.push({ 
            x: col * cellWidth, 
            y: row, 
            width: cellWidth, 
            height: GRID_CONFIG.DEFAULT_HEIGHT 
          })
        }
      }
      return divisions
    }

    default: {
      // Fallback a grid inteligente mejorado con soporte para alta densidad
      const divisions: LayoutDivision[] = []
      
      // Determinar el mejor grid basado en la cantidad
      let cols = 3 // Default
      if (combinationsCount <= 2) cols = 2
      else if (combinationsCount <= 6) cols = 3
      else if (combinationsCount <= 12) cols = 4
      else if (combinationsCount <= 20) cols = 5
      else if (combinationsCount <= 30) cols = 6
      else cols = Math.min(12, Math.ceil(Math.sqrt(combinationsCount)))
      
      const cellWidth = Math.floor(GRID_CONFIG.COLUMNS / cols)
      
      for (let i = 0; i < combinationsCount; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        divisions.push({ 
          x: col * cellWidth, 
          y: row, 
          width: cellWidth, 
          height: GRID_CONFIG.DEFAULT_HEIGHT 
        })
      }
      return divisions
    }
  }
}

/**
 * Función para generar estilos CSS Grid consistentes
 * Utiliza la sintaxis estándar CSS Grid para máxima compatibilidad
 */
export function generateGridStyles(division: LayoutDivision) {
  return {
    gridColumn: `${Math.round(division.x) + 1} / ${Math.round(division.x + division.width) + 1}`,
    gridRow: `${division.y + 1} / ${division.y + (division.height || GRID_CONFIG.DEFAULT_HEIGHT) + 1}`,
  }
}

/**
 * Función para calcular el tamaño de los componentes basado en las divisiones
 */
export function getComponentSize(division: LayoutDivision): "small" | "medium" | "large" {
  if (division.width >= 8) return "large"
  if (division.width >= 6) return "medium"
  return "small"
}

/**
 * Función para calcular las dimensiones máximas del grid
 */
export function getGridDimensions(divisions: LayoutDivision[]) {
  if (divisions.length === 0) return { maxRows: 1, maxColumns: GRID_CONFIG.COLUMNS }
  
  const maxRow = Math.max(...divisions.map(d => d.y + (d.height || GRID_CONFIG.DEFAULT_HEIGHT)))
  const maxCol = GRID_CONFIG.COLUMNS // Siempre usamos 12 columnas
  
  return { maxRows: maxRow, maxColumns: maxCol }
}

/**
 * Función para validar que las divisiones sean válidas
 */
export function validateLayoutDivisions(divisions: LayoutDivision[]): boolean {
  return divisions.every(division => {
    return (
      division.x >= 0 &&
      division.y >= 0 &&
      division.width > 0 &&
      division.height > 0 &&
      division.x + division.width <= GRID_CONFIG.COLUMNS
    )
  })
}

/**
 * Calcula el aprovechamiento del espacio de un layout (0-100%)
 */
export function calculateSpaceUtilization(divisions: LayoutDivision[]): number {
  if (divisions.length === 0) return 0
  
  const { maxRows } = getGridDimensions(divisions)
  const totalAvailableSpace = GRID_CONFIG.COLUMNS * maxRows
  const usedSpace = divisions.reduce((sum, div) => sum + (div.width * div.height), 0)
  
  return Math.round((usedSpace / totalAvailableSpace) * 100)
}

/**
 * Verifica si hay solapamientos entre divisiones
 */
export function hasOverlaps(divisions: LayoutDivision[]): boolean {
  for (let i = 0; i < divisions.length; i++) {
    for (let j = i + 1; j < divisions.length; j++) {
      const div1 = divisions[i]
      const div2 = divisions[j]
      
      // Verificar solapamiento horizontal y vertical
      const horizontalOverlap = !(div1.x + div1.width <= div2.x || div2.x + div2.width <= div1.x)
      const verticalOverlap = !(div1.y + div1.height <= div2.y || div2.y + div2.height <= div1.y)
      
      if (horizontalOverlap && verticalOverlap) {
        return true
      }
    }
  }
  return false
}

/**
 * Analiza la calidad de distribución de un layout
 */
export function analyzeLayoutQuality(divisions: LayoutDivision[]): {
  spaceUtilization: number
  hasOverlaps: boolean
  isValid: boolean
  balance: number
  variety: number
} {
  const spaceUtilization = calculateSpaceUtilization(divisions)
  const overlaps = hasOverlaps(divisions)
  const isValid = validateLayoutDivisions(divisions)
  
  // Calcular balance (qué tan equilibrada está la distribución)
  const areas = divisions.map(d => d.width * d.height)
  const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length
  const variance = areas.reduce((sum, area) => sum + Math.pow(area - avgArea, 2), 0) / areas.length
  const balance = Math.max(0, 100 - (variance / avgArea) * 10)
  
  // Calcular variedad (diversidad de tamaños)
  const uniqueSizes = new Set(areas).size
  const variety = Math.min(100, (uniqueSizes / divisions.length) * 100)
  
  return {
    spaceUtilization,
    hasOverlaps: overlaps,
    isValid,
    balance: Math.round(balance),
    variety: Math.round(variety)
  }
}