"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

/**
 * Conmutador claro/oscuro.
 *
 * `resolvedTheme` es undefined hasta que next-themes monta en el cliente y lee
 * el tema real, así que mientras tanto se pinta un hueco del mismo tamaño:
 * evita el salto de layout y que se muestre el icono equivocado un instante.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  if (!resolvedTheme) {
    return <div className="w-11 h-11" aria-hidden="true" />
  }

  const esOscuro = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(esOscuro ? "light" : "dark")}
      aria-label={esOscuro ? "Activar modo claro" : "Activar modo oscuro"}
      className="w-11 h-11 grid place-items-center rounded-full text-foreground hover:bg-muted transition-colors duration-200 cursor-pointer"
    >
      {esOscuro ? (
        <Sun className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  )
}
