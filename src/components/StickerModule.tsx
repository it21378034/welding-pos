import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
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
  Info,
  Maximize2
} from 'lucide-react';

type StickerTheme = 'industrial-dark' | 'brushed-steel' | 'monochrome-clean' | 'royal-navy' | 'hazard-caution';
type ViewMode = 'fit' | 'actual' | 'sheet';

interface StickerData {
  widthCm: number;
  heightCm: number;
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
    widthCm: 15,
    heightCm: 3,
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
    warrantyText: 'Lifetime Welding Joints Warranty',
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

  // Calculate A4 sheet yield based on customized sticker size
  const calculateA4Yield = (wCm: number, hCm: number) => {
    const wMm = wCm * 10;
    const hMm = hCm * 10;
    const gap = 3;
    const usableW = 194; // 210mm - 16mm margins
    const usableH = 273; // 297mm - 24mm margins
    const cols = Math.max(1, Math.floor((usableW + gap) / (wMm + gap)));
    const rows = Math.max(1, Math.floor((usableH + gap) / (hMm + gap)));
    return { cols, rows, total: cols * rows };
  };

  // Reset to current company settings
  const handleResetToSettings = () => {
    setStickerData({
      widthCm: 15,
      heightCm: 3,
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
      warrantyText: 'Lifetime Welding Joints Warranty',
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

  // Helper to load image asynchronously for canvas drawing
  const loadCanvasImage = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  // Helper to draw rounded rectangle on canvas
  const drawCanvasRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  // Get hex color tokens for direct 2D canvas rendering (100% immune to oklch parser bugs)
  const getCanvasPalette = (t: StickerTheme) => {
    switch (t) {
      case 'brushed-steel':
        return {
          bgFrom: '#f1f5f9',
          bgTo: '#cbd5e1',
          borderColor: '#475569',
          borderWidth: 4,
          badgeBg: '#1e293b',
          badgeText: '#f8fafc',
          titleColor: '#0f172a',
          subColor: '#475569',
          dividerColor: 'rgba(71, 85, 105, 0.45)',
          phoneColor: '#0f172a',
          phoneAccent: '#1d4ed8',
          webColor: '#1d4ed8',
          contactColor: '#334155',
          qrBoxBorder: '#64748b',
          qrLabelColor: '#0f172a',
          hazard: false,
        };
      case 'monochrome-clean':
        return {
          bgFrom: '#ffffff',
          bgTo: '#ffffff',
          borderColor: '#000000',
          borderWidth: 5,
          badgeBg: '#000000',
          badgeText: '#ffffff',
          titleColor: '#000000',
          subColor: '#334155',
          dividerColor: 'rgba(0, 0, 0, 0.4)',
          phoneColor: '#000000',
          phoneAccent: '#000000',
          webColor: '#000000',
          contactColor: '#000000',
          qrBoxBorder: '#000000',
          qrLabelColor: '#000000',
          hazard: false,
        };
      case 'royal-navy':
        return {
          bgFrom: '#061226',
          bgTo: '#0c224a',
          borderColor: '#f59e0b',
          borderWidth: 4,
          badgeBg: '#f59e0b',
          badgeText: '#061226',
          titleColor: '#ffffff',
          subColor: '#93c5fd',
          dividerColor: 'rgba(245, 158, 11, 0.4)',
          phoneColor: '#ffffff',
          phoneAccent: '#f59e0b',
          webColor: '#f59e0b',
          contactColor: '#e2e8f0',
          qrBoxBorder: '#f59e0b',
          qrLabelColor: '#fde047',
          hazard: false,
        };
      case 'hazard-caution':
        return {
          bgFrom: '#18181b',
          bgTo: '#09090b',
          borderColor: '#eab308',
          borderWidth: 4,
          badgeBg: '#eab308',
          badgeText: '#000000',
          titleColor: '#ffffff',
          subColor: '#d4d4d8',
          dividerColor: 'rgba(234, 179, 8, 0.45)',
          phoneColor: '#ffffff',
          phoneAccent: '#eab308',
          webColor: '#eab308',
          contactColor: '#f4f4f5',
          qrBoxBorder: '#eab308',
          qrLabelColor: '#eab308',
          hazard: true,
        };
      case 'industrial-dark':
      default:
        return {
          bgFrom: '#090e17',
          bgTo: '#020617',
          borderColor: '#f59e0b',
          borderWidth: 4,
          badgeBg: '#f59e0b',
          badgeText: '#020617',
          titleColor: '#ffffff',
          subColor: '#94a3b8',
          dividerColor: 'rgba(245, 158, 11, 0.4)',
          phoneColor: '#ffffff',
          phoneAccent: '#f59e0b',
          webColor: '#f59e0b',
          contactColor: '#cbd5e1',
          qrBoxBorder: '#f59e0b',
          qrLabelColor: '#f59e0b',
          hazard: false,
        };
    }
  };

  // Direct native 2D Canvas rendering — dynamically scales with custom width & height
  // Direct native 2D Canvas rendering — perfectly proportional & aligned for ANY custom size
  const generateStickerCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement('canvas');
    const width = Math.round(stickerData.widthCm * 10 * 11.811);
    const height = Math.round(stickerData.heightCm * 10 * 11.811);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Proportional scale factor relative to standard 15cm x 3cm banner
    const sy = height / 354;
    const sx = width / 1772;
    const s = Math.max(0.45, Math.min(2.0, Math.min(sy, sx * 1.35)));

    const [logoImg, qrImg] = await Promise.all([
      stickerData.showLogo && (logoBase64 || stickerData.logoUrl)
        ? loadCanvasImage(logoBase64 || stickerData.logoUrl)
        : Promise.resolve(null),
      qrCodeDataUrl ? loadCanvasImage(qrCodeDataUrl) : Promise.resolve(null),
    ]);

    const cp = getCanvasPalette(theme);

    // 1. Draw rounded outer background
    drawCanvasRoundedRect(ctx, 4, 4, width - 8, height - 8, Math.round(16 * s));
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, cp.bgFrom);
    grad.addColorStop(1, cp.bgTo);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = cp.borderColor;
    ctx.lineWidth = cp.borderWidth;
    ctx.stroke();

    // Hazard stripes if active
    if (cp.hazard) {
      ctx.save();
      ctx.clip();
      const stripeH = Math.round(14 * s);
      for (let x = -50; x < width + 50; x += Math.round(36 * s)) {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.round(18 * s), 0);
        ctx.lineTo(x + Math.round(36 * s), stripeH);
        ctx.lineTo(x + Math.round(18 * s), stripeH);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, height - stripeH);
        ctx.lineTo(x + Math.round(18 * s), height - stripeH);
        ctx.lineTo(x + Math.round(36 * s), height);
        ctx.lineTo(x + Math.round(18 * s), height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    const padX = Math.round(20 * s);
    const padY = Math.round(16 * s);
    const innerH = height - 2 * padY;
    const aspectRatio = width / height;

    // =========================================================================
    // LAYOUT ENGINE: WIDE BANNER (Aspect Ratio >= 1.7, Standard Workshop Format)
    // =========================================================================
    if (aspectRatio >= 1.7) {
      // 1. COLUMN 3: QR Code (Right side)
      // Height-constrained QR square box with prompt below
      const qrBoxSize = Math.round(Math.max(36 * s, Math.min(innerH - 28 * s, width * 0.18)));
      const qrColWidth = qrBoxSize + Math.round(32 * s);
      const divider2X = width - padX - qrColWidth;

      // 2. COLUMN 1 & COLUMN 2: Proportional dynamic split
      const availableW = divider2X - padX - Math.round(24 * s);
      // Give Brand 40% and Contact 60% of available middle width
      const col1Width = Math.round(availableW * 0.40);
      const divider1X = padX + col1Width;

      // -----------------------------------------------------------------------
      // SECTION 1: Brand & Logo (Strictly bounded within [padX, divider1X])
      // -----------------------------------------------------------------------
      let brandTextX = padX;
      if (logoImg) {
        const logoSize = Math.round(Math.min(innerH - 8 * s, col1Width * 0.38, 220 * s));
        const logoX = padX + Math.round(4 * s);
        const logoY = padY + Math.round((innerH - logoSize) / 2);

        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'monochrome-clean' ? '#f1f5f9' : 'rgba(2, 6, 23, 0.7)';
        ctx.fill();
        ctx.strokeStyle = cp.dividerColor;
        ctx.lineWidth = Math.max(1.5, 2.5 * s);
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(logoImg, logoX + 6 * s, logoY + 6 * s, logoSize - 12 * s, logoSize - 12 * s);
        ctx.restore();

        brandTextX = logoX + logoSize + Math.round(14 * s);
      } else {
        brandTextX = padX + Math.round(8 * s);
      }

      // Maximum available width for brand text — strictly guarantees no crossing divider 1!
      const brandMaxW = Math.max(40, divider1X - brandTextX - Math.round(14 * s));

      // Badge Label (e.g. FABRICATED & INSTALLED BY)
      if (stickerData.badgeText) {
        ctx.font = `900 ${Math.round(12 * s)}px system-ui, -apple-system, sans-serif`;
        const badgeW = Math.min(brandMaxW, ctx.measureText(stickerData.badgeText.toUpperCase()).width + 16 * s);
        const badgeH = Math.round(24 * s);
        drawCanvasRoundedRect(ctx, brandTextX, Math.round(padY + 12 * s), badgeW, badgeH, Math.round(5 * s));
        ctx.fillStyle = cp.badgeBg;
        ctx.fill();

        ctx.fillStyle = cp.badgeText;
        ctx.fillText(stickerData.badgeText.toUpperCase(), brandTextX + 7 * s, Math.round(padY + 12 * s + badgeH * 0.7), badgeW - 14 * s);
      }

      // Company Name with dynamic font auto-scaler
      let brandFontSize = Math.round(Math.min(26 * s, innerH * 0.16));
      ctx.font = `900 ${brandFontSize}px system-ui, -apple-system, sans-serif`;
      while (ctx.measureText(stickerData.brandName.toUpperCase()).width > brandMaxW && brandFontSize > Math.round(11 * s)) {
        brandFontSize -= 1;
        ctx.font = `900 ${brandFontSize}px system-ui, -apple-system, sans-serif`;
      }
      ctx.fillStyle = cp.titleColor;
      const nameY = stickerData.badgeText ? Math.round(padY + innerH * 0.44) : Math.round(padY + innerH * 0.38);
      ctx.fillText(stickerData.brandName.toUpperCase(), brandTextX, nameY, brandMaxW);

      // Tagline
      if (stickerData.tagline) {
        let tagFontSize = Math.round(Math.min(14 * s, innerH * 0.09));
        ctx.font = `500 ${tagFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = cp.subColor;
        const tagY = stickerData.badgeText ? Math.round(padY + innerH * 0.65) : Math.round(padY + innerH * 0.58);
        ctx.fillText(stickerData.tagline, brandTextX, tagY, brandMaxW);
      }

      // Draw Divider 1
      ctx.beginPath();
      ctx.moveTo(divider1X, Math.round(padY + 8 * s));
      ctx.lineTo(divider1X, height - Math.round(padY + 8 * s));
      ctx.strokeStyle = cp.dividerColor;
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.stroke();

      // -----------------------------------------------------------------------
      // SECTION 2: Contact Information (Strictly bounded [divider1X, divider2X])
      // -----------------------------------------------------------------------
      const contactStartX = divider1X + Math.round(18 * s);
      const contactEndX = divider2X - Math.round(16 * s);
      const contactMaxW = Math.max(80, contactEndX - contactStartX);

      const hasWarrantyRow = stickerData.showWarranty || stickerData.jobTag;
      const numRows = hasWarrantyRow ? 4 : 3;
      const rowStep = innerH / (numRows + 0.35);

      // Row 1: Hotlines
      const row1Y = Math.round(padY + rowStep * 0.85);
      const phoneFontSize = Math.round(Math.min(22 * s, rowStep * 0.44));
      ctx.font = `800 ${phoneFontSize}px monospace, system-ui`;
      ctx.fillStyle = cp.phoneAccent;
      ctx.fillText('📞', contactStartX, row1Y);
      const phoneIconW = ctx.measureText('📞 ').width;

      ctx.fillStyle = cp.phoneColor;
      const phoneText = `${stickerData.phone1}${stickerData.phone2 ? `   |   ${stickerData.phone2}` : ''}`;
      ctx.fillText(phoneText, contactStartX + phoneIconW, row1Y, contactMaxW - phoneIconW);

      // Row 2: Website & Email
      const row2Y = Math.round(padY + rowStep * 1.8);
      const webEmailFontSize = Math.round(Math.min(18 * s, rowStep * 0.36));
      ctx.font = `700 ${webEmailFontSize}px system-ui, -apple-system, sans-serif`;

      let curX = contactStartX;
      if (stickerData.websiteUrl) {
        ctx.fillStyle = cp.webColor;
        const webDisplay = '🌐 ' + stickerData.websiteUrl.replace(/^https?:\/\//, '');
        const maxWebW = stickerData.email ? Math.round(contactMaxW * 0.54) : contactMaxW;
        ctx.fillText(webDisplay, curX, row2Y, maxWebW);
        const actualWebW = Math.min(maxWebW, ctx.measureText(webDisplay).width);
        curX += actualWebW + Math.round(18 * s);
      }

      if (stickerData.email && curX < contactEndX - Math.round(40 * s)) {
        ctx.fillStyle = cp.contactColor;
        const maxEmailW = contactEndX - curX;
        ctx.fillText('✉ ' + stickerData.email, curX, row2Y, maxEmailW);
      }

      // Row 3: Address
      const row3Y = Math.round(padY + rowStep * 2.7);
      const addrFontSize = Math.round(Math.min(16 * s, rowStep * 0.33));
      ctx.font = `500 ${addrFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = cp.contactColor;
      ctx.fillText('📍 ' + stickerData.address, contactStartX, row3Y, contactMaxW);

      // Row 4: Warranty or Job Tag
      if (hasWarrantyRow) {
        const row4Y = Math.round(padY + rowStep * 3.55);
        const badgeStr = `🛡 ${stickerData.jobTag ? `${stickerData.jobTag}  •  ` : ''}${stickerData.warrantyText}`;
        const badgeFontSize = Math.round(Math.min(15 * s, rowStep * 0.32));
        ctx.font = `700 ${badgeFontSize}px system-ui, -apple-system, sans-serif`;
        const badgeW = Math.min(contactMaxW, ctx.measureText(badgeStr).width + Math.round(18 * s));
        const badgeH = Math.round(Math.min(30 * s, rowStep * 0.60));

        drawCanvasRoundedRect(ctx, contactStartX, row4Y - Math.round(badgeH * 0.72), badgeW, badgeH, Math.round(5 * s));
        ctx.fillStyle = cp.dividerColor;
        ctx.fill();
        ctx.strokeStyle = cp.borderColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = cp.phoneAccent;
        ctx.fillText(badgeStr, contactStartX + Math.round(9 * s), row4Y, badgeW - Math.round(18 * s));
      }

      // Draw Divider 2
      ctx.beginPath();
      ctx.moveTo(divider2X, Math.round(padY + 8 * s));
      ctx.lineTo(divider2X, height - Math.round(padY + 8 * s));
      ctx.strokeStyle = cp.dividerColor;
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.stroke();

      // -----------------------------------------------------------------------
      // SECTION 3: QR Code & Call to Action (Centered in qrColWidth)
      // -----------------------------------------------------------------------
      const qrColInnerW = width - padX - divider2X;
      const qrBoxX = Math.round(divider2X + (qrColInnerW - qrBoxSize) / 2);
      const qrBoxY = Math.round(padY + (innerH - qrBoxSize - Math.round(24 * s)) / 2);

      drawCanvasRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, Math.round(12 * s));
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = cp.qrBoxBorder;
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.stroke();

      if (qrImg) {
        const qrPad = Math.round(8 * s);
        ctx.drawImage(qrImg, qrBoxX + qrPad, qrBoxY + qrPad, qrBoxSize - 2 * qrPad, qrBoxSize - 2 * qrPad);
      }

      ctx.font = `900 ${Math.round(Math.min(15 * s, qrColInnerW * 0.12))}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = cp.qrLabelColor;
      ctx.textAlign = 'center';
      ctx.fillText(
        (stickerData.qrPrompt || 'SCAN TO VISIT').toUpperCase(),
        qrBoxX + qrBoxSize / 2,
        qrBoxY + qrBoxSize + Math.round(22 * s),
        qrColInnerW - Math.round(8 * s)
      );
      ctx.textAlign = 'left';

    } else {
      // =======================================================================
      // LAYOUT ENGINE: COMPACT / SQUARISH (Aspect Ratio < 1.7, e.g. 6cm x 6cm)
      // =======================================================================
      const topH = Math.round(height * 0.32);
      const midDividerY = padY + topH;

      // Top Header: Logo + Brand + Tagline
      let topTextX = padX + Math.round(8 * s);
      if (logoImg) {
        const logoSize = Math.round(Math.min(topH - 8 * s, 180 * s));
        const logoX = padX + Math.round(6 * s);
        const logoY = padY + Math.round((topH - logoSize) / 2);

        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'monochrome-clean' ? '#f1f5f9' : 'rgba(2, 6, 23, 0.7)';
        ctx.fill();
        ctx.strokeStyle = cp.dividerColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(logoImg, logoX + 4 * s, logoY + 4 * s, logoSize - 8 * s, logoSize - 8 * s);
        ctx.restore();

        topTextX = logoX + logoSize + Math.round(14 * s);
      }

      const topMaxW = width - padX - topTextX - Math.round(10 * s);

      if (stickerData.badgeText) {
        ctx.font = `900 ${Math.round(11 * s)}px system-ui, -apple-system, sans-serif`;
        const badgeW = Math.min(topMaxW, ctx.measureText(stickerData.badgeText.toUpperCase()).width + 14 * s);
        drawCanvasRoundedRect(ctx, topTextX, padY + Math.round(4 * s), badgeW, Math.round(20 * s), Math.round(4 * s));
        ctx.fillStyle = cp.badgeBg;
        ctx.fill();
        ctx.fillStyle = cp.badgeText;
        ctx.fillText(stickerData.badgeText.toUpperCase(), topTextX + 6 * s, padY + Math.round(18 * s), badgeW - 12 * s);
      }

      ctx.fillStyle = cp.titleColor;
      let brandFontSize = Math.round(20 * s);
      ctx.font = `900 ${brandFontSize}px system-ui, -apple-system, sans-serif`;
      while (ctx.measureText(stickerData.brandName.toUpperCase()).width > topMaxW && brandFontSize > Math.round(10 * s)) {
        brandFontSize -= 1;
        ctx.font = `900 ${brandFontSize}px system-ui, -apple-system, sans-serif`;
      }
      const topNameY = stickerData.badgeText ? padY + Math.round(44 * s) : padY + Math.round(28 * s);
      ctx.fillText(stickerData.brandName.toUpperCase(), topTextX, topNameY, topMaxW);

      if (stickerData.tagline) {
        ctx.fillStyle = cp.subColor;
        ctx.font = `500 ${Math.round(12 * s)}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(stickerData.tagline, topTextX, topNameY + Math.round(20 * s), topMaxW);
      }

      // Horizontal Divider
      ctx.beginPath();
      ctx.moveTo(padX + Math.round(6 * s), midDividerY);
      ctx.lineTo(width - padX - Math.round(6 * s), midDividerY);
      ctx.strokeStyle = cp.dividerColor;
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.stroke();

      // Bottom Area Split: Left = Contact Info (~62%), Right = QR Code (~38%)
      const bottomY = midDividerY + Math.round(14 * s);
      const bottomH = height - padY - bottomY;
      const qrColW = Math.round((width - 2 * padX) * 0.38);
      const vertDividerX = width - padX - qrColW;
      const contactStartX = padX + Math.round(8 * s);
      const contactMaxW = vertDividerX - contactStartX - Math.round(14 * s);

      // Contact Rows
      const bRowStep = bottomH / 4.2;
      ctx.font = `800 ${Math.round(Math.min(18 * s, bRowStep * 0.42))}px monospace, system-ui`;
      ctx.fillStyle = cp.phoneColor;
      ctx.fillText(`📞 ${stickerData.phone1}`, contactStartX, bottomY + bRowStep * 0.8, contactMaxW);

      if (stickerData.phone2) {
        ctx.fillText(`📞 ${stickerData.phone2}`, contactStartX, bottomY + bRowStep * 1.6, contactMaxW);
      } else if (stickerData.websiteUrl) {
        ctx.font = `700 ${Math.round(Math.min(15 * s, bRowStep * 0.35))}px system-ui`;
        ctx.fillStyle = cp.webColor;
        ctx.fillText(`🌐 ${stickerData.websiteUrl.replace(/^https?:\/\//, '')}`, contactStartX, bottomY + bRowStep * 1.6, contactMaxW);
      }

      ctx.font = `500 ${Math.round(Math.min(14 * s, bRowStep * 0.33))}px system-ui`;
      ctx.fillStyle = cp.contactColor;
      ctx.fillText(`📍 ${stickerData.address}`, contactStartX, bottomY + bRowStep * 2.5, contactMaxW);

      if (stickerData.showWarranty || stickerData.jobTag) {
        const badgeStr = `🛡 ${stickerData.warrantyText}`;
        ctx.font = `700 ${Math.round(Math.min(13 * s, bRowStep * 0.30))}px system-ui`;
        ctx.fillStyle = cp.phoneAccent;
        ctx.fillText(badgeStr, contactStartX, bottomY + bRowStep * 3.4, contactMaxW);
      }

      // Vertical Divider in bottom section
      ctx.beginPath();
      ctx.moveTo(vertDividerX, midDividerY + Math.round(6 * s));
      ctx.lineTo(vertDividerX, height - padY - Math.round(6 * s));
      ctx.strokeStyle = cp.dividerColor;
      ctx.lineWidth = Math.max(1.5, 2 * s);
      ctx.stroke();

      // QR Code in bottom right
      const qrBoxSize = Math.round(Math.min(bottomH - 26 * s, qrColW - 16 * s));
      const qrBoxX = Math.round(vertDividerX + (qrColW - qrBoxSize) / 2);
      const qrBoxY = Math.round(bottomY + (bottomH - qrBoxSize - 22 * s) / 2);

      drawCanvasRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, Math.round(10 * s));
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = cp.qrBoxBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (qrImg) {
        const qrPad = Math.round(6 * s);
        ctx.drawImage(qrImg, qrBoxX + qrPad, qrBoxY + qrPad, qrBoxSize - 2 * qrPad, qrBoxSize - 2 * qrPad);
      }

      ctx.font = `900 ${Math.round(13 * s)}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = cp.qrLabelColor;
      ctx.textAlign = 'center';
      ctx.fillText(
        (stickerData.qrPrompt || 'SCAN TO VISIT').toUpperCase(),
        qrBoxX + qrBoxSize / 2,
        qrBoxY + qrBoxSize + Math.round(18 * s),
        qrColW - Math.round(8 * s)
      );
      ctx.textAlign = 'left';
    }

    return canvas;
  };

  // Download Single Sticker PDF with customized size
  const handleDownloadSinglePDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateStickerCanvas();
      if (!canvas) throw new Error('Sticker canvas element not available');

      const imgData = canvas.toDataURL('image/png');
      const isLandscape = stickerData.widthCm >= stickerData.heightCm;
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: isLandscape 
          ? [stickerData.heightCm * 10, stickerData.widthCm * 10]
          : [stickerData.widthCm * 10, stickerData.heightCm * 10],
      });

      doc.addImage(imgData, 'PNG', 0, 0, stickerData.widthCm * 10, stickerData.heightCm * 10);
      const cleanName = (stickerData.brandName || 'sticker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      doc.save(`${cleanName}-sticker-${stickerData.widthCm}x${stickerData.heightCm}cm.pdf`);
      showToast(`${stickerData.widthCm}cm × ${stickerData.heightCm}cm Single Sticker PDF downloaded!`, 'success');
    } catch (err) {
      console.error('Error generating single PDF:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to generate sticker PDF: ${msg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Download A4 Sheet PDF dynamically calculated for current sticker size
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

      const stickerWMm = stickerData.widthCm * 10;
      const stickerHMm = stickerData.heightCm * 10;
      const gap = 3;
      const { cols, rows, total } = calculateA4Yield(stickerData.widthCm, stickerData.heightCm);

      const totalGridW = cols * stickerWMm + (cols - 1) * gap;
      const totalGridH = rows * stickerHMm + (rows - 1) * gap;

      const startX = (210 - totalGridW) / 2;
      const startY = 14 + Math.max(0, (273 - totalGridH) / 2);

      // Header on A4 sheet
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${stickerData.brandName} — ${stickerData.widthCm}cm × ${stickerData.heightCm}cm Branded Product Stickers (Sheet of ${total})`, 105, 9, { align: 'center' });
      doc.text(`Print at 100% Scale / Actual Size on A4 Adhesive Sticker Paper. Cut along dashed lines.`, 105, 12.5, { align: 'center' });

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const curX = startX + c * (stickerWMm + gap);
          const curY = startY + r * (stickerHMm + gap);
          doc.addImage(imgData, 'PNG', curX, curY, stickerWMm, stickerHMm);

          doc.setDrawColor(180, 185, 195);
          doc.setLineWidth(0.2);
          try {
            doc.setLineDashPattern([2, 2], 0);
          } catch (_) {}
          doc.rect(curX, curY, stickerWMm, stickerHMm);
        }
      }

