'use client'

import { useState, useEffect } from 'react'
import { getVouchers, uploadReceipt, updateVoucherNotes } from '../actions'

interface Voucher {
  id: string
  voucherNumber: number
  receiptImageUrl: string | null
  notes: string | null
  transaction: {
    date: string
    vendor: string
    amount: number
    type: string
  } | null
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [editingNotes, setEditingNotes] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const [expandedVoucher, setExpandedVoucher] = useState<number | null>(null)

  useEffect(() => {
    loadVouchers()
  }, [])

  async function loadVouchers() {
    const data = await getVouchers()
    setVouchers(data as unknown as Voucher[])
    setLoading(false)
  }

  const handleFileUpload = async (voucherNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingId(voucherNumber)
    const formData = new FormData()
    formData.append('receipt', file)

    try {
      await uploadReceipt(voucherNumber, formData)
      await loadVouchers()
    } catch (error) {
      alert('Failed to upload receipt')
    } finally {
      setUploadingId(null)
    }
  }

  const handleSaveNotes = async (voucherNumber: number) => {
    await updateVoucherNotes(voucherNumber, noteText)
    setEditingNotes(null)
    await loadVouchers()
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Vouchers & Receipts</h1>
      <p className="text-slate-600">{vouchers.length} total vouchers</p>

      {/* List Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-slate-100 rounded-t-lg text-sm font-semibold text-slate-700">
        <div className="col-span-1">#</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-3">Vendor</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-2 text-center">Receipt</div>
      </div>

      {/* Voucher List */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {vouchers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No vouchers yet. Create transactions in the Ledger to generate vouchers.
          </div>
        ) : (
          vouchers.map((v, index) => (
            <div key={v.id}>
              {/* List Row - Clickable to expand */}
              <div 
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                onClick={() => setExpandedVoucher(expandedVoucher === v.voucherNumber ? null : v.voucherNumber)}
              >
                <div className="col-span-1 flex items-center">
                  <span className="font-medium text-slate-900">#{v.voucherNumber}</span>
                </div>
                <div className="col-span-2 flex items-center text-sm text-slate-600">
                  {v.transaction ? new Date(v.transaction.date).toLocaleDateString() : '-'}
                </div>
                <div className="col-span-3 flex items-center text-sm text-slate-900 truncate">
                  {v.transaction?.vendor || '-'}
                </div>
                <div className="col-span-2 flex items-center">
                  {v.transaction && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      v.transaction.type === 'DEPOSIT'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {v.transaction.type}
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end text-sm font-medium">
                  {v.transaction && (
                    <span className={v.transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}>
                      ${Number(v.transaction.amount).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  {v.receiptImageUrl ? (
                    <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
                  ) : (
                    <span className="text-xs text-slate-400">No receipt</span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedVoucher === v.voucherNumber && (
                <div className="bg-slate-50 px-4 py-4 border-b border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Receipt Upload */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Receipt Image</h4>
                      {v.receiptImageUrl ? (
                        <div className="space-y-2">
                          <a
                            href={v.receiptImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={v.receiptImageUrl}
                              alt={`Receipt for voucher ${v.voucherNumber}`}
                              className="w-full max-w-xs h-32 object-cover rounded-md border border-slate-200"
                            />
                          </a>
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(v.voucherNumber, e)}
                              className="hidden"
                            />
                            <span className="block text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                              {uploadingId === v.voucherNumber ? 'Uploading...' : 'Replace Receipt'}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(v.voucherNumber, e)}
                            className="hidden"
                          />
                          <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-slate-500">
                            {uploadingId === v.voucherNumber ? 'Uploading...' : 'Upload Receipt'}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
                      {editingNotes === v.voucherNumber ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add notes about this receipt..."
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveNotes(v.voucherNumber)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNotes(null)}
                              className="px-3 py-1 border border-slate-300 text-sm rounded-md hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {v.notes ? (
                            <div className="space-y-2">
                              <p className="text-sm text-slate-600 bg-white p-3 rounded-md border border-slate-200">{v.notes}</p>
                              <button
                                onClick={() => {
                                  setEditingNotes(v.voucherNumber)
                                  setNoteText(v.notes || '')
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit Notes
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNotes(v.voucherNumber)
                                setNoteText('')
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Add Notes
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

