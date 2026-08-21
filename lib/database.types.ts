export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: { key: string; updated_at: string; value: Json }
        Insert: { key: string; updated_at?: string; value: Json }
        Update: { key?: string; updated_at?: string; value?: Json }
        Relationships: []
      }
      facturacion_config: {
        Row: { id: number; iva_rate_bps: number }
        Insert: { id?: number; iva_rate_bps?: number }
        Update: { id?: number; iva_rate_bps?: number }
        Relationships: []
      }
      factura_lineas: {
        Row: {
          categoria: Database["public"]["Enums"]["plato_categoria"] | null
          created_at: string
          created_by: string | null
          descripcion: string
          factura_id: string
          fecha: string
          id: string
          pedido_id: string | null
          pedido_item_id: string | null
          price_cents: number
          quantity: number
          subtotal_cents: number
          tipo: Database["public"]["Enums"]["factura_linea_tipo"]
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["plato_categoria"] | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          factura_id: string
          fecha: string
          id?: string
          pedido_id?: string | null
          pedido_item_id?: string | null
          price_cents: number
          quantity?: number
          subtotal_cents: number
          tipo: Database["public"]["Enums"]["factura_linea_tipo"]
        }
        Update: {
          categoria?: Database["public"]["Enums"]["plato_categoria"] | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          factura_id?: string
          fecha?: string
          id?: string
          pedido_id?: string | null
          pedido_item_id?: string | null
          price_cents?: number
          quantity?: number
          subtotal_cents?: number
          tipo?: Database["public"]["Enums"]["factura_linea_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "factura_lineas_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_lineas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_lineas_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_items"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          anio: number
          base_cents: number
          created_at: string
          factura_rectifica_id: string | null
          fecha_cierre: string | null
          fecha_emision: string | null
          fecha_pago: string | null
          estado: Database["public"]["Enums"]["factura_estado"]
          id: string
          iva_cents: number
          iva_rate_bps: number | null
          mes: number
          notes: string | null
          numero: string | null
          profile_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          anio: number
          base_cents?: number
          created_at?: string
          factura_rectifica_id?: string | null
          fecha_cierre?: string | null
          fecha_emision?: string | null
          fecha_pago?: string | null
          estado?: Database["public"]["Enums"]["factura_estado"]
          id?: string
          iva_cents?: number
          iva_rate_bps?: number | null
          mes: number
          notes?: string | null
          numero?: string | null
          profile_id: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          anio?: number
          base_cents?: number
          created_at?: string
          factura_rectifica_id?: string | null
          fecha_cierre?: string | null
          fecha_emision?: string | null
          fecha_pago?: string | null
          estado?: Database["public"]["Enums"]["factura_estado"]
          id?: string
          iva_cents?: number
          iva_rate_bps?: number | null
          mes?: number
          notes?: string | null
          numero?: string | null
          profile_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_factura_rectifica_id_fkey"
            columns: ["factura_rectifica_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          id: string
          menu_date: string
          menu_id: string
          plato_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_date: string
          menu_id: string
          plato_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_date?: string
          menu_id?: string
          plato_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus_semanales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_plato_id_fkey"
            columns: ["plato_id"]
            isOneToOne: false
            referencedRelation: "platos"
            referencedColumns: ["id"]
          },
        ]
      }
      menus_semanales: {
        Row: {
          anio: number
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          notes: string | null
          published_at: string | null
          semana_iso: number
          updated_at: string
        }
        Insert: {
          anio: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          notes?: string | null
          published_at?: string | null
          semana_iso: number
          updated_at?: string
        }
        Update: {
          anio?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          notes?: string | null
          published_at?: string | null
          semana_iso?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_semanales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          created_at: string
          id: string
          nombre_at_order: string
          pedido_id: string
          plato_id: string
          price_cents_at_order: number
          quantity: number
          subtotal_cents: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          nombre_at_order: string
          pedido_id: string
          plato_id: string
          price_cents_at_order: number
          quantity: number
          subtotal_cents?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          nombre_at_order?: string
          pedido_id?: string
          plato_id?: string
          price_cents_at_order?: number
          quantity?: number
          subtotal_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_plato_id_fkey"
            columns: ["plato_id"]
            isOneToOne: false
            referencedRelation: "platos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cancelled_at: string | null
          created_at: string
          delivery_date: string
          estado: Database["public"]["Enums"]["pedido_estado"]
          id: string
          notes: string | null
          profile_id: string
          slot_start: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          delivery_date: string
          estado?: Database["public"]["Enums"]["pedido_estado"]
          id?: string
          notes?: string | null
          profile_id: string
          slot_start: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          delivery_date?: string
          estado?: Database["public"]["Enums"]["pedido_estado"]
          id?: string
          notes?: string | null
          profile_id?: string
          slot_start?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platos: {
        Row: {
          alergenos: string[]
          categoria: Database["public"]["Enums"]["plato_categoria"]
          created_at: string
          descripcion: string | null
          id: string
          image_path: string | null
          is_active: boolean
          nombre: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          alergenos?: string[]
          categoria: Database["public"]["Enums"]["plato_categoria"]
          created_at?: string
          descripcion?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          nombre: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          alergenos?: string[]
          categoria?: Database["public"]["Enums"]["plato_categoria"]
          created_at?: string
          descripcion?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          nombre?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_postal_code: string | null
          company_name: string
          contact_name: string
          created_at: string
          delivery_address: string | null
          id: string
          is_active: boolean
          legal_name: string | null
          nif: string | null
          payment_method: Database["public"]["Enums"]["metodo_pago"]
          payment_notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_postal_code?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          delivery_address?: string | null
          id: string
          is_active?: boolean
          legal_name?: string | null
          nif?: string | null
          payment_method?: Database["public"]["Enums"]["metodo_pago"]
          payment_notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_postal_code?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          delivery_address?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          nif?: string | null
          payment_method?: Database["public"]["Enums"]["metodo_pago"]
          payment_notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_consumo_mensual: {
        Row: {
          anio: number
          categoria: Database["public"]["Enums"]["plato_categoria"] | null
          delivery_date: string
          mes: number
          nombre_at_order: string | null
          pedido_id: string | null
          pedido_item_id: string | null
          plato_id: string | null
          price_cents_at_order: number | null
          profile_id: string | null
          quantity: number | null
          subtotal_cents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cerrar_periodo_factura: {
        Args: { p_anio: number; p_mes: number; p_profile_id: string }
        Returns: string
      }
      cutoff_para: { Args: { p_delivery_date: string }; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      pedido_editable: { Args: { p_delivery_date: string }; Returns: boolean }
    }
    Enums: {
      app_role: "client" | "admin"
      factura_estado: "borrador" | "cerrada" | "emitida" | "pagada" | "anulada"
      factura_linea_tipo: "consumo" | "ajuste"
      metodo_pago: "transferencia" | "efectivo" | "domiciliacion"
      pedido_estado: "pendiente" | "confirmado" | "entregado" | "cancelado"
      plato_categoria: "primer" | "segundo" | "postre" | "bebida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]

// Alias de dominio, mas comodos de leer en los componentes
export type Perfil = Tables<"profiles">
export type Plato = Tables<"platos">
export type MenuSemanal = Tables<"menus_semanales">
export type MenuItem = Tables<"menu_items">
export type Pedido = Tables<"pedidos">
export type PedidoItem = Tables<"pedido_items">
export type Factura = Tables<"facturas">
export type FacturaLinea = Tables<"factura_lineas">
export type FacturacionConfig = Tables<"facturacion_config">
export type ConsumoMensual = Database["public"]["Views"]["v_consumo_mensual"]["Row"]

export type Categoria = Enums<"plato_categoria">
export type EstadoPedido = Enums<"pedido_estado">
export type MetodoPago = Enums<"metodo_pago">
export type Rol = Enums<"app_role">
export type EstadoFactura = Enums<"factura_estado">
export type TipoLineaFactura = Enums<"factura_linea_tipo">
