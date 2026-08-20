"use client"

import { useSyncExternalStore } from "react"

const CONSULTA = "(prefers-reduced-motion: reduce)"

function suscribirse(alCambiar: () => void) {
  const query = window.matchMedia(CONSULTA)
  query.addEventListener("change", alCambiar)
  return () => query.removeEventListener("change", alCambiar)
}

function snapshotCliente() {
  return window.matchMedia(CONSULTA).matches
}

function snapshotServidor() {
  return false
}

/**
 * Refleja `prefers-reduced-motion` del sistema, reactivo a cambios en vivo
 * (el usuario puede activarlo desde ajustes del SO sin recargar la página).
 *
 * Usa useSyncExternalStore, no useState+useEffect: el servidor no puede
 * conocer la preferencia real, así que necesita un snapshot fijo y
 * determinista (`false`) para que la hidratación nunca compare contra un
 * árbol distinto al que el cliente pintaría en su primer render. Con
 * useState, el efecto que corrige el valor tras montar llega un render
 * tarde, y ese desfase es exactamente lo que rompía tanto la hidratación
 * como el arranque del ScrollTrigger del collage.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(suscribirse, snapshotCliente, snapshotServidor)
}
