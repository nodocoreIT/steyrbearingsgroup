import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 16,
  },
  companyBlock: {
    gap: 2,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  companySubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  quoteLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'right',
  },
  quoteDate: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  // Client section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  clientDetail: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 2,
  },
  // Table
  table: {
    marginTop: 8,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderTop: '1 solid #e5e7eb',
    borderBottom: '1 solid #e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #f3f4f6',
  },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 10,
    color: '#1f2937',
  },
  tableCellMuted: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 1,
  },
  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTop: '2 solid #e5e7eb',
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginRight: 16,
  },
  totalAmount: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    minWidth: 100,
    textAlign: 'right',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

export interface QuotePDFProps {
  quoteId: string
  createdAt: Date | string
  clientName: string
  salespersonName: string
  items: Array<{
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  total: number
  notes?: string | null
}

export function QuotePDF({
  quoteId,
  createdAt,
  clientName,
  salespersonName,
  items,
  total,
  notes,
}: QuotePDFProps) {
  const dateStr = new Date(createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document
      title={`Quote ${quoteId.slice(0, 8).toUpperCase()}`}
      author="Seekingbusiness"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>Seekingbusiness</Text>
            <Text style={styles.companySubtitle}>Rodamientos y transmisiones industriales</Text>
          </View>
          <View>
            <Text style={styles.quoteLabel}>
              PRESUPUESTO #{quoteId.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.quoteDate}>Fecha: {dateStr}</Text>
          </View>
        </View>

        {/* Client info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.clientDetail}>Atendido por: {salespersonName}</Text>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio unit.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Subtotal</Text>
          </View>
          {/* Rows */}
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colProduct}>
                <Text style={styles.tableCell}>{item.productName}</Text>
                <Text style={styles.tableCellMuted}>{item.productSku}</Text>
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                ${item.unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                ${item.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.tableCell}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Seekingbusiness — Presupuesto válido por 30 días</Text>
          <Text style={styles.footerText}>
            {quoteId.slice(0, 8).toUpperCase()} — {dateStr}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
