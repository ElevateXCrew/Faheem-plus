'use client'

import { useState, useRef, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, X, Upload, Copy, Check, ChevronRight } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  duration: string
  features: string[]
}

const WALLET_ADDRESS = '0x03044267e87def562191ca8318a4d969272967da'

// Separate stable modal component — never re-renders from parent
const PaymentModal = memo(function PaymentModal({
  plan,
  onClose,
}: {
  plan: Plan
  onClose: () => void
}) {
  const [step, setStep] = useState<'method' | 'binance' | 'success'>('method')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(WALLET_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!accountName.trim() || !walletAddress.trim() || !screenshot) {
      alert('Please fill all fields and upload screenshot')
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', screenshot)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) throw new Error('Screenshot upload failed')

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: 'binance',
          paymentDetails: {
            accountName,
            walletAddress,
            screenshotUrl: uploadData.url,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setStep('success')
    } catch (err: any) {
      alert(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }, [accountName, walletAddress, screenshot, plan.id])

  return (
    createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Method Selection */}
      {step === 'method' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Select Payment Method</h2>

          <button
            onClick={() => setStep('binance')}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-colors mb-3"
          >
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">USDT (Binance)</p>
              <p className="text-sm text-gray-500">USDT • TRC20 Network</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <div className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed">
            <div className="text-left">
              <p className="font-bold text-2xl tracking-tight text-gray-800 dark:text-gray-200" style={{ fontFamily: 'serif' }}>stripe</p>
              <p className="text-sm text-amber-500 font-medium">🚧 Coming Soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Binance Payment */}
      {step === 'binance' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>

          <button onClick={() => setStep('method')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            ← Back
          </button>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">USDT Payment</h2>

          <div className="bg-primary/10 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">{plan.name} Plan</p>
            <p className="text-2xl font-bold text-primary">{plan.currency}{plan.price}<span className="text-sm font-normal text-gray-500">/{plan.duration}</span></p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Send Payment To:</p>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500">Network: <span className="font-semibold text-gray-700 dark:text-gray-300">TRC20</span></p>
                <p className="text-xs text-gray-500 mt-1">Wallet Address:</p>
                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">{WALLET_ADDRESS}</p>
              </div>
              <button onClick={handleCopy} className="flex-shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-primary" />}
              </button>
            </div>
            <p className="text-xs text-amber-600 font-medium">⚠ Only send via TRC20 network!</p>
            <div className="flex justify-center pt-2">
              <img src="/QR-image/qr.jpg" alt="TRC20 QR Code" className="w-36 h-36 rounded-lg border border-gray-200 dark:border-gray-600" />
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Details:</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Your Account Name</Label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Your name" className="mt-1 h-9 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Your Wallet Address (TRC20)</Label>
              <Input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="Your TRC20 wallet address" className="mt-1 h-9 text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Payment Screenshot *</Label>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFileChange} />
              {screenshotPreview ? (
                <div className="mt-1 relative">
                  <img src={screenshotPreview} className="w-full h-32 object-cover rounded-lg border" />
                  <button onClick={() => { setScreenshot(null); setScreenshotPreview(null) }} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="mt-1 w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-xs text-gray-500">Upload Screenshot</span>
                  <span className="text-xs text-gray-400">PNG, JPG</span>
                </button>
              )}
            </div>
          </div>

          <Button className="w-full mt-5" onClick={handleSubmit} disabled={submitting || !accountName.trim() || !walletAddress.trim() || !screenshot}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : 'Submit Payment'}
          </Button>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Submitted!</h3>
            <p className="text-sm text-gray-500">Your payment is under review. We'll activate your subscription within 24 hours.</p>
            <Button onClick={onClose} className="w-full mt-4">Done</Button>
          </div>
        </div>
      )}
      </div>
    , document.body)
  )
})

export function PlanSelection({ plan }: { plan: Plan }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const handleGetStarted = useCallback(async () => {
    setShowModal(true)
    const res = await fetch('/api/auth/me')
    if (!res.ok) {
      setShowModal(false)
      router.push('/login?redirect=/pricing')
    }
  }, [router])

  const handleClose = useCallback(() => setShowModal(false), [])

  const isPopular = plan.name.toLowerCase().includes('premium')

  return (
    <>
      <Button size="lg" className="w-full" onClick={handleGetStarted} variant={isPopular ? 'default' : 'outline'}>
        Get Started
      </Button>
      {showModal && <PaymentModal plan={plan} onClose={handleClose} />}
    </>
  )
}
