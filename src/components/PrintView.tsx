import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Quotation, Invoice } from '../types';
import { Printer, Download, X, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Convert image URL to base64 for embedding in jsPDF
  const getBase64Image = (url: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(''); // Skip logo if it fails
      img.src = url;
    });

  // Create a faded (watermark) version of the logo using canvas globalAlpha
  const getWatermarkBase64 = (url: string, opacity = 0.06): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const size = 600; // render at high-res
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve('');
      img.src = url;
    });

  const handleDownloadPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const cur = settings.currency;

    // ── Header Background ─────────────────────────────────────────────────
    doc.setFillColor(239, 246, 255); // Light blue: #eff6ff
    doc.roundedRect(10, 6, pageW - 20, 36, 2, 2, 'F');

    // ── Logo ─────────────────────────────────────────────────────────────
    const logoUrl = settings.logoUrl || '/logo.png';
    const [logoBase64, watermarkBase64] = await Promise.all([
      getBase64Image(logoUrl),
      getWatermarkBase64(logoUrl, 0.06),
    ]);
    let textStartX = 14;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 10, 16, 16);
        doc.setDrawColor(30, 58, 138); // Navy blue frame
        doc.setLineWidth(0.6);
        doc.circle(22, 18, 8.5, 'S');
        textStartX = 34;
      } catch (_) { textStartX = 14; }
    }

    // ── Header ──────────────────────────────────────────────────────────
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(settings.name, textStartX, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(settings.tagline || '', textStartX, 24);
    
    doc.setTextColor(100, 116, 139);
    doc.text(settings.address || '', textStartX, 29);
    doc.text(`Tel: ${settings.phone1}${settings.phone2 ? ' / ' + settings.phone2 : ''}  |  ${settings.email || ''}`, textStartX, 34);

    // Doc type (right aligned)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(isQuotation ? 'QUOTATION' : 'INVOICE', pageW - 14, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(217, 119, 6);
    doc.text(docNumber || '', pageW - 14, 25, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${docDate || ''}`, pageW - 14, 30, { align: 'right' });
    doc.text(
      isQuotation
        ? `Valid Until: ${quotationData?.validUntil || ''}`
        : `Due Date: ${invoiceData?.dueDate || ''}`,
      pageW - 14,
      35,
      { align: 'right' }
    );

    // Divider line — aligned with bottom edge of header background box
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.7);
    doc.line(10, 42, pageW - 10, 42);

    // ── Customer & Project Box ───────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(30, 58, 138); // Navy blue border
    doc.setLineWidth(0.4);
    doc.roundedRect(14, 47, pageW - 28, 34, 2, 2, 'FD'); // Taller box, starts lower

    // Customer Details (left column)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('CUSTOMER DETAILS', 18, 54);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(customerName || '', 18, 61);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(customerPhone || '', 18, 67);
    doc.text(customerAddress || '', 18, 73);

    // Project Specifications (right column)
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('PROJECT SPECIFICATIONS', pageW / 2 + 2, 54);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const projLines = doc.splitTextToSize(projectName || '', (pageW / 2) - 20);
    doc.text(projLines, pageW / 2 + 2, 61);

    // ── Watermark (Canvas pre-processed for reliable opacity in PDF) ──────
    if (watermarkBase64) {
      const wmSize = 140;
      const wmX = (pageW - wmSize) / 2;
      const wmY = (doc.internal.pageSize.getHeight() - wmSize) / 2;
      doc.addImage(watermarkBase64, 'PNG', wmX, wmY, wmSize, wmSize);
    }

    // ── Items Table ──────────────────────────────────────────────────────
    const showUnitP = isQuotation ? visibility.showPrices && visibility.showUnitPrice : true;
    const showTotal = isQuotation ? visibility.showPrices && visibility.showTotal : true;

    const head: string[][] = [['#', 'ITEM / FABRICATION DESCRIPTION', 'UNIT', 'QTY']];
    if (showUnitP) head[0].push(`UNIT PRICE (${cur})`);
    if (showTotal) head[0].push(`TOTAL (${cur})`);

    const body = (items || []).map((item, idx) => {
      const row: string[] = [
        `${idx + 1}`,
        item.name + (item.description ? `\n${item.description}` : ''),
        item.unit,
        `${item.quantity}`,
      ];
      if (showUnitP) row.push(`${item.unitPrice.toLocaleString()}`);
      if (showTotal) row.push(`${item.total.toLocaleString()}`);
      return row;
    });

    autoTable(doc, {
      startY: 86,
      head,
      body,
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [30, 58, 138],
        fontStyle: 'bold',
        fontSize: 7,
        lineWidth: 0,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        fillColor: false, // transparent — watermark shows through
        lineWidth: 0,
      },
      alternateRowStyles: { fillColor: false },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', textColor: [148, 163, 184] },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
        ...(showUnitP ? { 4: { halign: 'right' } } : {}),
        ...(showTotal ? { [showUnitP ? 5 : 4]: { halign: 'right', fontStyle: 'bold' } } : {}),
      },
      margin: { left: 14, right: 14 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        // Center-align UNIT PRICE and TOTAL header cells only
        if (data.section === 'head') {
          const unitPriceCol = 4;
          const totalCol = showUnitP ? 5 : 4;
          if (
            (showUnitP && data.column.index === unitPriceCol) ||
            (showTotal && data.column.index === totalCol)
          ) {
            data.cell.styles.halign = 'center';
          }
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didDrawCell: (data: any) => {
        const { x, y, width, height } = data.cell;
        if (data.section === 'head') {
          // Solid navy blue bottom border under header
          doc.setDrawColor(30, 58, 138);
          doc.setLineWidth(0.7);
          doc.line(x, y + height, x + width, y + height);
        } else if (data.section === 'body') {
          // Light gray separator between rows
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(x, y + height, x + width, y + height);
        }
      },
    });

    // ── Totals ───────────────────────────────────────────────────────────
    let totalsEndY = 0; // Track where the totals section ends
    if (showTotal) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalY = (doc as any).lastAutoTable.finalY + 4;
      const totalsX = pageW - 80;
      const totalsW = 66;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      doc.text('Subtotal:', totalsX, finalY);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${cur} ${subtotal?.toLocaleString() || '0'}`, totalsX + totalsW, finalY, { align: 'right' });
      finalY += 6;

      if (discount) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 38, 38);
        doc.text('Discount:', totalsX, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text(`- ${cur} ${discount.toLocaleString()}`, totalsX + totalsW, finalY, { align: 'right' });
        finalY += 6;
      }

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(totalsX, finalY - 1, totalsX + totalsW, finalY - 1);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('Grand Total:', totalsX, finalY + 4);
      doc.text(`${cur} ${grandTotal?.toLocaleString() || '0'}`, totalsX + totalsW, finalY + 4, { align: 'right' });
      
      // Double underline for Grand Total
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.line(totalsX, finalY + 6, totalsX + totalsW, finalY + 6);
      doc.line(totalsX, finalY + 7.5, totalsX + totalsW, finalY + 7.5);

      finalY += 12;

      if (!isQuotation && invoiceData) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 163, 74);
        doc.text('Paid Amount:', totalsX, finalY);
        doc.text(`${cur} ${invoiceData.paidAmount.toLocaleString()}`, totalsX + totalsW, finalY, { align: 'right' });
        finalY += 7;
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(10);
        doc.text('Balance Due:', totalsX, finalY);
        doc.text(`${cur} ${invoiceData.balanceDue.toLocaleString()}`, totalsX + totalsW, finalY, { align: 'right' });
        finalY += 10;
      }
      totalsEndY = finalY;
    }

    // ── Project Images (inline thumbnails — placed BEFORE footer) ─────────
    const projImages = isQuotation ? quotationData?.projectImages : invoiceData?.projectImages;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableEndY = (doc as any).lastAutoTable?.finalY || 140;
    // Use whichever is lower: table end or totals end, with minimal padding
    let afterTotalsY = Math.max(tableEndY, totalsEndY) + 4;

    if (projImages && projImages.length > 0) {
      // Section divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, afterTotalsY, pageW - 14, afterTotalsY);
      afterTotalsY += 6;

      // Section title
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text('PROJECT DRAWINGS / ATTACHMENTS', 14, afterTotalsY);
      afterTotalsY += 6;

      // Thumbnail dimensions — same size as the preview (120x90 px ≈ 40x30 mm)
      const thumbW = 40;
      const thumbH = 30;
      const gap = 5;
      let thumbX = 14;

      for (let i = 0; i < projImages.length; i++) {
        try {
          // Wrap to next row if out of page width
          if (thumbX + thumbW > pageW - 14) {
            thumbX = 14;
            afterTotalsY += thumbH + gap;
          }
          // New page if out of vertical space
          if (afterTotalsY + thumbH > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            afterTotalsY = 20;
            thumbX = 14;
          }
          let format = 'PNG';
          if (projImages[i].startsWith('data:image/jpeg') || projImages[i].startsWith('data:image/jpg')) format = 'JPEG';
          doc.addImage(projImages[i], format, thumbX, afterTotalsY, thumbW, thumbH);
          // Border around thumbnail
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.rect(thumbX, afterTotalsY, thumbW, thumbH);
          thumbX += thumbW + gap;
        } catch (e) {
          console.error('Failed to add image to PDF', e);
        }
      }
      afterTotalsY += thumbH + 6;
    }

    // ── Footer: Terms & Bank Details ─────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    let footerStartY = afterTotalsY + 6;
    // Footer needs ~70mm. If it won't fit, add a new page.
    if (footerStartY + 70 > pageH) {
      doc.addPage();
      footerStartY = 20;
    }

    doc.setDrawColor(30, 58, 138); // Deep Navy
    doc.setLineWidth(0.5);
    doc.line(14, footerStartY, pageW - 14, footerStartY);

    let currentY = footerStartY + 6;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Match HTML (Black)
    doc.text('TERMS & CONDITIONS', 14, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Clean Gray
    const termsLines = doc.splitTextToSize(terms || '', 80);
    doc.text(termsLines, 14, currentY + 4);
    
    currentY += 6 + (termsLines.length * 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Match HTML (Black)
    doc.text('BANK DEPOSIT DETAILS', 14, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Clean Gray
    const bankLines = doc.splitTextToSize(settings.bankDetails || '', 80);
    doc.text(bankLines, 14, currentY + 4);

    // Signature boxes
    const sigY = footerStartY + 40; 
    
    // Customer Signature
    if (isQuotation && quotationData?.customerSignature) {
      try {
        doc.addImage(quotationData.customerSignature, 'PNG', pageW - 130, sigY - 14, 40, 12);
        doc.setDrawColor(148, 163, 184); // slate-400
        doc.setLineWidth(0.3);
        doc.line(pageW - 130, sigY, pageW - 90, sigY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('Customer Acceptance Signature', pageW - 110, sigY + 4, { align: 'center' });
      } catch (e) {
        console.warn('Customer signature error:', e);
      }
    }

    doc.setDrawColor(15, 23, 42); // Match HTML (Black)
    doc.setLineWidth(0.5);
    doc.line(pageW - 70, sigY, pageW - 14, sigY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Match HTML (Black)
    doc.text('Authorized Workshop Signature', pageW - 14, sigY + 4, { align: 'right' });

    // Thank you text at very bottom
    const thankYouY = Math.max(sigY + 15, currentY + bankLines.length * 3.5 + 10);
    // @ts-ignore
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(14, thankYouY, pageW - 14, thankYouY);
    // @ts-ignore
    doc.setLineDashPattern([], 0); 
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for your business!', pageW / 2, thankYouY + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(settings.tagline || '', pageW / 2, thankYouY + 9, { align: 'center' });

    // ── Save ─────────────────────────────────────────────────────────────
    doc.save(`${docNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleNativePrint = () => {
    const printArea = document.getElementById('printable-area');
    if (!printArea) { window.print(); return; }
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) { window.print(); return; }
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; background: white; color: #0f172a; }
            @page { margin: 10mm; size: A4 portrait; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${printArea.outerHTML}</body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 500);
  };

  // Shared inline styles for reliable cross-browser PDF rendering
  const styles: Record<string, React.CSSProperties> = {
    page: {
      position: 'relative',
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
      backgroundColor: '#eff6ff',
      borderBottom: '2px solid #1e3a8a',
      borderRadius: '8px 8px 0 0',
      padding: '16px 20px 16px 16px',
      marginBottom: '20px',
    },
    logoArea: { display: 'flex', alignItems: 'center', gap: '12px' },
    logo: {
      width: '64px',
      height: '64px',
      objectFit: 'contain',
      borderRadius: '50%',
      border: '2px solid #1e3a8a',
      padding: '2px',
      flexShrink: 0,
    },
    companyName: {
      fontSize: '22px',
      fontWeight: '900',
      color: '#1e3a8a',
      margin: '0 0 2px 0',
      letterSpacing: '-0.5px',
    },
    tagline: { fontSize: '11px', color: '#64748b', fontStyle: 'italic', margin: '0 0 2px 0' },
    companyInfo: { fontSize: '11px', color: '#64748b', margin: '1px 0' },
    docTypeBlock: { textAlign: 'right' },
    docType: {
      fontSize: '28px',
      fontWeight: '900',
      color: '#1e3a8a',
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
      border: '1.5px solid #1e3a8a',
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
      color: '#1e3a8a',
      borderBottom: '2px solid #1e3a8a',
      backgroundColor: '#f8fafc',
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
      borderTop: '2px solid #cbd5e1',
      borderBottom: '4px double #1e3a8a',
      color: '#1e3a8a',
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
          {/* Watermark (zIndex: 0 so it sits behind transparent table rows) */}
          {settings.logoUrl && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, pointerEvents: 'none', zIndex: 0 }}>
              <img src={settings.logoUrl} style={{ width: '400px', height: '400px', objectFit: 'contain' }} crossOrigin="anonymous" />
            </div>
          )}

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
                  <th style={{ ...styles.th, textAlign: 'right' }}>Unit Price ({settings.currency})</th>
                )}
                {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total ({settings.currency})</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items?.map((item, idx) => (
                <tr key={item.id} style={{ backgroundColor: 'transparent' }}>
                  <td style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                  <td style={styles.td}>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{item.name}</strong>
                    {item.description && <span style={{ fontSize: '10px', color: '#64748b' }}>{item.description}</span>}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{item.unit}</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontFamily: 'monospace', fontWeight: '700' }}>{item.quantity}</td>
                  {(isQuotation ? visibility.showPrices && visibility.showUnitPrice : true) && (
                    <td style={styles.tdMono}>{item.unitPrice.toLocaleString()}</td>
                  )}
                  {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
                    <td style={{ ...styles.tdMono, fontWeight: '800' }}>{item.total.toLocaleString()}</td>
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
          {((isQuotation && quotationData?.projectImages && quotationData.projectImages.length > 0) ||
            (!isQuotation && invoiceData?.projectImages && invoiceData.projectImages.length > 0)) && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
              <p style={{ ...styles.footerTitle, marginBottom: '10px' }}>Project Drawings / Attachments</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {(isQuotation ? quotationData?.projectImages : invoiceData?.projectImages)?.map((img, i) => (
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
