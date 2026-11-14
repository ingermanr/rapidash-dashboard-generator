import { CombinationCard } from "@/components/dashboard-preview/combination-card"
import { analyzeLayoutQuality, generateGridStyles, getComponentSize, getGridDimensions, getRealLayoutDivisions } from "@/lib/layout-engine"
import type { LayoutVariant } from "@/types/dashboard"

/** Renders a layout variant on the 12-column grid computed by the layout engine. */
export function DashboardGrid({ variant }: { variant: LayoutVariant }) {
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
