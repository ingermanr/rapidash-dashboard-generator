import { useEffect, useState } from "react"

// Hook to get axis text color that updates with theme changes
export const useAxisTextColor = () => {
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
