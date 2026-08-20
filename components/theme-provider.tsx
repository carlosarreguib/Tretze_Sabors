"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"
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

const suscribirseNulo = () => () => {}

/**
 * True solo tras la hidratación en el cliente.
 *
 * El servidor no puede saber el tema real (depende de localStorage), así que
 * su snapshot es siempre `false`; el del cliente es siempre `true`. Usar
 * useSyncExternalStore en vez de useState+useEffect evita el patrón que
 * dispara "setState en efecto" y dejar pasar un frame con el HTML del
 * servidor y el del cliente en desacuerdo (el error de hidratación real que
 * producía el flicker del icono).
 */
function useMontadoEnCliente() {
  return useSyncExternalStore(
    suscribirseNulo,
    () => true,
    () => false,
  )
}

/**
 * Conmutador claro/oscuro.
 *
 * Hasta que se confirma el montaje en cliente no se conoce el tema real, así
 * que se pinta un hueco del mismo tamaño: evita el salto de layout y que se
 * muestre el icono equivocado durante un instante.
 */
export function ThemeToggle() {
  const montado = useMontadoEnCliente()
  const { resolvedTheme, setTheme } = useTheme()

  if (!montado) {
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
