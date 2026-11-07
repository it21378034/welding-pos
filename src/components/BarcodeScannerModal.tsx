import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Scan, 
  Search, 
  X, 
  Printer, 
  Receipt, 
  FileText, 
  ShoppingCart, 
  ExternalLink, 
  AlertCircle, 
  Camera, 
  Keyboard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { findDocumentByBarcode, type MatchedDocumentResult } from '../lib/barcodeUtils';
import { Barcode } from './Barcode';
import type { Quotation, Invoice, PurchaseList } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (result: MatchedDocumentResult) => void;
  initialCode?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
  initialCode = '',
}) => {
  const { 
    quotations, 
    invoices, 
    purchaseLists, 
    setActivePrintDocument, 
    setActiveTab, 
    settings
  } = useApp();

  const [scanInput, setScanInput] = useState(initialCode);
  const [activeMode, setActiveMode] = useState<'input' | 'camera'>('input');
  const [matchResult, setMatchResult] = useState<MatchedDocumentResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle camera stream cleanup
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Lookup function
  const handleLookup = useCallback((codeToSearch: string) => {
    const trimmed = codeToSearch.trim();
    if (!trimmed) {
      setMatchResult(null);
      setSearched(false);
      return;
    }

    setSearched(true);
    const result = findDocumentByBarcode(trimmed, quotations, invoices, purchaseLists);
    setMatchResult(result);

    if (result && onSelectDocument) {
      onSelectDocument(result);
    }
  }, [quotations, invoices, purchaseLists, onSelectDocument]);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setScanInput(initialCode);
      setSearched(false);
      setMatchResult(null);
      if (initialCode) {
        handleLookup(initialCode);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    } else {
      stopCamera();
    }
  }, [isOpen, initialCode, handleLookup, stopCamera]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDownEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopCamera();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDownEsc);
    return () => window.removeEventListener('keydown', handleKeyDownEsc);
  }, [isOpen, onClose, stopCamera]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup(scanInput);
    }
  };

  // Start Camera Scanning
  const startCamera = async () => {
    setActiveMode('camera');
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanVideoFrames();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Unable to access camera.');
    }
  };

  // Live video frame barcode detection
  const scanVideoFrames = async () => {
    // Check if standard browser BarcodeDetector is available
    // @ts-ignore
    if ('BarcodeDetector' in window) {
      try {
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'qr_code', 'ean_13', 'ean_8', 'upc_a']
        });

        const checkFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(checkFrame);
            return;
          }

          try {
            const detected = await barcodeDetector.detect(videoRef.current);
            if (detected && detected.length > 0) {
              const rawVal = detected[0].rawValue;
              if (rawVal) {
                setScanInput(rawVal);
                handleLookup(rawVal);
                stopCamera();
                setActiveMode('input');
                return;
              }
            }
          } catch {
            // frame detection error, continue next frame
          }

          animationFrameRef.current = requestAnimationFrame(checkFrame);
        };

        checkFrame();
        return;
      } catch (detectorErr) {
        console.warn('BarcodeDetector initialization fallback:', detectorErr);
      }
    }

    // Fallback message if native detector unavailable in browser
    setCameraError('Live camera barcode detection requires Chrome or Edge with BarcodeDetector. You can use a USB/Bluetooth barcode gun or enter the number above.');
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={() => {
        stopCamera();
        onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scan className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-lg leading-tight flex items-center gap-2">
                Barcode Scanner & Quick Lookup
              </h3>
              <p className="text-xs text-slate-400">
                Scan or enter any Quotation, Invoice, or Purchase List barcode
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 font-bold text-xs transition shadow-sm"
            title="Close (Esc)"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Mode Selector Tabs */}
          <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-bold">
            <button
              onClick={() => {
                stopCamera();
                setActiveMode('input');
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                activeMode === 'input'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>USB Scanner / Keyboard Entry</span>
            </button>
            <button
              onClick={() => {
                startCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                activeMode === 'camera'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera Scanner</span>
            </button>
          </div>

          {/* Camera View Mode */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Laser Aiming Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-28 border-2 border-amber-400/80 rounded-xl relative shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded">
                      Position Barcode Here
                    </span>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Hardware Barcode Gun / Keyboard Input Mode */}
          {activeMode === 'input' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-amber-400">
                  <Scan className="w-5 h-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={e => {
                    setScanInput(e.target.value);
                    handleLookup(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Scan barcode with gun or type code (e.g. QT-2026-001, INV-2026-001, PL-2026-001)..."
                  className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-slate-950 border-2 border-slate-700/80 focus:border-amber-500 text-slate-100 placeholder-slate-500 text-sm font-mono font-bold tracking-wide transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => handleLookup(scanInput)}
                  className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Ready for barcode scanner gun. Aim and pull trigger at any time.</span>
              </p>
            </div>
          )}

          {/* Quick Test / Recent Document Chips */}
          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              QUICK TEST / RECENT DOCUMENTS BARCODE CHIPS:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {quotations.slice(0, 3).map(q => (
                <button
                  key={q.id}
                  onClick={() => {
                    const code = q.barcode || q.quotationNumber;
                    setScanInput(code);
                    handleLookup(code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-semibold transition"
                >
                  {q.quotationNumber}
                </button>
              ))}
              {invoices.slice(0, 3).map(inv => (
                <button
                  key={inv.id}
                  onClick={() => {
                    const code = inv.barcode || inv.invoiceNumber;
                    setScanInput(code);
                    handleLookup(code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-mono font-semibold transition"
                >
                  {inv.invoiceNumber}
                </button>
              ))}
              {purchaseLists.slice(0, 3).map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    const code = pl.barcode || pl.listNumber;
                    setScanInput(code);
                    handleLookup(code);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-semibold transition"
                >
                  {pl.listNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Scan Match Result Card */}
          {matchResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    matchResult.type === 'quotation'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : matchResult.type === 'invoice'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {matchResult.type === 'quotation' && <FileText className="w-5 h-5" />}
                    {matchResult.type === 'invoice' && <Receipt className="w-5 h-5" />}
                    {matchResult.type === 'purchase-list' && <ShoppingCart className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        matchResult.type === 'quotation'
                          ? 'bg-amber-500 text-slate-950'
                          : matchResult.type === 'invoice'
                          ? 'bg-blue-500 text-white'
                          : 'bg-emerald-500 text-slate-950'
                      }`}>
                        {matchResult.type === 'quotation' ? 'Quotation' : matchResult.type === 'invoice' ? 'Invoice' : 'Purchase List'}
                      </span>
                      <span className="font-mono font-black text-slate-100 text-base">
                        {matchResult.type === 'quotation' 
                          ? (matchResult.data as Quotation).quotationNumber 
                          : matchResult.type === 'invoice' 
                          ? (matchResult.data as Invoice).invoiceNumber 
                          : (matchResult.data as PurchaseList).listNumber}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-200 mt-1">
                      {matchResult.data.customerName || 'No customer specified'}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-sm">
                      {matchResult.data.projectName || '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Date: {matchResult.data.date}
                    </p>
                  </div>
                </div>

                {/* Barcode Graphic Preview */}
                <div className="p-2 rounded-xl bg-white/95 shrink-0 shadow-md">
                  <Barcode 
                    value={
                      matchResult.type === 'quotation'
                        ? (matchResult.data as Quotation).barcode || (matchResult.data as Quotation).quotationNumber
                        : matchResult.type === 'invoice'
                        ? (matchResult.data as Invoice).barcode || (matchResult.data as Invoice).invoiceNumber
                        : (matchResult.data as PurchaseList).barcode || (matchResult.data as PurchaseList).listNumber
                    }
                    height={24}
                    barWidth={1.2}
                    showText={false}
                  />
                </div>
              </div>

              {/* Financial / Items summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                {matchResult.type === 'quotation' && (
                  <>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Grand Total</span>
                      <span className="font-mono font-black text-slate-100 text-sm">
                        {settings.currency} {(matchResult.data as Quotation).grandTotal.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Status</span>
                      <span className="font-bold text-amber-400 uppercase text-[11px]">
                        {(matchResult.data as Quotation).status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Items</span>
                      <span className="font-bold text-slate-200">
                        {(matchResult.data as Quotation).items?.length || 0} items
                      </span>
                    </div>
                  </>
                )}

                {matchResult.type === 'invoice' && (
                  <>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Grand Total</span>
                      <span className="font-mono font-bold text-slate-100">
                        {settings.currency} {(matchResult.data as Invoice).grandTotal.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Balance Due</span>
                      <span className="font-mono font-black text-rose-400 text-sm">
                        {settings.currency} {(matchResult.data as Invoice).balanceDue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Status</span>
                      <span className="font-bold text-emerald-400 uppercase text-[11px]">
                        {(matchResult.data as Invoice).status.replace('_', ' ')}
                      </span>
                    </div>
                  </>
                )}

                {matchResult.type === 'purchase-list' && (
                  <>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Items to Buy</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {(matchResult.data as PurchaseList).items?.length || 0} items
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[10px]">Notes</span>
                      <span className="text-slate-300 truncate block">
                        {(matchResult.data as PurchaseList).notes || 'None'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Direct Action Buttons */}
              <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                {/* Print A4 */}
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                    if (matchResult.type === 'quotation' || matchResult.type === 'invoice') {
                      setActivePrintDocument({
                        type: matchResult.type,
                        data: matchResult.data as Quotation | Invoice,
                        layout: 'a4',
                      });
                    } else {
                      setActiveTab('purchase-lists');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4</span>
                </button>

                {/* Print Thermal */}
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                    if (matchResult.type === 'quotation' || matchResult.type === 'invoice') {
                      setActivePrintDocument({
                        type: matchResult.type,
                        data: matchResult.data as Quotation | Invoice,
                        layout: 'thermal',
                      });
                    } else {
                      setActiveTab('purchase-lists');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thermal</span>
                </button>

                {/* Open in Module */}
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                    if (matchResult.type === 'quotation') setActiveTab('quotations');
                    if (matchResult.type === 'invoice') setActiveTab('invoices');
                    if (matchResult.type === 'purchase-list') setActiveTab('purchase-lists');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open in Module</span>
                </button>
              </div>
            </div>
          )}

          {searched && !matchResult && scanInput.trim() && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <p className="font-bold">No document found for barcode "{scanInput}"</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Check whether the quotation, invoice, or purchase list number was typed correctly or try another barcode.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Close Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0 text-xs">
          <span className="text-slate-500 text-[11px]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">Esc</kbd> or click outside to close
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition active:scale-95"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Close Scanner</span>
          </button>
        </div>

      </div>
    </div>
  );
};
