"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        className="h-10 w-10 rounded-full border-2 border-border/60 bg-background/80 backdrop-blur-sm transition-all hover:bg-accent hover:border-accent-foreground/20 hover:scale-105"
        disabled
      >
        <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
        <span className="sr-only">Cargando tema</span>
      </Button>
    )
  }

  return (
    <Button 
      onClick={toggleTheme} 
      variant="outline" 
      size="icon" 
      className="group relative h-10 w-10 rounded-full border-2 border-border/60 bg-background/80 backdrop-blur-sm transition-all hover:bg-accent hover:border-accent-foreground/20 hover:scale-105 active:scale-95"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 group-hover:rotate-45 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 group-hover:-rotate-12 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        {theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      </span>
    </Button>
  )
}
