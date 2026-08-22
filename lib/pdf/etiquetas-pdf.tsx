import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

export type DatosEtiqueta = {
  /** Fecha de entrega legible: "miércoles, 20 de agosto" */
  fecha: string
  empresa: string
  persona: string | null
  alergenos: string[]
  notas: string | null
  platos: string[]
}

// ---------------------------------------------------------------------------
// A4 = 595 × 842 pt. 6 etiquetas: 3 columnas × 2 filas.
// Márgenes de página: 18pt. Separación entre celdas: 10pt.
// Ancho celda: (595 - 2×18 - 2×10) / 3 ≈ 173pt
// Alto celda:  (842 - 2×18 - 1×10) / 2 ≈ 389pt  → recortamos a 390pt
// ---------------------------------------------------------------------------
const PAG_MARGIN = 18
const GAP = 10
const CELL_W = (595 - 2 * PAG_MARGIN - 2 * GAP) / 3   // ≈ 173
const CELL_H = (842 - 2 * PAG_MARGIN - GAP) / 2        // ≈ 398

const s = StyleSheet.create({
  page: {
    padding: PAG_MARGIN,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },

  // Fila de la página: 3 etiquetas en horizontal
  fila: {
    flexDirection: "row",
    gap: GAP,
    height: CELL_H,
  },
  filaSep: {
    flexDirection: "row",
    gap: GAP,
    height: CELL_H,
    marginTop: GAP,
  },

  // Celda de etiqueta con borde punteado (simula línea de corte)
  etiqueta: {
    width: CELL_W,
    height: CELL_H,
    padding: 10,
    border: "1pt dashed #ccc",
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  // Logo
  logo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  logoAccent: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#d97706",
  },

  // Fecha
  fecha: {
    fontSize: 7,
    color: "#888",
    marginTop: 1,
    marginBottom: 6,
  },

  separador: {
    borderTop: "0.5pt solid #e5e7eb",
    marginBottom: 5,
  },

  // Empresa + persona
  empresa: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 1,
  },
  persona: {
    fontSize: 8,
    color: "#555",
    marginBottom: 5,
  },

  // Platos
  seccionTitulo: {
    fontSize: 6,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
    marginTop: 4,
  },
  platoFila: {
    flexDirection: "row",
    gap: 3,
    marginBottom: 1,
  },
  platoPunto: {
    fontSize: 8,
    color: "#d97706",
  },
  platoTexto: {
    fontSize: 8,
    color: "#1a1a1a",
    flex: 1,
  },

  // Alergenos
  alergenosWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
  },
  pill: {
    fontSize: 6,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#fcd34d",
  },
  sinAlergenos: {
    fontSize: 7,
    color: "#bbb",
    fontStyle: "italic",
  },

  // Notas
  notas: {
    fontSize: 7,
    color: "#666",
    lineHeight: 1.3,
    borderLeft: "1.5pt solid #d1d5db",
    paddingLeft: 4,
    marginTop: 2,
  },
})

// ---------------------------------------------------------------------------
// Componente de una etiqueta individual
// ---------------------------------------------------------------------------
function Etiqueta({ datos }: { datos: DatosEtiqueta }) {
  return (
    <View style={s.etiqueta}>
      {/* Logo */}
      <Text>
        <Text style={s.logo}>Tretze</Text>
        <Text style={s.logoAccent}> Sabors</Text>
      </Text>

      {/* Fecha */}
      <Text style={s.fecha}>{datos.fecha}</Text>

      <View style={s.separador} />

      {/* Empresa y persona */}
      <Text style={s.empresa}>{datos.empresa}</Text>
      {datos.persona && <Text style={s.persona}>{datos.persona}</Text>}

      {/* Platos */}
      <Text style={s.seccionTitulo}>Menú</Text>
      {datos.platos.map((plato, i) => (
        <View key={i} style={s.platoFila}>
          <Text style={s.platoPunto}>·</Text>
          <Text style={s.platoTexto}>{plato}</Text>
        </View>
      ))}

      {/* Alergenos */}
      <Text style={s.seccionTitulo}>Alérgenos</Text>
      {datos.alergenos.length > 0 ? (
        <View style={s.alergenosWrap}>
          {datos.alergenos.map((a) => (
            <Text key={a} style={s.pill}>{a}</Text>
          ))}
        </View>
      ) : (
        <Text style={s.sinAlergenos}>Sin alérgenos</Text>
      )}

      {/* Notas */}
      {datos.notas && (
        <>
          <Text style={s.seccionTitulo}>Comentarios</Text>
          <Text style={s.notas}>{datos.notas}</Text>
        </>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Documento completo: 6 etiquetas por página A4 (3 columnas × 2 filas)
// ---------------------------------------------------------------------------
export function EtiquetasPdf({ etiquetas }: { etiquetas: DatosEtiqueta[] }) {
  // Agrupa de 6 en 6
  const paginas: DatosEtiqueta[][] = []
  for (let i = 0; i < etiquetas.length; i += 6) {
    paginas.push(etiquetas.slice(i, i + 6))
  }

  return (
    <Document>
      {paginas.map((grupo, pi) => {
        const fila1 = grupo.slice(0, 3)
        const fila2 = grupo.slice(3, 6)
        // Rellenar fila2 con espaciadores si hay menos de 6
        while (fila2.length < 3) fila2.push(null as unknown as DatosEtiqueta)

        return (
          <Page key={pi} size="A4" style={s.page}>
            <View style={s.fila}>
              {fila1.map((datos, ei) => (
                <Etiqueta key={ei} datos={datos} />
              ))}
            </View>
            <View style={s.filaSep}>
              {fila2.map((datos, ei) =>
                datos ? (
                  <Etiqueta key={ei} datos={datos} />
                ) : (
                  <View key={ei} style={{ width: CELL_W }} />
                )
              )}
            </View>
          </Page>
        )
      })}
    </Document>
  )
}
