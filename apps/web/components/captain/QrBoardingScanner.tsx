'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface QrBoardingScannerProps {
  tripSlug: string
  guests: { id: string; fullName: string; boardedAt: string | null }[]
  onClose: () => void
  onBoarded: (guestId: string, guestName: string) => void
}

interface ScanResult {
  guestName: string
  alreadyBoarded: boolean
  boardedAt: string
}

export function QrBoardingScanner({
  tripSlug, guests, onClose, onBoarded,
}: QrBoardingScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualToken, setManualToken] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [boardedCount, setBoardedCount] = useState(0)
  const [cameraError, setCameraError] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<unknown>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    setBoardedCount(guests.filter(g => g.boardedAt != null).length)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize camera scanner
  useEffect(() => {
    if (mode !== 'camera') return

    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const qrScanner = new Html5Qrcode('qr-reader')
        html5QrRef.current = qrScanner
        scanner = qrScanner

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            handleScan(decodedText)
          },
          () => {
            // Ignore scan failures (no QR in frame)
          }
        )
      } catch {
        setCameraError(true)
        setMode('manual')
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 300)

    return () => {
      clearTimeout(timer)
      if (scanner) {
        scanner.stop().then(() => scanner?.clear()).catch(() => null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleScan = useCallback(async (qrToken: string) => {
    if (processingRef.current) return
    processingRef.current = true
    setIsProcessing(true)
    setError('')

    try {
      const res = await fetch(`/api/trips/${tripSlug}/board-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Unknown error')
        setTimeout(() => {
          processingRef.current = false
          setError('')
        }, 2000)
        return
      }

      const result: ScanResult = {
        guestName: json.guestName,
        alreadyBoarded: json.alreadyBoarded,
        boardedAt: json.boardedAt,
      }

      setLastResult(result)
      if (!json.alreadyBoarded) {
        setBoardedCount(prev => prev + 1)
        onBoarded(json.guestId ?? '', json.guestName)
      }

      // Auto-reset after 2.5 seconds
      setTimeout(() => {
        setLastResult(null)
        processingRef.current = false
      }, 2500)
    } catch {
      setError('Connection error')
      setTimeout(() => {
        processingRef.current = false
        setError('')
      }, 2000)
    } finally {
      setIsProcessing(false)
    }
  }, [tripSlug, onBoarded])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualToken.trim()) return
    handleScan(manualToken.trim())
    setManualToken('')
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/80">
        <div>
          <h2 className="text-white text-[18px] font-bold">
            Scan Mode
          </h2>
          <p className="text-white/60 text-[13px]">
            {boardedCount} / {guests.length} boarded
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            {mode === 'camera' ? <Keyboard size={18} /> : <Camera size={18} />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-teal transition-all duration-500"
          style={{ width: guests.length > 0 ? `${(boardedCount / guests.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative">
        {mode === 'camera' ? (
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full max-w-[400px] aspect-square"
          />
        ) : (
          /* Manual QR token entry */
          <form onSubmit={handleManualSubmit} className="px-8 w-full max-w-[400px]">
            <p className="text-white/60 text-[14px] mb-4 text-center">
              {cameraError
                ? 'Camera not available. Enter the guest\'s QR code manually.'
                : 'Enter the QR code text manually:'}
            </p>
            <input
              type="text"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste or type QR token..."
              autoFocus
              className="field-input"
              style={{ height: 56, background: 'rgba(244,239,230,0.08)', borderColor: 'rgba(244,239,230,0.2)', color: 'var(--color-bone)', fontSize: 'var(--t-body-md)', borderRadius: 'var(--r-1)' }}
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || isProcessing}
              className="btn btn--rust w-full"
              style={{ height: 56, marginTop: 'var(--s-4)', justifyContent: 'center', fontSize: 'var(--t-body-md)' }}
            >
              {isProcessing ? 'Processing...' : 'Board Guest'}
            </button>
          </form>
        )}

        {/* Success toast */}
        {lastResult && (
          <div
            className={lastResult.alreadyBoarded ? 'alert alert--warn' : 'alert alert--ok'}
            style={{ position: 'absolute', left: 'var(--s-4)', right: 'var(--s-4)', bottom: 'var(--s-8)', padding: 'var(--s-5)', gap: 'var(--s-4)', borderRadius: 'var(--r-1)', animation: 'pulse 2s ease infinite' }}
          >
            <span style={{ fontSize: 36 }}>
              {lastResult.alreadyBoarded ? '\u2139' : '\u2713'}
            </span>
            <div>
              <p className="mono" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.05em' }}>
                {lastResult.alreadyBoarded ? 'ALREADY BOARDED' : 'BOARDED'}
              </p>
              <p style={{ fontSize: 'var(--t-body-md)', marginTop: 2 }}>{lastResult.guestName}</p>
            </div>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div
            className="alert alert--err"
            style={{ position: 'absolute', left: 'var(--s-4)', right: 'var(--s-4)', bottom: 'var(--s-8)', padding: 'var(--s-5)', gap: 'var(--s-4)', borderRadius: 'var(--r-1)' }}
          >
            <span style={{ fontSize: 20, fontWeight: 700 }}>\u2715</span>
            <div>
              <p className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.05em' }}>INVALID</p>
              <p style={{ fontSize: 'var(--t-body-sm)', marginTop: 2 }}>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-5 py-4 bg-black/80 text-center">
        <p className="text-white/40 text-[12px]">
          Point camera at guest&apos;s boarding QR code · Auto-resets after each scan
        </p>
      </div>
    </div>
  )
}
