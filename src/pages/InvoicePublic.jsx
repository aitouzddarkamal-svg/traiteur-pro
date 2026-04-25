import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const S = {
  page: {
    minHeight: '100vh',
    background: '#f4f6f9',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '40px 20px',
  },
  container: {
    maxWidth: 780,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '36px 40px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#e2b96f',
    marginBottom: 4,
  },
  businessInfo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.8,
  },
  invoiceMeta: {
    textAlign: 'right',
  },
  invoiceLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 26,
    fontWeight: 700,
    color: '#e2b96f',
  },
  statusBadge: (status) => ({
    display: 'inline-block',
    marginTop: 8,
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background:
      status === 'paid' ? '#22c55e22' :
      status === 'sent' ? '#3b82f622' : '#f59e0b22',
    color:
      status === 'paid' ? '#22c55e' :
      status === 'sent' ? '#3b82f6' : '#f59e0b',
    border: `1px solid ${
      status === 'paid' ? '#22c55e' :
      status === 'sent' ? '#3b82f6' : '#f59e0b'
    }`,
  }),
  body: {
    padding: '36px 40px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#9ca3af',
    fontWeight: 600,
    marginBottom: 8,
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 6,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 1.7,
  },
  dateRow: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    display: 'flex',
    gap: 8,
  },
  dateLabel: {
    color: '#9ca3af',
    minWidth: 90,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 28,
  },
  th: {
    background: '#f9fafb',
    padding: '10px 14px',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#9ca3af',
    fontWeight: 600,
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
  },
  thRight: {
    textAlign: 'right',
  },
  td: {
    padding: '13px 14px',
    fontSize: 14,
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  },
  tdRight: {
    textAlign: 'right',
  },
  tdDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 3,
  },
  totals: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 36,
  },
  totalsBox: {
    width: 300,
    background: '#f9fafb',
    borderRadius: 8,
    padding: '20px 24px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: 14,
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
  },
  totalRowFinal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    fontSize: 17,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  notes: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 8,
    padding: '14px 18px',
    fontSize: 13,
    color: '#92400e',
    marginBottom: 24,
  },
  notesLabel: {
    fontWeight: 600,
    marginBottom: 4,
  },
  footer: {
    textAlign: 'center',
    padding: '20px 40px 32px',
    fontSize: 12,
    color: '#9ca3af',
    borderTop: '1px solid #f0f0f0',
    lineHeight: 1.8,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
    color: '#6b7280',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #e2b96f',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    textAlign: 'center',
    padding: 60,
    color: '#ef4444',
    fontSize: 15,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
}

const STATUS_LABELS = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  cancelled: 'Annulée',
}

