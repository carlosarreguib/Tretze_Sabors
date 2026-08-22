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
// Estilos
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // Cada etiqueta ocupa la mitad de una página A4 (421pt de alto aprox.)
  etiqueta: {
    height: "50%",
    padding: "28pt 32pt",
    flexDirection: "column",
    justifyContent: "space-between",
    borderBottom: "1pt dashed #ccc",
  },
  etiquetaUltima: {
    height: "50%",
    padding: "28pt 32pt",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  // Cabecera: logo + fecha
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  logo: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  logoAccent: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#d97706", // amber-600, tono cálido
  },
  fecha: {
    fontSize: 9,
    color: "#666",
    textAlign: "right",
    textTransform: "capitalize",
  },

  // Empresa + persona
  empresa: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  persona: {
    fontSize: 11,
    color: "#444",
    marginBottom: 14,
  },

  // Sección de alergenos
  seccion: {
    marginBottom: 10,
  },
  seccionTitulo: {
    fontSize: 7,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  alergenosPill: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  pill: {
    fontSize: 8,
    backgroundColor: "#fef3c7",
    color: "#92400e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#fcd34d",
  },
  sinAlergenos: {
    fontSize: 9,
    color: "#aaa",
    fontStyle: "italic",
  },

  // Notas / comentarios
  notas: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.4,
    borderLeft: "2pt solid #d1d5db",
    paddingLeft: 6,
  },

  // Platos
  platosLista: {
    gap: 3,
  },
  platoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  platoPunto: {
    fontSize: 10,
    color: "#d97706",
  },
  platoTexto: {
    fontSize: 10,
    color: "#1a1a1a",
  },

  // Línea divisoria entre secciones
  separador: {
    borderTop: "0.5pt solid #e5e7eb",
    marginBottom: 8,
    marginTop: 2,
  },
})

// ---------------------------------------------------------------------------
// Componente etiqueta individual
// ---------------------------------------------------------------------------
function Etiqueta({
  datos,
  esUltima,
}: {
  datos: DatosEtiqueta
  esUltima: boolean
}) {
  return (
    <View style={esUltima ? s.etiquetaUltima : s.etiqueta}>
      {/* Cabecera: logo + fecha */}
      <View style={s.cabecera}>
        <View>
          <Text>
            <Text style={s.logo}>Tretze</Text>
            <Text style={s.logoAccent}> Sabors</Text>
          </Text>
        </View>
        <Text style={s.fecha}>{datos.fecha}</Text>
      </View>

      {/* Empresa y persona */}
      <Text style={s.empresa}>{datos.empresa}</Text>
      {datos.persona && <Text style={s.persona}>{datos.persona}</Text>}

      <View style={s.separador} />

      {/* Platos */}
      <View style={s.seccion}>
        <Text style={s.seccionTitulo}>Menú seleccionado</Text>
        <View style={s.platosLista}>
          {datos.platos.map((plato, i) => (
            <View key={i} style={s.platoFila}>
              <Text style={s.platoPunto}>·</Text>
              <Text style={s.platoTexto}>{plato}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Alergenos */}
      <View style={s.seccion}>
        <Text style={s.seccionTitulo}>Alérgenos</Text>
        {datos.alergenos.length > 0 ? (
          <View style={s.alergenosPill}>
            {datos.alergenos.map((a) => (
              <Text key={a} style={s.pill}>
                {a}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={s.sinAlergenos}>Sin alergenos indicados</Text>
        )}
      </View>

      {/* Notas / comentarios */}
      {datos.notas && (
        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Comentarios</Text>
          <Text style={s.notas}>{datos.notas}</Text>
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Documento completo: 2 etiquetas por página A4
// ---------------------------------------------------------------------------
export function EtiquetasPdf({ etiquetas }: { etiquetas: DatosEtiqueta[] }) {
  // Agrupa de 2 en 2 para llenar páginas A4
  const paginas: DatosEtiqueta[][] = []
  for (let i = 0; i < etiquetas.length; i += 2) {
    paginas.push(etiquetas.slice(i, i + 2))
  }

  return (
    <Document>
      {paginas.map((par, pi) => (
        <Page key={pi} size="A4" style={s.page}>
          {par.map((datos, ei) => (
            <Etiqueta
              key={ei}
              datos={datos}
              esUltima={ei === par.length - 1}
            />
          ))}
        </Page>
      ))}
    </Document>
  )
}
