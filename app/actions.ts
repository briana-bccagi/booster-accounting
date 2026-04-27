'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'

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

function handleDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('DATABASE_URL') || message.includes('connection') || message.includes('P1001') || message.includes('P1000')) {
    return 'Database not configured. Please connect a PostgreSQL database in your Vercel project settings.'
  }
  return message
}

async function getNextVoucherNumber() {
  const counter = await prisma.counter.upsert({
    where: { id: 'voucher' },
    update: { value: { increment: 1 } },
    create: { id: 'voucher', value: 1 },
  })
  return counter.value
}

export async function getTransactions() {
  try {
    return await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: { voucher: true },
    })
  } catch (error) {
    console.error('getTransactions error:', error)
    return []
  }
}

export async function getTransactionById(id: string) {
  try {
    return await prisma.transaction.findUnique({
      where: { id },
      include: { voucher: true },
    })
  } catch (error) {
    console.error('getTransactionById error:', error)
    return null
  }
}

export async function createTransaction(data: TransactionInput) {
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
  try {
    return await prisma.voucher.findMany({
      orderBy: { voucherNumber: 'desc' },
      include: { transaction: true },
    })
  } catch (error) {
    console.error('getVouchers error:', error)
    return []
  }
}

export async function getAccountOverview() {
  try {
    const transactions = await prisma.transaction.findMany()

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
    console.error('getAccountOverview error:', error)
    return {
      balance: 0,
      clearedBalance: 0,
      pendingBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      clearedDeposits: 0,
      clearedWithdrawals: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      transactionCount: 0,
    }
  }
}

