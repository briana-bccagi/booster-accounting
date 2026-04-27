'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  toggleCleared,
  getTransactions,
  type TransactionInput,
} from '../actions'

const categories = [
  'Concessions (D)',
  'Donations (D)',
  'Fundraiser (D)',
  'Interest Checking (D)',
  'Other (D)',
  'Credit Card Machine (D)',
  'Concessions (W)',
  'Interest Checking (W)',
  'Other (W)',
  'Director of Band (W)',
] as const

interface Transaction {
  id: string
  date: string
  category: string
  voucherNumber: number
  vendor: string
  amount: number
  type: string
  cleared: boolean
}

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<TransactionInput>({
    date: new Date().toISOString().split('T')[0],
    category: categories[0],
    vendor: '',
    amount: '',
    type: 'DEPOSIT',
    cleared: false,
  })

  const router = useRouter()

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadTransactions() {
    const data = await getTransactions()
    setTransactions(data as unknown as Transaction[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateTransaction({ ...formData, id: editingId })
    } else {
      await createTransaction(formData)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: categories[0],
      vendor: '',
      amount: '',
      type: 'DEPOSIT',
      cleared: false,
    })
    await loadTransactions()
    router.refresh()
  }

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id)
    const dateValue = t.date as unknown as string | Date
    const dateStr = typeof dateValue === 'string' ? dateValue : dateValue.toISOString()
    setFormData({
      date: dateStr.split('T')[0],
      category: t.category as TransactionInput['category'],
      vendor: t.vendor,
      amount: String(t.amount),
      type: t.type as 'DEPOSIT' | 'WITHDRAWAL',
      cleared: t.cleared,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id)
      await loadTransactions()
      router.refresh()
    }
  }

  const handleToggleCleared = async (id: string, cleared: boolean) => {
    await toggleCleared(id, !cleared)
    await loadTransactions()
    router.refresh()
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Ledger</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              date: new Date().toISOString().split('T')[0],
              category: categories[0],
              vendor: '',
              amount: '',
              type: 'DEPOSIT',
              cleared: false,
            })
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          {showForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionInput['category'] })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Who/where the item is from/to"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'DEPOSIT' | 'WITHDRAWAL' })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cleared}
                  onChange={(e) => setFormData({ ...formData, cleared: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Cleared</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Voucher #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Cleared</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No transactions yet. Click "Add Transaction" to get started.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                      #{t.voucherNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {t.category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                      {t.vendor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        t.type === 'DEPOSIT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                      <span className={t.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}>
                        {t.type === 'DEPOSIT' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleCleared(t.id, t.cleared)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${
                          t.cleared
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.cleared ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

