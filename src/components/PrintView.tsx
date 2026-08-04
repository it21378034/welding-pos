import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Quotation, Invoice } from '../types';
import { Printer, Download, X, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const PrintView: React.FC = () => {
  const { activePrintDocument, setActivePrintDocument, settings, t } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!activePrintDocument) return null;

  const { type, data, layout } = activePrintDocument;
  const isQuotation = type === 'quotation';
  const quotationData = isQuotation ? (data as Quotation) : null;
  const invoiceData = !isQuotation ? (data as Invoice) : null;

  const visibility = (isQuotation ? quotationData?.visibility : invoiceData?.visibility) || {
    showPrices: true,
    showUnitPrice: true,
    showTotal: true,
  };

  const docNumber = isQuotation ? quotationData?.quotationNumber : invoiceData?.invoiceNumber;
  const docDate = isQuotation ? quotationData?.date : invoiceData?.date;
  const customerName = isQuotation ? quotationData?.customerName : invoiceData?.customerName;
  const customerPhone = isQuotation ? quotationData?.customerPhone : invoiceData?.customerPhone;
  const customerAddress = isQuotation ? quotationData?.customerAddress : invoiceData?.customerAddress;
  const projectName = isQuotation ? quotationData?.projectName : invoiceData?.projectName;
  const items = isQuotation ? quotationData?.items : invoiceData?.items;
  const subtotal = isQuotation ? quotationData?.subtotal : invoiceData?.subtotal;
  const discount = isQuotation ? quotationData?.discount : invoiceData?.discount;
  const grandTotal = isQuotation ? quotationData?.grandTotal : invoiceData?.grandTotal;
  const terms = isQuotation ? quotationData?.terms : invoiceData?.terms;

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page support
        let yOffset = 0;
        while (yOffset < imgHeight) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
          yOffset += pageHeight;
        }
      }

      pdf.save(`${docNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF download failed. Please try the Print button instead and select "Save as PDF".');
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  // Shared inline styles for reliable cross-browser PDF rendering
  const styles: Record<string, React.CSSProperties> = {
    page: {
      backgroundColor: '#ffffff',
      color: '#0f172a',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      padding: '40px',
      maxWidth: '794px',
      width: '100%',
      boxSizing: 'border-box',
      fontSize: '12px',
      lineHeight: '1.5',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: '2px solid #0f172a',
      paddingBottom: '20px',
      marginBottom: '20px',
    },
    logoArea: { display: 'flex', alignItems: 'center', gap: '12px' },
    logo: {
      width: '64px',
      height: '64px',
      objectFit: 'contain',
      borderRadius: '50%',
      border: '1px solid #cbd5e1',
      flexShrink: 0,
    },
    companyName: {
      fontSize: '22px',
      fontWeight: '900',
      color: '#0f172a',
      margin: '0 0 2px 0',
      letterSpacing: '-0.5px',
    },
    tagline: { fontSize: '11px', color: '#64748b', fontStyle: 'italic', margin: '0 0 2px 0' },
    companyInfo: { fontSize: '11px', color: '#475569', margin: '1px 0' },
    docTypeBlock: { textAlign: 'right' },
    docType: {
      fontSize: '28px',
      fontWeight: '900',
      color: '#0f172a',
      letterSpacing: '2px',
      margin: '0 0 4px 0',
    },
    docNumber: { fontSize: '14px', fontWeight: '700', color: '#d97706', margin: '0 0 3px 0', fontFamily: 'monospace' },
    docMeta: { fontSize: '11px', color: '#64748b', margin: '2px 0' },
    infoBox: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      padding: '14px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      marginBottom: '20px',
    },
    infoLabel: {
      fontSize: '9px',
      fontWeight: '700',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'block',
      marginBottom: '4px',
    },
    infoValue: { fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' },
    infoSub: { fontSize: '11px', color: '#475569', margin: '1px 0', fontFamily: 'monospace' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '16px' },
    th: {
      padding: '8px 10px',
      fontSize: '9px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: '#475569',
      borderBottom: '2px solid #0f172a',
      backgroundColor: '#f1f5f9',
    },
    td: { padding: '10px', fontSize: '12px', color: '#1e293b', borderBottom: '1px solid #e2e8f0' },
    tdMono: { padding: '10px', fontSize: '12px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', textAlign: 'right' as const },
    totalsBox: { display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' },
    totalsInner: { width: '260px', fontSize: '12px' },
    totalsRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0' },
    totalsFinalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderTop: '2px solid #0f172a',
      borderBottom: '2px solid #0f172a',
      fontWeight: '900',
      fontSize: '14px',
    },
    footer: {
      borderTop: '2px solid #0f172a',
      paddingTop: '20px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
    },
    footerTitle: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' as const, marginBottom: '4px' },
    footerText: { fontSize: '11px', color: '#475569', whiteSpace: 'pre-line' as const },
    sigBox: {
      borderTop: '1px solid #94a3b8',
      paddingTop: '6px',
      textAlign: 'center' as const,
      fontSize: '10px',
      color: '#64748b',
      marginTop: '40px',
      fontWeight: '600',
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-8 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Control Bar - Hidden on Print */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-2xl flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm">
              Print Preview: {docNumber}
            </h3>
            <p className="text-[11px] text-slate-400">
              Layout: <span className="uppercase font-mono text-amber-400">{layout}</span> | Mode:{' '}
              {visibility.showPrices ? 'Full Prices' : 'Hidden Prices (Estimate)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>{t('downloadPdf')}</span>
          </button>

          <button
            onClick={handleNativePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Document</span>
          </button>

          <button
            onClick={() => setActivePrintDocument(null)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* === PRINTABLE AREA === */}
      {layout === 'a4' && (
        <div
          ref={printRef}
          id="printable-area"
          style={styles.page}
          className="shadow-2xl print:shadow-none print:p-0"
        >
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logoArea}>
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="Logo"
                style={styles.logo}
                crossOrigin="anonymous"
              />
              <div>
                <p style={styles.companyName}>{settings.name}</p>
                <p style={styles.tagline}>{settings.tagline}</p>
                <p style={styles.companyInfo}>{settings.address}</p>
                <p style={styles.companyInfo}>
                  Tel: {settings.phone1}{settings.phone2 ? ` / ${settings.phone2}` : ''} | {settings.email}
                </p>
              </div>
            </div>

            <div style={styles.docTypeBlock}>
              <p style={styles.docType}>{isQuotation ? 'QUOTATION' : 'INVOICE'}</p>
              <p style={styles.docNumber}>{docNumber}</p>
              <p style={styles.docMeta}>Date: <strong>{docDate}</strong></p>
              {isQuotation ? (
                <p style={styles.docMeta}>Valid Until: <strong>{quotationData?.validUntil}</strong></p>
              ) : (
                <p style={styles.docMeta}>Due Date: <strong>{invoiceData?.dueDate}</strong></p>
              )}
            </div>
          </div>

          {/* Customer & Project Info */}
          <div style={styles.infoBox}>
            <div>
              <span style={styles.infoLabel}>Customer Details</span>
              <p style={styles.infoValue}>{customerName}</p>
              <p style={styles.infoSub}>{customerPhone}</p>
              <p style={{ ...styles.infoSub, fontFamily: 'inherit' }}>{customerAddress}</p>
            </div>
            <div>
              <span style={styles.infoLabel}>Project Specifications</span>
              <p style={styles.infoValue}>{projectName}</p>
            </div>
          </div>

          {/* Hidden Price Warning */}
          {isQuotation && !visibility.showPrices && (
            <div className="print:hidden" style={{ padding: '10px', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#92400e' }}>
              <EyeOff style={{ width: '14px', height: '14px', color: '#d97706' }} />
              <span><strong>Note:</strong> Pricing columns and totals are hidden per selection for estimate purposes.</span>
            </div>
          )}

          {/* Items Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'center', width: '30px' }}>#</th>
                <th style={styles.th}>Item / Fabrication Description</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Unit</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Qty</th>
                {(isQuotation ? visibility.showPrices && visibility.showUnitPrice : true) && (
                  <th style={{ ...styles.th, textAlign: 'right' }}>Unit Price</th>
                )}
                {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items?.map((item, idx) => (
                <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                  <td style={styles.td}>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{item.name}</strong>
                    {item.description && <span style={{ fontSize: '10px', color: '#64748b' }}>{item.description}</span>}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{item.unit}</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontFamily: 'monospace', fontWeight: '700' }}>{item.quantity}</td>
                  {(isQuotation ? visibility.showPrices && visibility.showUnitPrice : true) && (
                    <td style={styles.tdMono}>{settings.currency} {item.unitPrice.toLocaleString()}</td>
                  )}
                  {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
                    <td style={{ ...styles.tdMono, fontWeight: '800' }}>{settings.currency} {item.total.toLocaleString()}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
            <div style={styles.totalsBox}>
              <div style={styles.totalsInner}>
                <div style={styles.totalsRow}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Subtotal:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{settings.currency} {subtotal?.toLocaleString()}</span>
                </div>
                {discount ? (
                  <div style={{ ...styles.totalsRow, color: '#e11d48' }}>
                    <span style={{ fontWeight: '600' }}>Discount:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>- {settings.currency} {discount.toLocaleString()}</span>
                  </div>
                ) : null}
                <div style={styles.totalsFinalRow}>
                  <span>Grand Total:</span>
                  <span style={{ fontFamily: 'monospace' }}>{settings.currency} {grandTotal?.toLocaleString()}</span>
                </div>
                {!isQuotation && invoiceData && (
                  <>
                    <div style={{ ...styles.totalsRow, color: '#16a34a', fontWeight: '700' }}>
                      <span>Paid Amount:</span>
                      <span style={{ fontFamily: 'monospace' }}>{settings.currency} {invoiceData.paidAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.totalsRow, color: '#dc2626', fontWeight: '800', fontSize: '13px' }}>
                      <span>Balance Due:</span>
                      <span style={{ fontFamily: 'monospace' }}>{settings.currency} {invoiceData.balanceDue.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Project Images */}
          {isQuotation && quotationData?.projectImages && quotationData.projectImages.length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
              <p style={{ ...styles.footerTitle, marginBottom: '10px' }}>Project Drawings / Attachments</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {quotationData.projectImages.map((img, i) => (
                  <img key={i} src={img} alt="Spec" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} crossOrigin="anonymous" />
                ))}
              </div>
            </div>
          )}

          {/* Footer: Terms, Bank & Signatures */}
          <div style={styles.footer}>
            <div>
              <p style={styles.footerTitle}>Terms & Conditions</p>
              <p style={styles.footerText}>{terms}</p>
              <div style={{ marginTop: '12px' }}>
                <p style={styles.footerTitle}>Bank Deposit Details</p>
                <p style={{ ...styles.footerText, fontFamily: 'monospace' }}>{settings.bankDetails}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '16px' }}>
              {quotationData?.customerSignature && (
                <div style={{ textAlign: 'center' }}>
                  <img src={quotationData.customerSignature} alt="Customer Signature" style={{ height: '48px', marginBottom: '4px' }} crossOrigin="anonymous" />
                  <p style={styles.sigBox}>Customer Acceptance Signature</p>
                </div>
              )}
              <div style={{ textAlign: 'center', width: '180px' }}>
                <div style={{ height: '48px' }} />
                <p style={{ ...styles.sigBox, borderTop: '2px solid #0f172a', color: '#0f172a', fontWeight: '800' }}>
                  Authorized Workshop Signature
                </p>
              </div>
            </div>
          </div>

          {/* Thank You Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '11px', color: '#64748b' }}>
            <p style={{ fontWeight: '700', marginBottom: '2px' }}>Thank you for your business!</p>
            <p>{settings.tagline}</p>
          </div>
        </div>
      )}

      {/* THERMAL LAYOUT */}
      {layout === 'thermal' && (
        <div
          ref={printRef}
          id="printable-area"
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'monospace',
            padding: '12px',
            width: settings.thermalPrinterWidth === '58mm' ? '220px' : '302px',
            fontSize: '11px',
          }}
          className="shadow-2xl print:shadow-none"
        >
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
            <img src={settings.logoUrl || '/logo.png'} alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto 4px', display: 'block', borderRadius: '50%' }} crossOrigin="anonymous" />
            <p style={{ fontWeight: '900', fontSize: '13px', margin: '0 0 2px' }}>{settings.name}</p>
            <p style={{ fontSize: '9px', margin: '1px 0' }}>{settings.address}</p>
            <p style={{ fontSize: '9px', margin: '1px 0' }}>Tel: {settings.phone1}</p>
          </div>

          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
            <p style={{ fontWeight: '700', fontSize: '12px', margin: '0 0 2px', textTransform: 'uppercase' }}>
              {isQuotation ? 'QUOTATION RECEIPT' : 'PAYMENT RECEIPT'}
            </p>
            <p style={{ fontWeight: '700', margin: '0 0 2px' }}>{docNumber}</p>
            <p style={{ fontSize: '9px', margin: 0 }}>{docDate}</p>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontWeight: '700', margin: '0 0 2px', fontSize: '10px' }}>Client: {customerName}</p>
            <p style={{ fontSize: '9px', margin: 0 }}>Tel: {customerPhone}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', marginBottom: '8px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '3px 2px' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '3px 2px' }}>Qty</th>
                {visibility.showPrices && visibility.showUnitPrice && (
                  <th style={{ textAlign: 'right', padding: '3px 2px' }}>Amt</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items?.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px dashed #ccc' }}>
                  <td style={{ padding: '3px 2px', fontWeight: '600' }}>{item.name}</td>
                  <td style={{ padding: '3px 2px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                  {visibility.showPrices && visibility.showUnitPrice && (
                    <td style={{ padding: '3px 2px', textAlign: 'right', fontWeight: '700' }}>{item.total.toLocaleString()}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {visibility.showPrices && visibility.showTotal && (
            <div style={{ borderTop: '1px solid #000', paddingTop: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '12px' }}>
                <span>TOTAL:</span>
                <span>{settings.currency} {grandTotal?.toLocaleString()}</span>
              </div>
              {!isQuotation && invoiceData && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>PAID:</span>
                    <span>{settings.currency} {invoiceData.paidAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800' }}>
                    <span>BALANCE:</span>
                    <span>{settings.currency} {invoiceData.balanceDue.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', textAlign: 'center', fontSize: '9px' }}>
            <p style={{ fontWeight: '700', margin: '0 0 2px' }}>THANK YOU FOR YOUR BUSINESS!</p>
            <p style={{ margin: 0 }}>{settings.tagline}</p>
          </div>
        </div>
      )}
    </div>
  );
};
