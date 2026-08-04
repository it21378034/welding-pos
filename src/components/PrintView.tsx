import React from 'react';
import { useApp } from '../context/AppContext';
import type { Quotation, Invoice } from '../types';
import { Printer, Download, X, EyeOff } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const PrintView: React.FC = () => {
  const { activePrintDocument, setActivePrintDocument, settings, t } = useApp();

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

  const handleNativePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-area');
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(
      `${isQuotation ? quotationData?.quotationNumber : invoiceData?.invoiceNumber}_${
        new Date().toISOString().split('T')[0]
      }.pdf`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-8 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-2xl flex items-center justify-between print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm">
              Print Preview: {isQuotation ? quotationData?.quotationNumber : invoiceData?.invoiceNumber}
            </h3>
            <p className="text-[11px] text-slate-400">
              Layout: <span className="uppercase font-mono text-amber-400">{layout}</span> | Mode:{' '}
              {visibility.showPrices ? 'Full Prices' : 'Hidden Prices (Estimate)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
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

      {/* PRINTABLE DOCUMENT AREA */}
      <div
        id="printable-area"
        className={`bg-white text-slate-900 shadow-2xl transition-all print:shadow-none print:m-0 print:w-full ${
          layout === 'thermal'
            ? settings.thermalPrinterWidth === '58mm'
              ? 'w-[58mm] p-3 text-[10px]'
              : 'w-[80mm] p-4 text-[11px]'
            : 'w-full max-w-4xl p-10 text-xs rounded-xl'
        }`}
      >
        {/* A4 LAYOUT */}
        {layout === 'a4' && (
          <div className="space-y-6">
            {/* Header / Workshop Info */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div className="flex items-start gap-4">
                <img 
                  src={settings.logoUrl || '/logo.png'} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-full border border-slate-300 p-0.5 shrink-0" 
                />
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">{settings.name}</h1>
                  <p className="text-xs font-medium text-slate-600 italic">{settings.tagline}</p>
                  <p className="text-xs text-slate-700 pt-0.5">{settings.address}</p>
                  <p className="text-xs text-slate-700 font-mono">
                    Tel: {settings.phone1} {settings.phone2 ? `/ ${settings.phone2}` : ''} | Email: {settings.email}
                  </p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wide">
                  {isQuotation ? 'QUOTATION' : 'INVOICE'}
                </h2>
                <p className="font-mono text-base font-bold text-amber-600">
                  {isQuotation ? quotationData?.quotationNumber : invoiceData?.invoiceNumber}
                </p>
                <p className="text-xs text-slate-600">
                  Date: <span className="font-semibold">{isQuotation ? quotationData?.date : invoiceData?.date}</span>
                </p>
                {isQuotation ? (
                  <p className="text-xs text-slate-600">
                    Valid Until: <span className="font-semibold">{quotationData?.validUntil}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Due Date: <span className="font-semibold">{invoiceData?.dueDate}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Customer & Project Info Box */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                  CUSTOMER DETAILS
                </span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {isQuotation ? quotationData?.customerName : invoiceData?.customerName}
                </p>
                <p className="text-xs font-mono font-semibold text-slate-700">
                  {isQuotation ? quotationData?.customerPhone : invoiceData?.customerPhone}
                </p>
                <p className="text-xs text-slate-600">
                  {isQuotation ? quotationData?.customerAddress : invoiceData?.customerAddress}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                  PROJECT SPECIFICATIONS
                </span>
                <p className="text-xs font-extrabold text-slate-900 mt-0.5 leading-snug">
                  {isQuotation ? quotationData?.projectName : invoiceData?.projectName}
                </p>
              </div>
            </div>

            {/* Hidden Price Warning Banner (Only visible on screen) */}
            {isQuotation && !visibility.showPrices && (
              <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 print:hidden">
                <EyeOff className="w-4 h-4 text-amber-600" />
                <span>
                  <strong>Note:</strong> Pricing columns and totals are hidden per selection for estimate purposes.
                </span>
              </div>
            )}

            {/* Itemized Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-800 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Item / Fabrication Description</th>
                  <th className="py-2.5 px-2 text-center">Unit</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  {(isQuotation ? visibility.showPrices && visibility.showUnitPrice : true) && (
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                  )}
                  {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
                    <th className="py-2.5 px-2 text-right">Total</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(isQuotation ? quotationData?.items : invoiceData?.items)?.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-3 px-2 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <p className="font-extrabold text-slate-900 text-xs">{item.name}</p>
                      {item.description && <p className="text-[11px] text-slate-600">{item.description}</p>}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-slate-700">{item.unit}</td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">{item.quantity}</td>

                    {(isQuotation ? visibility.showPrices && visibility.showUnitPrice : true) && (
                      <td className="py-3 px-2 text-right font-mono font-semibold text-slate-800">
                        {settings.currency} {item.unitPrice.toLocaleString()}
                      </td>
                    )}

                    {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
                      <td className="py-3 px-2 text-right font-mono font-extrabold text-slate-900">
                        {settings.currency} {item.total.toLocaleString()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & Totals (If Visible) */}
            {(isQuotation ? visibility.showPrices && visibility.showTotal : true) && (
              <div className="flex justify-end pt-4">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="font-semibold text-slate-600">Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {settings.currency}{' '}
                      {(isQuotation ? quotationData?.subtotal : invoiceData?.subtotal)?.toLocaleString()}
                    </span>
                  </div>

                  {(isQuotation ? quotationData?.discount : invoiceData?.discount) ? (
                    <div className="flex justify-between py-1 border-b border-slate-200 text-rose-600">
                      <span className="font-semibold">Discount:</span>
                      <span className="font-mono font-bold">
                        - {settings.currency}{' '}
                        {(isQuotation ? quotationData?.discount : invoiceData?.discount)?.toLocaleString()}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-between py-2 text-sm font-black text-slate-900 border-b-2 border-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base">
                      {settings.currency}{' '}
                      {(isQuotation ? quotationData?.grandTotal : invoiceData?.grandTotal)?.toLocaleString()}
                    </span>
                  </div>

                  {!isQuotation && invoiceData && (
                    <>
                      <div className="flex justify-between py-1 text-emerald-700 font-bold">
                        <span>Paid Amount:</span>
                        <span className="font-mono">{settings.currency} {invoiceData.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 text-rose-700 font-black text-sm">
                        <span>Balance Due:</span>
                        <span className="font-mono">{settings.currency} {invoiceData.balanceDue.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Project Drawings & Signature */}
            {isQuotation && quotationData?.projectImages && quotationData.projectImages.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase mb-2">Project Drawings / Attachments</h4>
                <div className="flex flex-wrap gap-3">
                  {quotationData.projectImages.map((img, i) => (
                    <img key={i} src={img} alt="Spec" className="w-32 h-24 object-cover rounded border border-slate-300" />
                  ))}
                </div>
              </div>
            )}

            {/* Terms, Bank Info & Signatures */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-[11px]">
              <div className="space-y-2">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase">Terms & Conditions</h4>
                  <p className="whitespace-pre-line text-slate-600 mt-1 leading-relaxed">
                    {isQuotation ? quotationData?.terms : invoiceData?.terms}
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-slate-900 uppercase">Bank Deposit Details</h4>
                  <p className="whitespace-pre-line text-slate-700 font-mono">{settings.bankDetails}</p>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end space-y-12">
                {quotationData?.customerSignature && (
                  <div className="text-center">
                    <img src={quotationData.customerSignature} alt="Customer Signature" className="h-12 mx-auto" />
                    <p className="text-[10px] text-slate-500 border-t border-slate-400 pt-1 px-4 font-semibold">
                      Customer Acceptance Signature
                    </p>
                  </div>
                )}

                <div className="text-center w-48">
                  <div className="h-12" />
                  <p className="text-[10px] text-slate-900 border-t-2 border-slate-900 pt-1 font-extrabold uppercase">
                    Authorized Workshop Signature
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* THERMAL POS LAYOUT (58mm / 80mm) */}
        {layout === 'thermal' && (
          <div className="space-y-3 font-mono">
            <div className="text-center border-b border-black pb-2 flex flex-col items-center">
              <img 
                src={settings.logoUrl || '/logo.png'} 
                alt="Logo" 
                className="w-12 h-12 mb-1.5 object-contain rounded-full border border-black p-0.5" 
              />
              <h2 className="font-black text-sm uppercase">{settings.name}</h2>
              <p className="text-[9px]">{settings.address}</p>
              <p className="text-[9px]">Tel: {settings.phone1}</p>
            </div>

            <div className="text-center border-b border-black pb-2">
              <p className="font-bold uppercase text-xs">
                {isQuotation ? 'QUOTATION RECEIPT' : 'PAYMENT RECEIPT'}
              </p>
              <p className="font-bold">{isQuotation ? quotationData?.quotationNumber : invoiceData?.invoiceNumber}</p>
              <p className="text-[9px]">{isQuotation ? quotationData?.date : invoiceData?.date}</p>
            </div>

            <div>
              <p className="font-bold text-[10px]">Client: {isQuotation ? quotationData?.customerName : invoiceData?.customerName}</p>
              <p className="text-[9px]">Tel: {isQuotation ? quotationData?.customerPhone : invoiceData?.customerPhone}</p>
            </div>

            <table className="w-full text-left text-[9px] border-b border-black pb-2">
              <thead>
                <tr className="border-b border-black">
                  <th className="w-6 text-center">[✓]</th>
                  <th>Item</th>
                  <th className="text-center">Qty</th>
                  {visibility.showPrices && visibility.showUnitPrice && <th className="text-right">Amt</th>}
                </tr>
              </thead>
              <tbody>
                {(isQuotation ? quotationData?.items : invoiceData?.items)?.map(item => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="py-1.5 text-center font-mono font-bold text-[10px]">
                      <span className="inline-block w-3.5 h-3.5 border-2 border-black rounded-sm align-middle"></span>
                    </td>
                    <td className="py-1.5 pr-1 leading-tight font-semibold">
                      {item.name}
                      {item.unit === 'Liters' && <span className="block text-[8px] italic font-normal">[{item.quantity} Liters Paint]</span>}
                    </td>
                    <td className="py-1.5 text-center font-bold">{item.quantity} {item.unit}</td>
                    {visibility.showPrices && visibility.showUnitPrice && (
                      <td className="py-1.5 text-right font-bold">{item.total.toLocaleString()}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {visibility.showPrices && visibility.showTotal ? (
              <div className="space-y-1 text-right text-[10px]">
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                  <span>TOTAL:</span>
                  <span>
                    {settings.currency}{' '}
                    {(isQuotation ? quotationData?.grandTotal : invoiceData?.grandTotal)?.toLocaleString()}
                  </span>
                </div>

                {!isQuotation && invoiceData && (
                  <>
                    <div className="flex justify-between">
                      <span>PAID:</span>
                      <span>{settings.currency} {invoiceData.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>BALANCE:</span>
                      <span>{settings.currency} {invoiceData.balanceDue.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center pt-2 text-[9px] font-bold italic text-slate-700">
                (Prices Hidden for Workshop / Estimate Copy)
              </div>
            )}

            <div className="text-center pt-3 border-t border-dashed border-black text-[9px] space-y-1">
              <p className="font-bold">THANK YOU FOR YOUR BUSINESS!</p>
              <p>{settings.tagline}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
