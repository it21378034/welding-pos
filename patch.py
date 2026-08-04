import sys

with open('src/components/PurchaseListModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace html2canvas import
content = content.replace("import html2canvas from 'html2canvas';", "import autoTable from 'jspdf-autotable';")

# The handleNativePrint replacement
native_print_old = 'const handleNativePrint = () => window.print();'
native_print_new = '''const handleNativePrint = () => {
    const printArea = document.getElementById('purchase-printable-area');
    if (!printArea) { window.print(); return; }
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) { window.print(); return; }
    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase List - ${list.listNumber}</title>
          ${document.head.innerHTML}
          <style>
            @page { margin: 10mm; size: A4 portrait; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body class="bg-white p-8">${printArea.outerHTML}</body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => { popup.print(); popup.close(); }, 500);
  };'''

content = content.replace(native_print_old, native_print_new)

# The handleDownloadPDF replacement
download_pdf_old = '''const handleDownloadPDF = async () => {
    const el = document.getElementById('purchase-printable-area');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', layout === 'thermal' ? [80, 250] : 'a4');
    const imgWidth = layout === 'thermal' ? 72 : 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', layout === 'thermal' ? 4 : 0, 0, imgWidth, imgHeight);
    pdf.save(`PurchaseList_${list.listNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };'''

download_pdf_new = '''const getBase64Image = (url: string): Promise<string> =>
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
      img.onerror = () => resolve('');
      img.src = url;
    });

  const handleDownloadPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: layout === 'thermal' ? [80, 250] : 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    const logoUrl = settings.logoUrl || '/logo.png';
    const logoBase64 = await getBase64Image(logoUrl);

    if (layout === 'thermal') {
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', pageW/2 - 8, 5, 16, 16); } catch (_) {}
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.name, pageW/2, 26, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.address || '', pageW/2, 30, { align: 'center' });
      doc.text(`Tel: ${settings.phone1}`, pageW/2, 34, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PURCHASE LIST', pageW/2, 40, { align: 'center' });
      doc.text(list.listNumber || '', pageW/2, 45, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(list.date || '', pageW/2, 49, { align: 'center' });
      
      doc.line(5, 52, pageW - 5, 52);
      doc.text(`Client: ${list.customerName || '—'}`, 5, 57);
      if (list.customerPhone) doc.text(`Tel: ${list.customerPhone}`, 5, 61);
      if (list.projectName) doc.text(`Project: ${list.projectName}`, 5, 65);
      
      const head = [['Item', 'Qty', '[ ]']];
      const body = list.items.map(item => [
        item.name + '\\n' + item.unit,
        item.quantity.toString(),
        ''
      ]);
      
      // @ts-ignore
      autoTable(doc, {
        startY: 68,
        head,
        body,
        theme: 'plain',
        headStyles: { fontStyle: 'bold', fontSize: 8, textColor: 0, halign: 'left' },
        bodyStyles: { fontSize: 8, textColor: 0 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 10, halign: 'center' }
        },
        margin: { left: 5, right: 5 },
        didDrawCell: function (data: any) {
          if (data.section === 'body' && data.column.index === 2) {
            doc.setDrawColor(0);
            doc.setLineWidth(0.3);
            doc.rect(data.cell.x + 3, data.cell.y + 2, 4, 4);
          }
          if (data.section === 'head') {
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });
      
      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY + 5;
      
      if (list.notes) {
        doc.line(5, finalY, pageW - 5, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 5, finalY + 5);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(list.notes, pageW - 10);
        doc.text(lines, 5, finalY + 9);
        finalY += 9 + (lines.length * 4);
      }
      
      doc.line(5, finalY, pageW - 5, finalY);
      doc.setFont('helvetica', 'bold');
      doc.text('THANK YOU!', pageW/2, finalY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text(settings.tagline || '', pageW/2, finalY + 9, { align: 'center' });
      
    } else {
      let textStartX = 14;
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 14, 10, 16, 16);
          textStartX = 34;
        } catch (_) { textStartX = 14; }
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(settings.name, textStartX, 18);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(settings.tagline || '', textStartX, 24);
      doc.text(settings.address || '', textStartX, 29);
      doc.text(`Tel: ${settings.phone1}${settings.phone2 ? ' / ' + settings.phone2 : ''}  |  ${settings.email || ''}`, textStartX, 34);

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PURCHASE LIST', pageW - 14, 18, { align: 'right' });
      doc.setFontSize(10);
      doc.setTextColor(217, 119, 6);
      doc.text(list.listNumber || '', pageW - 14, 25, { align: 'right' });
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${list.date || ''}`, pageW - 14, 30, { align: 'right' });

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(14, 40, pageW - 14, 40);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 44, pageW - 28, 26, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text('CUSTOMER DETAILS', 18, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(list.customerName || '—', 18, 56);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(list.customerPhone || '', 18, 61);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text('PROJECT / PURPOSE', pageW / 2 + 2, 50);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const projLines = doc.splitTextToSize(list.projectName || '—', (pageW / 2) - 20);
      doc.text(projLines, pageW / 2 + 2, 56);

      const head = [['#', 'Item / Material Description', 'Unit', 'Qty', 'Collected', 'Checked']];
      const body = list.items.map((item, idx) => [
        `${idx + 1}`,
        item.name + (item.notes ? `\n${item.notes}` : ''),
        item.unit,
        `${item.quantity}`,
        '',
        ''
      ]);

      // @ts-ignore
      autoTable(doc, {
        startY: 74,
        head,
        body,
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 7, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center', textColor: [148, 163, 184] },
          1: { halign: 'left' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
        didDrawCell: function (data: any) {
          if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
            doc.setDrawColor(71, 85, 105);
            doc.setLineWidth(0.3);
            const boxSize = 4;
            doc.rect(data.cell.x + data.cell.width / 2 - boxSize / 2, data.cell.y + data.cell.height / 2 - boxSize / 2, boxSize, boxSize);
          }
        }
      });

      // @ts-ignore
      let finalY = doc.lastAutoTable.finalY + 10;

      if (list.notes) {
        doc.setFillColor(254, 252, 232);
        doc.setDrawColor(253, 230, 138);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, finalY, pageW - 28, 20, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Notes / Instructions', 18, finalY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const noteLines = doc.splitTextToSize(list.notes, pageW - 36);
        doc.text(noteLines, 18, finalY + 11);
        finalY += 30;
      }

      finalY = Math.max(finalY, 230);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.5);

      const sigWidth = 40;
      const sigSpacing = (pageW - 28 - (sigWidth * 3)) / 2;

      doc.line(14, finalY, 14 + sigWidth, finalY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Prepared By', 14 + sigWidth / 2, finalY + 4, { align: 'center' });

      const sig2X = 14 + sigWidth + sigSpacing;
      doc.line(sig2X, finalY, sig2X + sigWidth, finalY);
      doc.text('Hardware Verified By', sig2X + sigWidth / 2, finalY + 4, { align: 'center' });

      const sig3X = sig2X + sigWidth + sigSpacing;
      doc.line(sig3X, finalY, sig3X + sigWidth, finalY);
      doc.text('Customer Received', sig3X + sigWidth / 2, finalY + 4, { align: 'center' });
    }

    doc.save(`PurchaseList_${list.listNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };'''

content = content.replace(download_pdf_old, download_pdf_new)

with open('src/components/PurchaseListModule.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
