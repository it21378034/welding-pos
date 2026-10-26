import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  QrCode, 
  Printer, 
  Download, 
  ExternalLink, 
  RotateCcw, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  FileText, 
  Copy, 
  FileCheck,
  Layers,
  Wrench,
  Info
} from 'lucide-react';

type StickerTheme = 'industrial-dark' | 'brushed-steel' | 'monochrome-clean' | 'royal-navy' | 'hazard-caution';
type ViewMode = 'fit' | 'actual' | 'sheet';

interface StickerData {
  brandName: string;
  tagline: string;
  badgeText: string;
  websiteUrl: string;
  qrPrompt: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  logoUrl: string;
  showLogo: boolean;
  warrantyText: string;
  showWarranty: boolean;
  jobTag: string;
}

export const StickerModule: React.FC = () => {
  const { settings, quotations, invoices, t } = useApp();
  const { showToast } = useToast();

  // Helper to ensure clean URL with protocol
  const sanitizeUrl = (raw: string) => {
    if (!raw) return 'https://www.vasanthaironworks.com';
    const trimmed = raw.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const initialStickerData: StickerData = {
    brandName: settings.name || 'Vasantha Iron Works',
    tagline: settings.tagline || 'Custom Fabrication, Stainless Steel & Structural Welding Experts',
    badgeText: 'FABRICATED & INSTALLED BY',
    websiteUrl: sanitizeUrl(settings.website || 'www.vasanthaironworks.com'),
    qrPrompt: 'SCAN TO VISIT',
    phone1: settings.phone1 || '+94 77 123 4567',
    phone2: settings.phone2 || '+94 11 291 8899',
    email: settings.email || 'info@vasanthaironworks.com',
    address: settings.address || 'No. 142, Kandy Road, Kiribathgoda, Sri Lanka',
    logoUrl: settings.logoUrl || '/logo.png',
    showLogo: true,
    warrantyText: '1-Year Welding Joints Warranty',
    showWarranty: false,
    jobTag: '',
  };

  const [stickerData, setStickerData] = useState<StickerData>(initialStickerData);
  const [theme, setTheme] = useState<StickerTheme>('industrial-dark');
  const [viewMode, setViewMode] = useState<ViewMode>('fit');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const singleStickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache logo as Base64 data URL so html2canvas never suffers CORS or tainted canvas errors
  useEffect(() => {
    let isSubscribed = true;
    const cacheLogo = async () => {
      const url = stickerData.logoUrl;
      if (!url) {
        if (isSubscribed) setLogoBase64('');
        return;
      }
      if (url.startsWith('data:')) {
        if (isSubscribed) setLogoBase64(url);
        return;
      }
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 100;
            canvas.height = img.naturalHeight || 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              if (isSubscribed) setLogoBase64(dataUrl);
            } else {
              if (isSubscribed) setLogoBase64(url);
            }
          } catch (_) {
            if (isSubscribed) setLogoBase64(url);
          }
        };
        img.onerror = () => {
          if (isSubscribed) setLogoBase64(url);
        };
        img.src = url;
      } catch (_) {
        if (isSubscribed) setLogoBase64(url);
      }
    };

    cacheLogo();
    return () => {
      isSubscribed = false;
    };
  }, [stickerData.logoUrl]);

  // Generate QR Code dynamically whenever website URL changes
  useEffect(() => {
    let isSubscribed = true;
    const generateQR = async () => {
      try {
        const targetUrl = sanitizeUrl(stickerData.websiteUrl);
        const dataUrl = await QRCode.toDataURL(targetUrl, {
          width: 320,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (isSubscribed) {
          setQrCodeDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate QR Code:', err);
      }
    };

    generateQR();
    return () => {
      isSubscribed = false;
    };
  }, [stickerData.websiteUrl]);

  // Reset to current company settings
  const handleResetToSettings = () => {
    setStickerData({
      brandName: settings.name || 'Vasantha Iron Works',
      tagline: settings.tagline || 'Custom Fabrication, Stainless Steel & Structural Welding Experts',
      badgeText: 'FABRICATED & INSTALLED BY',
      websiteUrl: sanitizeUrl(settings.website || 'www.vasanthaironworks.com'),
      qrPrompt: 'SCAN TO VISIT',
      phone1: settings.phone1 || '+94 77 123 4567',
      phone2: settings.phone2 || '+94 11 291 8899',
      email: settings.email || 'info@vasanthaironworks.com',
      address: settings.address || 'No. 142, Kandy Road, Kiribathgoda, Sri Lanka',
      logoUrl: settings.logoUrl || '/logo.png',
      showLogo: true,
      warrantyText: '1-Year Welding Joints Warranty',
      showWarranty: false,
      jobTag: '',
    });
    setSelectedDocId('');
    showToast('Reset to workshop settings!', 'success');
  };

  // Handle custom logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file should be under 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setStickerData(prev => ({ ...prev, logoUrl: event.target!.result as string, showLogo: true }));
          showToast('Custom sticker logo applied!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-fill from selected Invoice or Quotation
  const handleLinkDoc = (docId: string) => {
    setSelectedDocId(docId);
    if (!docId) {
      setStickerData(prev => ({ ...prev, jobTag: '', showWarranty: false }));
      return;
    }

    if (docId.startsWith('inv:')) {
      const inv = invoices.find(i => i.id === docId.replace('inv:', ''));
      if (inv) {
        setStickerData(prev => ({
          ...prev,
          jobTag: `${inv.invoiceNumber} • ${inv.projectName || inv.customerName}`,
          showWarranty: true,
        }));
        showToast(`Linked invoice ${inv.invoiceNumber}`, 'success');
      }
    } else if (docId.startsWith('qt:')) {
      const qt = quotations.find(q => q.id === docId.replace('qt:', ''));
      if (qt) {
        setStickerData(prev => ({
          ...prev,
          jobTag: `${qt.quotationNumber} • ${qt.projectName || qt.customerName}`,
          showWarranty: true,
        }));
        showToast(`Linked quotation ${qt.quotationNumber}`, 'success');
      }
    }
  };

  // Helper to render high-res canvas from the sticker DOM element
  const generateStickerCanvas = async (): Promise<HTMLCanvasElement | null> => {
    // 1. Try dedicated permanent export ref
    let target = singleStickerRef.current;
    // 2. Try ID lookup
    if (!target) {
      target = document.getElementById('permanent-sticker-export-node') as HTMLDivElement;
    }
    // 3. Fallback to any mounted sticker container in the DOM
    if (!target) {
      target = document.querySelector('.sticker-render-root') as HTMLDivElement;
    }
    if (!target) {
      console.error('Sticker DOM node not found anywhere in document');
      return null;
    }

    return await html2canvas(target, {
      scale: 3, // 150mm * 3 = 1700px, 30mm * 3 = 340px (High-res 300 DPI)
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
    });
  };

  // Download Single 15cm x 3cm PDF
  const handleDownloadSinglePDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateStickerCanvas();
      if (!canvas) throw new Error('Sticker canvas element not available');

      const imgData = canvas.toDataURL('image/png');
      // Format [30, 150] in landscape gives exactly 150mm width x 30mm height
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [30, 150],
      });

      doc.addImage(imgData, 'PNG', 0, 0, 150, 30);
      const cleanName = (stickerData.brandName || 'sticker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      doc.save(`${cleanName}-sticker-15x3cm.pdf`);
      showToast('15cm × 3cm Single Sticker PDF downloaded!', 'success');
    } catch (err) {
      console.error('Error generating single PDF:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to generate sticker PDF: ${msg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Download A4 Sheet of 8 Stickers PDF with cutting lines
  const handleDownloadSheetPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateStickerCanvas();
      if (!canvas) throw new Error('Sticker canvas element not available');

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const stickerW = 150;
      const stickerH = 30;
      const startX = (210 - stickerW) / 2; // 30mm centered on A4
      const startY = 16;
      const gapY = 3.5;

      // Header on A4 sheet
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${stickerData.brandName} — 15cm × 3cm Branded Product Stickers (Sheet of 8)`, 105, 10, { align: 'center' });
      doc.text(`Print at 100% Scale / Actual Size on A4 Adhesive Sticker Paper. Cut along dashed lines.`, 105, 13.5, { align: 'center' });

      for (let i = 0; i < 8; i++) {
        const curY = startY + i * (stickerH + gapY);
        // Draw sticker
        doc.addImage(imgData, 'PNG', startX, curY, stickerW, stickerH);

        // Dashed cutting guide
        doc.setDrawColor(180, 185, 195);
        doc.setLineWidth(0.2);
        try {
          doc.setLineDashPattern([2, 2], 0);
        } catch (_) {
          // Fallback if not supported
        }
        doc.rect(startX, curY, stickerW, stickerH);
      }

      const cleanName = (stickerData.brandName || 'sticker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      doc.save(`${cleanName}-stickers-sheet-a4.pdf`);
      showToast('A4 Sticker Sheet PDF (8 Stickers) downloaded!', 'success');
    } catch (err) {
      console.error('Error generating sheet PDF:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to generate A4 sheet PDF: ${msg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Download 300 DPI High-Resolution PNG
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateStickerCanvas();
      if (!canvas) throw new Error('Sticker canvas element not available');

      const link = document.createElement('a');
      const cleanName = (stickerData.brandName || 'sticker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `${cleanName}-sticker-15x3cm-300dpi.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('High-Res 300 DPI PNG (1772 × 354 px) downloaded!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PNG image', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy PNG image to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const canvas = await generateStickerCanvas();
      if (!canvas) throw new Error('Canvas not found');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('Failed to generate image blob', 'error');
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('Sticker image copied to clipboard!', 'success');
        } catch (_) {
          showToast('Clipboard access not permitted in this browser', 'error');
        }
      });
    } catch (err) {
      console.error(err);
      showToast('Could not copy image', 'error');
    }
  };

  // Direct Browser Print (either single or A4 sheet based on viewMode)
  const handleDirectPrint = () => {
    window.print();
  };

  // Theme style classes & colors
  const getThemeStyles = () => {
    switch (theme) {
      case 'brushed-steel':
        return {
          wrapper: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-900 border-2 border-slate-400 shadow-md',
          badge: 'bg-slate-800 text-slate-100 border border-slate-700',
          title: 'text-slate-950 font-black',
          sub: 'text-slate-700',
          contact: 'text-slate-800',
          accent: 'text-blue-700',
          divider: 'bg-slate-400/70',
          qrBorder: 'border-slate-400',
          qrText: 'text-slate-900',
          hazard: false,
        };
      case 'monochrome-clean':
        return {
          wrapper: 'bg-white text-black border-2 border-black shadow-md',
          badge: 'bg-black text-white border border-black',
          title: 'text-black font-black',
          sub: 'text-slate-800 font-medium',
          contact: 'text-slate-900',
          accent: 'text-black',
          divider: 'bg-black/60',
          qrBorder: 'border-black',
          qrText: 'text-black',
          hazard: false,
        };
      case 'royal-navy':
        return {
          wrapper: 'bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-white border-2 border-amber-400/90 shadow-xl',
          badge: 'bg-amber-400 text-slate-950 font-black',
          title: 'text-white font-black',
          sub: 'text-slate-300',
          contact: 'text-slate-200',
          accent: 'text-amber-400',
          divider: 'bg-amber-400/40',
          qrBorder: 'border-amber-400/80',
          qrText: 'text-amber-300',
          hazard: false,
        };
      case 'hazard-caution':
        return {
          wrapper: 'bg-zinc-950 text-white border-2 border-amber-500 shadow-xl relative overflow-hidden',
          badge: 'bg-amber-500 text-zinc-950 font-black',
          title: 'text-white font-black',
          sub: 'text-zinc-300',
          contact: 'text-zinc-200',
          accent: 'text-amber-400',
          divider: 'bg-amber-500/50',
          qrBorder: 'border-amber-500',
          qrText: 'text-amber-400',
          hazard: true,
        };
      case 'industrial-dark':
      default:
        return {
          wrapper: 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-2 border-amber-500 shadow-xl',
          badge: 'bg-amber-500 text-slate-950 font-black',
          title: 'text-white font-black',
          sub: 'text-slate-300',
          contact: 'text-slate-200',
          accent: 'text-amber-400',
          divider: 'bg-amber-500/50',
          qrBorder: 'border-amber-500/80',
          qrText: 'text-amber-400',
          hazard: false,
        };
    }
  };

  const ts = getThemeStyles();

  // Single sticker component rendered with exact 150mm x 30mm dimensions
  const renderStickerNode = (_isSheetInstance = false) => (
    <div
      style={{
        width: '150mm',
        height: '30mm',
        boxSizing: 'border-box',
      }}
      className={`sticker-render-root relative select-none flex items-stretch p-[2.2mm] rounded-[1.5mm] overflow-hidden ${ts.wrapper}`}
    >
      {/* Optional Top Hazard Accent Stripe */}
      {ts.hazard && (
        <div 
          className="absolute top-0 left-0 right-0 h-[1.2mm]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 3mm, #000 3mm, #000 6mm)'
          }}
        />
      )}

      {/* SECTION 1: Brand & Logo (Left ~48mm) */}
      <div className="w-[49mm] shrink-0 flex items-center gap-[2mm] pr-[1.8mm]">
        {/* Logo */}
        {stickerData.showLogo && (logoBase64 || stickerData.logoUrl) && (
          <div className="w-[20mm] h-[20mm] shrink-0 rounded-full bg-slate-900/60 p-[0.4mm] border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-inner">
            <img
              src={logoBase64 || stickerData.logoUrl}
              alt="Logo"
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Brand Text Stack */}
        <div className="flex-1 min-w-0 flex flex-col justify-center leading-none">
          {/* Badge Label */}
          {stickerData.badgeText && (
            <span 
              className={`inline-block self-start text-[6px] tracking-wider uppercase px-[1.2mm] py-[0.3mm] rounded-[0.8mm] font-extrabold mb-[0.8mm] ${ts.badge}`}
            >
              {stickerData.badgeText}
            </span>
          )}

          {/* Company Name */}
          <h3 
            className={`text-[10px] sm:text-[10.5px] font-black uppercase tracking-tight leading-[1.05] line-clamp-2 ${ts.title}`}
          >
            {stickerData.brandName}
          </h3>

          {/* Tagline */}
          {stickerData.tagline && (
            <p className={`text-[6.5px] font-medium leading-tight mt-[0.6mm] line-clamp-2 ${ts.sub}`}>
              {stickerData.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className={`w-[0.4mm] my-[1mm] shrink-0 ${ts.divider}`} />

      {/* SECTION 2: Contact Information (Center ~67mm) */}
      <div className="flex-1 px-[2.2mm] flex flex-col justify-between min-w-0 leading-tight">
        {/* Row 1: Phone Numbers with Icons */}
        <div className="flex items-center gap-[2.5mm] overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-[1mm] shrink-0">
            <div className={`p-[0.5mm] rounded-full bg-amber-500/20 ${ts.accent}`}>
              <Phone className="w-[2.6mm] h-[2.6mm]" />
            </div>
            <span className={`text-[8px] font-extrabold font-mono tracking-tight ${ts.contact}`}>
              {stickerData.phone1}
            </span>
          </div>

          {stickerData.phone2 && (
            <div className="flex items-center gap-[1mm] shrink-0">
              <span className={`text-[7px] font-bold ${ts.accent}`}>|</span>
              <span className={`text-[8px] font-extrabold font-mono tracking-tight ${ts.contact}`}>
                {stickerData.phone2}
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Website & Email */}
        <div className="flex items-center gap-[2mm] text-[6.8px] overflow-hidden whitespace-nowrap">
          {stickerData.websiteUrl && (
            <div className="flex items-center gap-[0.8mm] shrink-0">
              <Globe className={`w-[2.4mm] h-[2.4mm] ${ts.accent}`} />
              <span className={`font-bold ${ts.accent} truncate max-w-[34mm]`}>
                {stickerData.websiteUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          )}

          {stickerData.email && (
            <div className="flex items-center gap-[0.8mm] shrink-0">
              <Mail className={`w-[2.4mm] h-[2.4mm] ${ts.sub}`} />
              <span className={`font-medium ${ts.contact} truncate max-w-[30mm]`}>
                {stickerData.email}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Workshop Address */}
        <div className="flex items-center gap-[0.8mm] text-[6.5px] overflow-hidden leading-tight">
          <MapPin className={`w-[2.4mm] h-[2.4mm] shrink-0 ${ts.accent}`} />
          <span className={`font-medium truncate ${ts.contact}`}>
            {stickerData.address}
          </span>
        </div>

        {/* Optional Row 4: Job Tag / Warranty */}
        {(stickerData.showWarranty || stickerData.jobTag) && (
          <div className="flex items-center gap-[1.5mm] overflow-hidden">
            <div className={`inline-flex items-center gap-[0.8mm] px-[1.2mm] py-[0.2mm] rounded-[0.6mm] bg-amber-500/15 border border-amber-500/30 text-[5.8px] font-bold ${ts.accent}`}>
              <ShieldCheck className="w-[2.2mm] h-[2.2mm]" />
              <span className="truncate">
                {stickerData.jobTag ? `${stickerData.jobTag} • ` : ''}
                {stickerData.warrantyText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`w-[0.4mm] my-[1mm] shrink-0 ${ts.divider}`} />

      {/* SECTION 3: QR Code & Call to Action (Right ~28mm) */}
      <div className="w-[28mm] shrink-0 pl-[1.8mm] flex flex-col items-center justify-center leading-none">
        {/* High contrast QR Code Box (white quiet zone background ensures 100% scan reliability) */}
        <div className={`p-[0.6mm] bg-white rounded-[1.2mm] shadow-sm border ${ts.qrBorder}`}>
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Website QR"
              className="w-[19.5mm] h-[19.5mm] object-contain block"
            />
          ) : (
            <div className="w-[19.5mm] h-[19.5mm] bg-slate-200 flex items-center justify-center">
              <QrCode className="w-[12mm] h-[12mm] text-slate-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Scan Callout */}
        <div className="mt-[1mm] flex items-center justify-center gap-[0.6mm]">
          <span className={`text-[5.8px] font-extrabold uppercase tracking-wider text-center ${ts.qrText}`}>
            {stickerData.qrPrompt || 'SCAN TO VISIT'}
          </span>
        </div>
      </div>

      {/* Optional Bottom Hazard Accent Stripe */}
      {ts.hazard && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1.2mm]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 3mm, #000 3mm, #000 6mm)'
          }}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden Print Container specifically targeted for window.print() */}
      <div className="hidden print:block fixed inset-0 z-50 bg-white">
        {viewMode === 'sheet' ? (
          <div className="p-4 mx-auto max-w-[210mm] space-y-[3.5mm]">
            <p className="text-[10px] text-slate-500 text-center mb-2">
              {stickerData.brandName} — 15cm × 3cm Branded Product Stickers (Sheet of 8)
            </p>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="relative border border-dashed border-slate-300">
                {renderStickerNode(true)}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-0 m-0">
            {renderStickerNode(false)}
          </div>
        )}
      </div>

      {/* Permanent, Always-Mounted Hidden Render Node for Export (Guarantees Ref is never null in ANY view mode) */}
      <div 
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '150mm',
          height: '30mm',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -9999,
          opacity: 1,
        }}
      >
        <div ref={singleStickerRef} id="permanent-sticker-export-node">
          {renderStickerNode(false)}
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                {t('makeSticker') || 'Make Sticker'}
                <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-500 text-slate-950 uppercase">
                  15 cm × 3 cm
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Design & print branded product stickers with your workshop logo, contact details, and website QR code.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleResetToSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Reload default workshop settings"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Copy image to clipboard"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Copy Image</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition"
            title="Download high-resolution 300 DPI PNG (1772 × 354 px)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>300 DPI PNG</span>
          </button>

          <button
            onClick={handleDownloadSinglePDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-amber-500/30 transition shadow-sm"
            title="Download exact 15cm × 3cm Single Sticker PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single PDF</span>
          </button>

          <button
            onClick={handleDownloadSheetPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/25 active:scale-95"
            title="Download A4 Sheet with 8 Stickers & Cut Guides"
          >
            <Layers className="w-4 h-4" />
            <span>A4 Sheet (8) PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Customizer / Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Theme Selector Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Sticker Badge Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('industrial-dark')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  theme === 'industrial-dark'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-950 border border-amber-500" />
                <span className="text-xs font-bold leading-tight">Dark & Gold</span>
                <span className="text-[10px] text-slate-400">Workshop Signature</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('brushed-steel')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  theme === 'brushed-steel'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-300 border border-slate-500" />
                <span className="text-xs font-bold leading-tight">Stainless Steel</span>
                <span className="text-[10px] text-slate-400">Metallic Silver Plate</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('monochrome-clean')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  theme === 'monochrome-clean'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white border border-black" />
                <span className="text-xs font-bold leading-tight">Clean White</span>
                <span className="text-[10px] text-slate-400">Thermal / High Contrast</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('royal-navy')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  theme === 'royal-navy'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-blue-900 border border-amber-400" />
                <span className="text-xs font-bold leading-tight">Navy & Gold</span>
                <span className="text-[10px] text-slate-400">Corporate Quality</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('hazard-caution')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  theme === 'hazard-caution'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-amber-500 border border-black" />
                <span className="text-xs font-bold leading-tight">Industrial Caution</span>
                <span className="text-[10px] text-slate-400">Warning Stripes</span>
              </button>
            </div>
          </div>

          {/* Quick Pre-fill / Link Project */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2.5">
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                Link Job / Project (Optional)
              </span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">auto-tags job details</span>
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => handleLinkDoc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- No specific job (Standard Brand Sticker) --</option>
              <optgroup label="Recent Invoices">
                {invoices.slice(0, 10).map(inv => (
                  <option key={inv.id} value={`inv:${inv.id}`}>
                    {inv.invoiceNumber} — {inv.customerName} ({inv.projectName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Recent Quotations">
                {quotations.slice(0, 10).map(qt => (
                  <option key={qt.id} value={`qt:${qt.id}`}>
                    {qt.quotationNumber} — {qt.customerName} ({qt.projectName})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Content Customizer Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Wrench className="w-4 h-4 text-amber-400" />
              Sticker Text & Details
            </h3>

            {/* Brand Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Company / Workshop Name
              </label>
              <input
                type="text"
                value={stickerData.brandName}
                onChange={(e) => setStickerData(prev => ({ ...prev, brandName: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Vasantha Iron Works"
              />
            </div>

            {/* Badge Pill Label */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Header Badge Label
                </label>
                <input
                  type="text"
                  value={stickerData.badgeText}
                  onChange={(e) => setStickerData(prev => ({ ...prev, badgeText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. FABRICATED BY"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  QR Scan Prompt
                </label>
                <input
                  type="text"
                  value={stickerData.qrPrompt}
                  onChange={(e) => setStickerData(prev => ({ ...prev, qrPrompt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. SCAN TO VISIT"
                />
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={stickerData.tagline}
                onChange={(e) => setStickerData(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                placeholder="e.g. Custom Fabrication, Stainless Steel & Structural Welding Experts"
              />
            </div>

            {/* QR Code Target URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Website URL for QR Code
                </label>
                <a
                  href={sanitizeUrl(stickerData.websiteUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={stickerData.websiteUrl}
                  onChange={(e) => setStickerData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  placeholder="https://www.vasanthaironworks.com"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                When someone scans the sticker on the gate or railing with their phone camera, it instantly opens this site.
              </p>
            </div>

            {/* Phone 1 & Phone 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Primary Phone
                </label>
                <input
                  type="text"
                  value={stickerData.phone1}
                  onChange={(e) => setStickerData(prev => ({ ...prev, phone1: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="+94 77 123 4567"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Secondary Phone
                </label>
                <input
                  type="text"
                  value={stickerData.phone2}
                  onChange={(e) => setStickerData(prev => ({ ...prev, phone2: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="+94 11 291 8899"
                />
              </div>
            </div>

            {/* Email & Address */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={stickerData.email}
                  onChange={(e) => setStickerData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  placeholder="info@vasanthaironworks.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Workshop Location Address
                </label>
                <input
                  type="text"
                  value={stickerData.address}
                  onChange={(e) => setStickerData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  placeholder="No. 142, Kandy Road, Kiribathgoda"
                />
              </div>
            </div>

            {/* Warranty & Custom Note */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stickerData.showWarranty}
                    onChange={(e) => setStickerData(prev => ({ ...prev, showWarranty: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20 bg-slate-950 border-slate-800"
                  />
                  <span>Include Warranty / Job Badge</span>
                </label>
              </div>

              {stickerData.showWarranty && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={stickerData.warrantyText}
                    onChange={(e) => setStickerData(prev => ({ ...prev, warrantyText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 1-Year Welding Joints Warranty"
                  />
                </div>
              )}
            </div>

            {/* Logo Options */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLogoToggle"
                  checked={stickerData.showLogo}
                  onChange={(e) => setStickerData(prev => ({ ...prev, showLogo: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20 bg-slate-950 border-slate-800"
                />
                <label htmlFor="showLogoToggle" className="text-xs font-medium text-slate-300 cursor-pointer">
                  Display Workshop Logo
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>Change Logo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Preview & Print Formats (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Preview Controls Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Sticker Live Preview & Calibration
                </h3>
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('fit')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    viewMode === 'fit' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fit View (150%)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('actual')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    viewMode === 'actual' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Calibrated to exact 15cm × 3cm physical dimensions"
                >
                  Actual Size (15×3cm)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sheet')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    viewMode === 'sheet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="A4 Sheet layout with 8 stickers"
                >
                  A4 Sheet (8)
                </button>
              </div>
            </div>

            {/* 15 CM Centimeter Ruler Guide (Visible in Actual & Fit Mode) */}
            {viewMode !== 'sheet' && (
              <div className="overflow-x-auto pb-2">
                <div style={{ width: viewMode === 'actual' ? '150mm' : '100%', minWidth: '150mm' }} className="mx-auto select-none">
                  {/* Top Horizontal Centimeter Ruler */}
                  <div className="h-5 flex items-end border-b border-amber-500/40 text-[9px] font-mono text-amber-400/80 mb-1 px-[2.2mm]">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div 
                        key={i} 
                        style={{ width: i === 15 ? '0px' : '10mm' }} 
                        className="relative flex flex-col items-start"
                      >
                        <span className="text-[8px] -translate-x-1/2">{i === 15 ? '15cm' : i}</span>
                        <div className="w-[1px] h-2 bg-amber-500/60" />
                      </div>
                    ))}
                  </div>

                  {/* The Live Rendered Sticker Container */}
                  <div className="flex items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner overflow-x-auto">
                    <div 
                      style={{
                        transform: viewMode === 'fit' ? 'scale(1.25)' : 'none',
                        transformOrigin: 'center center',
                        margin: viewMode === 'fit' ? '15px 0' : '0',
                      }}
                      className="transition-transform duration-200 shadow-2xl"
                    >
                      {renderStickerNode(false)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* A4 Sheet Preview Mode */}
            {viewMode === 'sheet' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>A4 Paper Preview (210mm × 297mm) — 8 Identical Branded Stickers</span>
                  <span className="text-amber-400 font-bold">Standard Self-Adhesive Paper</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-3">
                  <div className="w-full max-w-[170mm] p-4 bg-white text-slate-900 rounded-lg shadow-2xl space-y-3 select-none">
                    <div className="text-center border-b border-slate-200 pb-2">
                      <p className="text-[10px] font-bold text-slate-600">
                        {stickerData.brandName} — Product Label Stickers (150mm × 30mm)
                      </p>
                      <p className="text-[8px] text-slate-400">
                        Print at 100% scale (No margins). Cut along the outer dashed guides.
                      </p>
                    </div>

                    {/* 8 Stickers on A4 Sheet */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="p-0.5 rounded border border-dashed border-slate-400 flex items-center justify-center"
                      >
                        <div className="scale-[0.85] origin-center my-[-2mm]">
                          {renderStickerNode(true)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dimension Specs & Practical Workshop Guidance */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 space-y-1">
                <p className="font-semibold text-slate-100">
                  Exact Output Dimensions: <span className="text-amber-400 font-bold">15 cm width × 3 cm height</span> (150 mm × 30 mm).
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ideal for sticking onto finished metal gates, stair railings, structural trusses, iron grills, canopy stands, or glass partitions before customer handover. The high-contrast QR code can be scanned instantly with any modern phone camera to drive customers directly to your website.
                </p>
              </div>
            </div>

            {/* Quick Action Print / Export Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Printer className="w-4 h-4 text-slate-300" />
                <span>Compatible with Roll Label Printers & A4 Sheet Paper</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print Window</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSheetPDF}
                  disabled={isExporting}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-amber-500/25 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sheet PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