export default function InvoicePublic() {
  const { token } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadInvoice()
  }, [token])

  async function loadInvoice() {
    try {
      // Fetch invoice by token (public policy allows this)
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('*, clients(name, email, phone, address)')
        .eq('token', token)
        .single()

      if (invErr || !inv) {
        setError('Facture introuvable ou lien invalide.')
        setLoading(false)
        return
      }

      // Fetch invoice items
      const { data: invItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', inv.id)
        .order('id')

      // Fetch business profile
      const { data: biz } = await supabase
        .from('business_profiles')
        .select('business_name, tagline, primary_color, phone, address, ice, if_number, rc')
        .eq('business_id', inv.business_id)
        .single()

      setInvoice(inv)
      setItems(invItems || [])
      setBusiness(biz)
    } catch (e) {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  function formatAmount(n) {
    return Number(n || 0).toLocaleString('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' MAD'
  }

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0)
  const tvaRate = invoice?.tva_rate || 0
  const tvaAmount = subtotal * (tvaRate / 100)
  const total = subtotal + tvaAmount - (invoice?.discount || 0)

  if (loading) {
    return (
      <div style={S.page}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={S.loading}>
          <div style={S.spinner} />
          <span>Chargement de la facture…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={S.page}>
        <div style={S.container}>
          <div style={S.error}>
            <div style={S.errorIcon}>🔍</div>
            <div>{error}</div>
          </div>
        </div>
      </div>
    )
  }

  const client = invoice.clients || {}
  const accentColor = business?.primary_color || '#e2b96f'

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ ...S.brand, color: accentColor }}>
              {business?.business_name || 'Traiteur'}
            </div>
            {business?.tagline && (
              <div style={{ ...S.businessInfo, fontSize: 12, marginBottom: 6 }}>
                {business.tagline}
              </div>
            )}
            <div style={S.businessInfo}>
              {business?.address && <div>{business.address}</div>}
              {business?.phone && <div>Tél: {business.phone}</div>}
              {business?.ice && <div>ICE: {business.ice}</div>}
              {business?.if_number && <div>IF: {business.if_number}</div>}
              {business?.rc && <div>RC: {business.rc}</div>}
            </div>
          </div>
          <div style={S.invoiceMeta}>
            <div style={S.invoiceLabel}>Facture</div>
            <div style={{ ...S.invoiceNumber, color: accentColor }}>
              #{invoice.invoice_number || invoice.id?.slice(0, 8).toUpperCase()}
            </div>
            <div style={S.statusBadge(invoice.status)}>
              {STATUS_LABELS[invoice.status] || invoice.status}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          {/* Client + Dates */}
          <div style={S.twoCol}>
            <div>
              <div style={S.sectionLabel}>Facturé à</div>
              <div style={S.clientName}>{client.name || '—'}</div>
              <div style={S.clientDetail}>
                {client.email && <div>{client.email}</div>}
                {client.phone && <div>{client.phone}</div>}
                {client.address && <div>{client.address}</div>}
              </div>
            </div>
            <div>
              <div style={S.sectionLabel}>Détails</div>
              <div style={S.dateRow}>
                <span style={S.dateLabel}>Date :</span>
                <span>{formatDate(invoice.issue_date || invoice.created_at?.split('T')[0])}</span>
              </div>
              {invoice.due_date && (
                <div style={S.dateRow}>
                  <span style={S.dateLabel}>Échéance :</span>
                  <span>{formatDate(invoice.due_date)}</span>
                </div>
              )}
              {invoice.event_date && (
                <div style={S.dateRow}>
                  <span style={S.dateLabel}>Événement :</span>
                  <span>{formatDate(invoice.event_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Désignation</th>
                <th style={{ ...S.th, ...S.thRight }}>Qté</th>
                <th style={{ ...S.th, ...S.thRight }}>Prix unit.</th>
                <th style={{ ...S.th, ...S.thRight }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#9ca3af' }}>
                    Aucun article
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i}>
                    <td style={S.td}>
                      <div>{item.description || item.name}</div>
                      {item.note && <div style={S.tdDesc}>{item.note}</div>}
                    </td>
                    <td style={{ ...S.td, ...S.tdRight }}>{item.quantity}</td>
                    <td style={{ ...S.td, ...S.tdRight }}>{formatAmount(item.unit_price)}</td>
                    <td style={{ ...S.td, ...S.tdRight, fontWeight: 600 }}>
                      {formatAmount(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={S.totals}>
            <div style={S.totalsBox}>
              <div style={S.totalRow}>
                <span>Sous-total HT</span>
                <span>{formatAmount(subtotal)}</span>
              </div>
              {tvaRate > 0 && (
                <div style={S.totalRow}>
                  <span>TVA ({tvaRate}%)</span>
                  <span>{formatAmount(tvaAmount)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div style={S.totalRow}>
                  <span>Remise</span>
                  <span>- {formatAmount(invoice.discount)}</span>
                </div>
              )}
              <div style={S.totalRowFinal}>
                <span>Total TTC</span>
                <span style={{ color: accentColor }}>{formatAmount(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={S.notes}>
              <div style={S.notesLabel}>📝 Notes</div>
              <div>{invoice.notes}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          {business?.business_name && (
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              {business.business_name}
            </div>
          )}
          <div>Merci pour votre confiance · Ce document est généré automatiquement</div>
          {business?.ice && <div>ICE: {business.ice}</div>}
        </div>
      </div>
    </div>
  )
}
