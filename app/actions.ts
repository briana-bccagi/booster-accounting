'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'
import { setDbError, getDbError, clearDbError } from '@/lib/db-status'
import { demoTransactions, demoVouchers, getDemoOverview } from '@/lib/demo-data'

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

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL'
export type Category = (typeof categories)[number]

export interface TransactionInput {
  date: string
  category: Category
  vendor: string
  amount: string
  type: TransactionType
  cleared: boolean
}

export interface TransactionUpdate extends TransactionInput {
  id: string
}

// Track if we're using demo mode
let useDemoMode = false

function handleDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('DATABASE_URL') || message.includes('connection') || message.includes('P1001') || message.includes('P1000') || message.includes('P1003')) {
    useDemoMode = true
    return 'Database not configured. Using demo data. Please connect a PostgreSQL database in your Vercel project settings to save real data.'
  }
  return message
}

async function getNextVoucherNumber() {
  if (useDemoMode) {
    return Math.max(...demoTransactions.map(t => t.voucherNumber)) + 1
  }
  try {
    const counter = await prisma.counter.upsert({
      where: { id: 'voucher' },
      update: { value: { increment: 1 } },
      create: { id: 'voucher', value: 1 },
    })
    return counter.value
  } catch {
    return Math.max(...demoTransactions.map(t => t.voucherNumber)) + 1
  }
}

async function isDbEmpty() {
  try {
    const count = await prisma.transaction.count()
    return count === 0
  } catch {
    return true
  }
}

export async function getTransactions() {
  if (useDemoMode) return demoTransactions
  try {
    const data = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: { voucher: true },
    })
    clearDbError()
    if (data.length === 0) {
      return demoTransactions
    }
    return data
  } catch (error) {
    handleDbError(error)
    setDbError('Database not connected - showing demo data')
    return demoTransactions
  }
}

export async function getTransactionById(id: string) {
  if (useDemoMode) {
    return demoTransactions.find(t => t.id === id) || null
  }
  try {
    return await prisma.transaction.findUnique({
      where: { id },
      include: { voucher: true },
    })
  } catch (error) {
    handleDbError(error)
    return demoTransactions.find(t => t.id === id) || null
  }
}

export async function createTransaction(data: TransactionInput) {
  if (useDemoMode || await isDbEmpty()) {
    return { success: true, message: 'Demo mode: changes not saved. Connect a database to persist data.' }
  }
  try {
    const voucherNumber = await getNextVoucherNumber()

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(data.date),
        category: data.category,
        voucherNumber,
        vendor: data.vendor,
        amount: parseFloat(data.amount),
        type: data.type,
        cleared: data.cleared,
      },
    })

    await prisma.voucher.create({
      data: {
        voucherNumber: transaction.voucherNumber,
      },
    })

    revalidatePath('/ledger')
    revalidatePath('/')
    return { success: true, transaction }
  } catch (error) {
    const message = handleDbError(error)
    return { success: false, error: message }
  }
}

export async function updateTransaction(data: TransactionUpdate) {
  if (useDemoMode || await isDbEmpty()) {
    return { success: true, message: 'Demo mode: changes not saved. Connect a database to persist data.' }
  }
  try {
    const transaction = await prisma.transaction.update({
      where: { id: data.id },
      data: {
        date: new Date(data.date),
        category: data.category,
        vendor: data.vendor,
        amount: parseFloat(data.amount),
        type: data.type,
        cleared: data.cleared,
      },
    })

    revalidatePath('/ledger')
    revalidatePath('/')
    return { success: true, transaction }
  } catch (error) {
    const message = handleDbError(error)
    return { success: false, error: message }
  }
}

export async function deleteTransaction(id: string) {
  if (useDemoMode || await isDbEmpty()) {
    return { success: true, message: 'Demo mode: changes not saved. Connect a database to persist data.' }
  }
  try {
    await prisma.transaction.delete({ where: { id } })
    revalidatePath('/ledger')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    const message = handleDbError(error)
    return { success: false, error: message }
  }
}

export async function toggleCleared(id: string, cleared: boolean) {
  if (useDemoMode || await isDbEmpty()) {
    return { success: true, message: 'Demo mode: changes not saved. Connect a database to persist data.' }
  }
  try {
    await prisma.transaction.update({
      where: { id },
      data: { cleared },
    })
    revalidatePath('/ledger')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    const message = handleDbError(error)
    return { success: false, error: message }
  }
}

export async function uploadReceipt(voucherNumber: number, formData: FormData) {
  if (useDemoMode || await isDbEmpty()) {
    return { success: true, message: 'Demo mode: file uploads not saved. Connect a database to persist data.' }
  }
  try {
    const file = formData.get('receipt') as File
    if (!file) throw new Error('No file provided')

    const blob = await put(`receipts/${voucherNumber}-${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    await prisma.voucher.update({
      where: { voucherNumber },
      data: { receiptImageUrl: blob.url },
    })

    revalidatePath('/vouchers')
    revalidatePath('/ledger')
    return { success: true, url: blob.url }
  } catch (error) {
    const message = handleDbError(error)
    return { success: false, error: message }
  }
}

export async function updateVoucherNotes(voucherNumber: number, notes: string) {
  if (useDemoMode || await isDbEmpty()) {
    return { success: true, message: 'Demo mode: changes not saved. Connect a database to persist data.' }
  }
  try {
    await prisma.voucher.update({
      where: { voucherNumber },
      data: { notes },
    })
    revalidatePath('/vouchers')
    return { success: true }
  } catch (error) {
    const message = handleDbError(error)
    return { success: false, error: message }
  }
}

export async function getVouchers() {
  if (useDemoMode) return demoVouchers as unknown as Array<any>
  try {
    const data = await prisma.voucher.findMany({
      orderBy: { voucherNumber: 'desc' },
      include: { transaction: true },
    })
    clearDbError()
    if (data.length === 0) {
      return demoVouchers as unknown as Array<any>
    }
    return data
  } catch (error) {
    handleDbError(error)
    setDbError('Database not connected - showing demo data')
    return demoVouchers as unknown as Array<any>
  }
}

export async function getAccountOverview() {
  if (useDemoMode) return getDemoOverview()
  try {
    const transactions = await prisma.transaction.findMany()

    if (transactions.length === 0) {
      return getDemoOverview()
    }

    const totalDeposits = transactions
      .filter((t: { type: string; amount: number }) => t.type === 'DEPOSIT')
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)

    const totalWithdrawals = transactions
      .filter((t: { type: string; amount: number }) => t.type === 'WITHDRAWAL')
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)

    const balance = totalDeposits - totalWithdrawals

    const clearedDeposits = transactions
      .filter((t: { type: string; cleared: boolean; amount: number }) => t.type === 'DEPOSIT' && t.cleared)
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)

    const clearedWithdrawals = transactions
      .filter((t: { type: string; cleared: boolean; amount: number }) => t.type === 'WITHDRAWAL' && t.cleared)
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)

    const clearedBalance = clearedDeposits - clearedWithdrawals

    const pendingDeposits = totalDeposits - clearedDeposits
    const pendingWithdrawals = totalWithdrawals - clearedWithdrawals

    clearDbError()
    return {
      balance,
      clearedBalance,
      pendingBalance: balance - clearedBalance,
      totalDeposits,
      totalWithdrawals,
      clearedDeposits,
      clearedWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      transactionCount: transactions.length,
    }
  } catch (error) {
    handleDbError(error)
    setDbError('Database not connected - showing demo data')
    return getDemoOverview()
  }
}