      const cleanName = (stickerData.brandName || 'sticker').toLowerCase().replace(/[^a-z0-9]/g, '-');
      doc.save(`${cleanName}-stickers-${stickerData.widthCm}x${stickerData.heightCm}cm-sheet.pdf`);
      showToast(`A4 Sticker Sheet PDF (${total} Stickers) downloaded!`, 'success');
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
      link.download = `${cleanName}-sticker-${stickerData.widthCm}x${stickerData.heightCm}cm-300dpi.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(`High-Res 300 DPI PNG (${canvas.width} × ${canvas.height} px) downloaded!`, 'success');
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

  // Single sticker component rendered with customized physical dimensions
  const renderStickerNode = (_isSheetInstance = false) => {
    const isWide = stickerData.widthCm / stickerData.heightCm >= 1.7;
    const hMm = stickerData.heightCm * 10;
    const wMm = stickerData.widthCm * 10;
    const logoSizeMm = Math.max(8, Math.min(hMm - 5, 22));
    const qrSizeMm = Math.max(9, Math.min(hMm - 6.5, wMm * 0.19, 23));

    return (
      <div
        style={{
          width: `${stickerData.widthCm}cm`,
          height: `${stickerData.heightCm}cm`,
          boxSizing: 'border-box',
        }}
        className={`sticker-render-root relative select-none flex items-stretch p-[2mm] rounded-[1.5mm] overflow-hidden ${ts.wrapper}`}
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

        {isWide ? (
          <>
            {/* SECTION 1: Brand & Logo (~38% width) */}
            <div className="flex-[3.8] min-w-0 flex items-center gap-[1.8mm] pr-[1.5mm]">
              {/* Logo */}
              {stickerData.showLogo && (logoBase64 || stickerData.logoUrl) && (
                <div 
                  style={{ width: `${logoSizeMm}mm`, height: `${logoSizeMm}mm` }}
                  className="shrink-0 rounded-full bg-slate-900/60 p-[0.4mm] border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-inner"
                >
                  <img
                    src={logoBase64 || stickerData.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Brand Text Stack */}
              <div className="flex-1 min-w-0 flex flex-col justify-center leading-none overflow-hidden">
                {/* Badge Label */}
                {stickerData.badgeText && (
                  <span 
                    className={`inline-block self-start text-[6px] tracking-wider uppercase px-[1.2mm] py-[0.3mm] rounded-[0.8mm] font-extrabold mb-[0.8mm] truncate max-w-full ${ts.badge}`}
                  >
                    {stickerData.badgeText}
                  </span>
                )}

                {/* Company Name */}
                <h3 
                  className={`text-[9.5px] sm:text-[10px] font-black uppercase tracking-tight leading-[1.05] truncate ${ts.title}`}
                  title={stickerData.brandName}
                >
                  {stickerData.brandName}
                </h3>

                {/* Tagline */}
                {stickerData.tagline && (
                  <p className={`text-[6.2px] font-medium leading-tight mt-[0.5mm] truncate ${ts.sub}`}>
                    {stickerData.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Divider 1 */}
            <div className={`w-[0.4mm] my-[1mm] shrink-0 ${ts.divider}`} />

            {/* SECTION 2: Contact Information (~45% width) */}
            <div className="flex-[4.8] px-[2mm] flex flex-col justify-between min-w-0 leading-tight overflow-hidden">
              {/* Row 1: Phone Numbers */}
              <div className="flex items-center gap-[2mm] overflow-hidden whitespace-nowrap">
                <div className="flex items-center gap-[0.8mm] shrink-0">
                  <div className={`p-[0.4mm] rounded-full bg-amber-500/20 ${ts.accent}`}>
                    <Phone className="w-[2.4mm] h-[2.4mm]" />
                  </div>
                  <span className={`text-[7.8px] font-extrabold font-mono tracking-tight ${ts.contact}`}>
                    {stickerData.phone1}
                  </span>
                </div>

                {stickerData.phone2 && (
                  <div className="flex items-center gap-[0.8mm] shrink-0">
                    <span className={`text-[6.5px] font-bold ${ts.accent}`}>|</span>
                    <span className={`text-[7.8px] font-extrabold font-mono tracking-tight ${ts.contact}`}>
                      {stickerData.phone2}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 2: Website & Email */}
              <div className="flex items-center gap-[1.8mm] text-[6.5px] overflow-hidden whitespace-nowrap">
                {stickerData.websiteUrl && (
                  <div className="flex items-center gap-[0.7mm] shrink-0">
                    <Globe className={`w-[2.2mm] h-[2.2mm] ${ts.accent}`} />
                    <span className={`font-bold ${ts.accent} truncate max-w-[32mm]`}>
                      {stickerData.websiteUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                )}

                {stickerData.email && (
                  <div className="flex items-center gap-[0.7mm] shrink-0">
                    <Mail className={`w-[2.2mm] h-[2.2mm] ${ts.sub}`} />
                    <span className={`font-medium ${ts.contact} truncate max-w-[28mm]`}>
                      {stickerData.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 3: Workshop Address */}
              <div className="flex items-center gap-[0.7mm] text-[6.2px] overflow-hidden leading-tight">
                <MapPin className={`w-[2.2mm] h-[2.2mm] shrink-0 ${ts.accent}`} />
                <span className={`font-medium truncate ${ts.contact}`}>
                  {stickerData.address}
                </span>
              </div>

              {/* Row 4: Warranty Badge */}
              {(stickerData.showWarranty || stickerData.jobTag) && (
                <div className="flex items-center gap-[1.2mm] overflow-hidden">
                  <div className={`inline-flex items-center gap-[0.8mm] px-[1.2mm] py-[0.2mm] rounded-[0.6mm] bg-amber-500/15 border border-amber-500/30 text-[5.5px] font-bold ${ts.accent}`}>
                    <ShieldCheck className="w-[2mm] h-[2mm]" />
                    <span className="truncate">
                      {stickerData.jobTag ? `${stickerData.jobTag} • ` : ''}
                      {stickerData.warrantyText}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider 2 */}
            <div className={`w-[0.4mm] my-[1mm] shrink-0 ${ts.divider}`} />

            {/* SECTION 3: QR Code (~17% width) */}
            <div className="flex-[1.8] shrink-0 pl-[1.5mm] flex flex-col items-center justify-center leading-none">
              <div className={`p-[0.5mm] bg-white rounded-[1.2mm] shadow-sm border ${ts.qrBorder}`}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Website QR"
                    style={{ width: `${qrSizeMm}mm`, height: `${qrSizeMm}mm` }}
                    className="object-contain block"
                  />
                ) : (
                  <div 
                    style={{ width: `${qrSizeMm}mm`, height: `${qrSizeMm}mm` }}
                    className="bg-slate-200 flex items-center justify-center"
                  >
                    <QrCode className="w-[10mm] h-[10mm] text-slate-500 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="mt-[0.8mm] flex items-center justify-center">
                <span className={`text-[5.4px] font-extrabold uppercase tracking-wider text-center truncate ${ts.qrText}`}>
                  {stickerData.qrPrompt || 'SCAN TO VISIT'}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* SQUARISH COMPACT LAYOUT */
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-[1.5mm] pb-[1mm] border-b border-amber-500/30">
              {stickerData.showLogo && (logoBase64 || stickerData.logoUrl) && (
                <div 
                  style={{ width: `${logoSizeMm}mm`, height: `${logoSizeMm}mm` }}
                  className="shrink-0 rounded-full bg-slate-900/60 p-[0.3mm] border border-amber-500/40 flex items-center justify-center overflow-hidden"
                >
                  <img src={logoBase64 || stickerData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className={`text-[9px] font-black uppercase truncate ${ts.title}`}>{stickerData.brandName}</h3>
                {stickerData.tagline && <p className={`text-[6px] truncate ${ts.sub}`}>{stickerData.tagline}</p>}
              </div>
            </div>

            <div className="flex-1 pt-[1mm] flex items-center justify-between gap-[1.5mm] overflow-hidden">
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full text-[6.2px]">
                <span className={`font-mono font-bold truncate ${ts.contact}`}>📞 {stickerData.phone1}</span>
                {stickerData.websiteUrl && <span className={`truncate font-bold ${ts.accent}`}>🌐 {stickerData.websiteUrl.replace(/^https?:\/\//, '')}</span>}
                <span className={`truncate ${ts.contact}`}>📍 {stickerData.address}</span>
                <span className={`truncate text-[5.5px] font-bold text-amber-400`}>🛡 {stickerData.warrantyText}</span>
              </div>

              <div className="shrink-0 flex flex-col items-center">
                <div className={`p-[0.5mm] bg-white rounded border ${ts.qrBorder}`}>
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="QR" style={{ width: `${qrSizeMm}mm`, height: `${qrSizeMm}mm` }} className="object-contain block" />
                  )}
                </div>
                <span className={`text-[5px] font-bold mt-[0.5mm] ${ts.qrText}`}>SCAN</span>
              </div>
            </div>
          </div>
        )}

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
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden Print Container specifically targeted for window.print() */}
      <div className="hidden print:block fixed inset-0 z-50 bg-white">
        {viewMode === 'sheet' ? (
          <div className="p-4 mx-auto max-w-[210mm] space-y-[3.5mm]">
            <p className="text-[10px] text-slate-500 text-center mb-2">
              {stickerData.brandName} — {stickerData.widthCm}cm × {stickerData.heightCm}cm Branded Product Stickers (Sheet of {calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total})
            </p>
            {Array.from({ length: calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total }).map((_, idx) => (
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
                  {stickerData.widthCm} cm × {stickerData.heightCm} cm
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
            title={`Download high-resolution 300 DPI PNG (${Math.round(stickerData.widthCm * 10 * 11.811)} × ${Math.round(stickerData.heightCm * 10 * 11.811)} px)`}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>300 DPI PNG</span>
          </button>

          <button
            onClick={handleDownloadSinglePDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-amber-500/30 transition shadow-sm"
            title={`Download exact ${stickerData.widthCm}cm × ${stickerData.heightCm}cm Single Sticker PDF`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single PDF</span>
          </button>

          <button
            onClick={handleDownloadSheetPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/25 active:scale-95"
            title={`Download A4 Sheet with ${calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total} Stickers & Cut Guides`}
          >
            <Layers className="w-4 h-4" />
            <span>A4 Sheet ({calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total}) PDF</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Customizer / Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Size Customizer Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Sticker Dimensions (Customizable)</span>
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stickerData.widthCm} cm × {stickerData.heightCm} cm
              </span>
            </div>

            {/* Quick Size Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Standard', w: 15, h: 3, desc: '15 × 3 cm' },
                { label: 'Compact', w: 10, h: 2.5, desc: '10 × 2.5 cm' },
                { label: 'Medium', w: 12, h: 3, desc: '12 × 3 cm' },
                { label: 'Large Plate', w: 18, h: 4, desc: '18 × 4 cm' },
                { label: 'Slim Strip', w: 14, h: 2, desc: '14 × 2 cm' },
                { label: 'Square Badge', w: 6, h: 6, desc: '6 × 6 cm' },
              ].map((preset) => {
                const isSelected = stickerData.widthCm === preset.w && stickerData.heightCm === preset.h;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setStickerData(prev => ({ ...prev, widthCm: preset.w, heightCm: preset.h }))}
                    className={`p-2 rounded-xl border text-left transition flex flex-col ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{preset.label}</span>
                    <span className="text-[10px] text-slate-400">{preset.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Width & Height Number Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Custom Width
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="4"
                    max="30"
                    step="0.5"
                    value={stickerData.widthCm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 15;
                      setStickerData(prev => ({ ...prev, widthCm: Math.max(4, Math.min(30, val)) }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-bold">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Custom Height
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1.5"
                    max="15"
                    step="0.5"
                    value={stickerData.heightCm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 3;
                      setStickerData(prev => ({ ...prev, heightCm: Math.max(1.5, Math.min(15, val)) }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-bold">cm</span>
                </div>
              </div>
            </div>

            {/* Yield Info Pill */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span>A4 Paper Yield:</span>
              <span className="text-amber-400 font-bold">
                {calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total} stickers per A4 sheet
              </span>
            </div>
          </div>
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
                  title={`Calibrated to exact ${stickerData.widthCm}cm × ${stickerData.heightCm}cm physical dimensions`}
                >
                  Actual Size ({stickerData.widthCm}×{stickerData.heightCm}cm)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sheet')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    viewMode === 'sheet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`A4 Sheet layout with ${calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total} stickers`}
                >
                  A4 Sheet ({calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total})
                </button>
              </div>
            </div>

            {/* Dynamic Centimeter Ruler Guide (Visible in Actual & Fit Mode) */}
            {viewMode !== 'sheet' && (
              <div className="overflow-x-auto pb-2">
                <div style={{ width: viewMode === 'actual' ? `${stickerData.widthCm * 10}mm` : '100%', minWidth: `${stickerData.widthCm * 10}mm` }} className="mx-auto select-none">
                  {/* Top Horizontal Centimeter Ruler */}
                  <div className="h-5 flex items-end border-b border-amber-500/40 text-[9px] font-mono text-amber-400/80 mb-1 px-[2.2mm]">
                    {Array.from({ length: Math.ceil(stickerData.widthCm) + 1 }).map((_, i) => (
                      <div 
                        key={i} 
                        style={{ width: i === Math.ceil(stickerData.widthCm) ? '0px' : '10mm' }} 
                        className="relative flex flex-col items-start"
                      >
                        <span className="text-[8px] -translate-x-1/2">{i === Math.ceil(stickerData.widthCm) ? `${stickerData.widthCm}cm` : i}</span>
                        <div className="w-[1px] h-2 bg-amber-500/60" />
                      </div>
                    ))}
                  </div>

                  {/* The Live Rendered Sticker Container */}
                  <div className="flex items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner overflow-x-auto">
                    <div 
                      style={{
                        transform: viewMode === 'fit' ? 'scale(1.2)' : 'none',
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
                  <span>A4 Paper Preview (210mm × 297mm) — {calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total} Identical Branded Stickers</span>
                  <span className="text-amber-400 font-bold">Standard Self-Adhesive Paper</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-3">
                  <div className="w-full max-w-[190mm] p-4 bg-white text-slate-900 rounded-lg shadow-2xl space-y-3 select-none">
                    <div className="text-center border-b border-slate-200 pb-2">
                      <p className="text-[10px] font-bold text-slate-600">
                        {stickerData.brandName} — Product Label Stickers ({stickerData.widthCm * 10}mm × {stickerData.heightCm * 10}mm)
                      </p>
                      <p className="text-[8px] text-slate-400">
                        Print at 100% scale (No margins). Cut along the outer dashed guides ({calculateA4Yield(stickerData.widthCm, stickerData.heightCm).cols} cols × {calculateA4Yield(stickerData.widthCm, stickerData.heightCm).rows} rows = {calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total} labels per A4 sheet).
                      </p>
                    </div>

                    {/* Dynamic Grid of Stickers on A4 Sheet */}
                    <div 
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${calculateA4Yield(stickerData.widthCm, stickerData.heightCm).cols}, minmax(0, 1fr))`
                      }}
                    >
                      {Array.from({ length: calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total }).map((_, i) => (
                        <div 
                          key={i} 
                          className="p-0.5 rounded border border-dashed border-slate-400 flex items-center justify-center overflow-hidden"
                        >
                          <div className="scale-[0.8] origin-center my-[-2mm]">
                            {renderStickerNode(true)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dimension Specs & Practical Workshop Guidance */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-slate-300 space-y-1">
                <p className="font-semibold text-slate-100">
                  Exact Output Dimensions: <span className="text-amber-400 font-bold">{stickerData.widthCm} cm width × {stickerData.heightCm} cm height</span> ({stickerData.widthCm * 10} mm × {stickerData.heightCm * 10} mm).
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
                  <span>Download A4 Sheet PDF ({calculateA4Yield(stickerData.widthCm, stickerData.heightCm).total} Labels)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
