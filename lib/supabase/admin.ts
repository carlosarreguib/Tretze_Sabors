import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

/**
 * Cliente Supabase con service role key.
 * Solo para Server Actions que ya hayan validado exigirAdmin().
 * Nunca exponer al cliente ni usar en componentes de cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
