import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with test data...')

  // Clear existing data
  await prisma.voucher.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.counter.deleteMany()

  // Reset counter
  await prisma.counter.create({
    data: { id: 'voucher', value: 0 },
  })

  const transactions = [
    {
      date: new Date('2026-05-01'),
      category: 'Donations (D)',
      vendor: 'John & Mary Smith',
      amount: 250.0,
      type: 'DEPOSIT',
      cleared: true,
    },
    {
      date: new Date('2026-05-03'),
      category: 'Concessions (D)',
      vendor: 'Friday Night Football Sales',
      amount: 875.5,
      type: 'DEPOSIT',
      cleared: true,
    },
    {
      date: new Date('2026-05-05'),
      category: 'Fundraiser (D)',
      vendor: 'Cookie Dough Sales',
      amount: 1200.0,
      type: 'DEPOSIT',
      cleared: true,
    },
    {
      date: new Date('2026-05-08'),
      category: 'Director of Band (W)',
      vendor: 'Samuel Ash Music',
      amount: 450.0,
      type: 'WITHDRAWAL',
      cleared: true,
    },
    {
      date: new Date('2026-05-10'),
      category: 'Concessions (W)',
      vendor: 'Sysco Food Services',
      amount: 325.75,
      type: 'WITHDRAWAL',
      cleared: true,
    },
    {
      date: new Date('2026-05-12'),
      category: 'Interest Checking (D)',
      vendor: 'First National Bank',
      amount: 12.34,
      type: 'DEPOSIT',
      cleared: true,
    },
    {
      date: new Date('2026-05-15'),
      category: 'Credit Card Machine (D)',
      vendor: 'Square Processing',
      amount: 234.0,
      type: 'DEPOSIT',
      cleared: false,
    },
    {
      date: new Date('2026-05-18'),
      category: 'Other (D)',
      vendor: 'Car Wash Fundraiser',
      amount: 500.0,
      type: 'DEPOSIT',
      cleared: false,
    },
    {
      date: new Date('2026-05-20'),
      category: 'Other (W)',
      vendor: 'Office Depot',
      amount: 87.43,
      type: 'WITHDRAWAL',
      cleared: true,
    },
    {
      date: new Date('2026-05-22'),
      category: 'Concessions (D)',
      vendor: 'Homecoming Game Sales',
      amount: 1340.0,
      type: 'DEPOSIT',
      cleared: false,
    },
    {
      date: new Date('2026-05-25'),
      category: 'Concessions (W)',
      vendor: 'Coca-Cola Distributing',
      amount: 215.0,
      type: 'WITHDRAWAL',
      cleared: true,
    },
    {
      date: new Date('2026-05-28'),
      category: 'Donations (D)',
      vendor: 'Local Business Sponsorship',
      amount: 500.0,
      type: 'DEPOSIT',
      cleared: true,
    },
    {
      date: new Date('2026-06-02'),
      category: 'Fundraiser (D)',
      vendor: 'Bingo Night Tickets',
      amount: 680.0,
      type: 'DEPOSIT',
      cleared: true,
    },
    {
      date: new Date('2026-06-05'),
      category: 'Director of Band (W)',
      vendor: 'Midwest Music Supply',
      amount: 1240.0,
      type: 'WITHDRAWAL',
      cleared: false,
    },
    {
      date: new Date('2026-06-08'),
      category: 'Interest Checking (W)',
      vendor: 'First National Bank',
      amount: 5.0,
      type: 'WITHDRAWAL',
      cleared: true,
    },
    {
      date: new Date('2026-06-12'),
      category: 'Concessions (D)',
      vendor: 'Rival Game Night Sales',
      amount: 945.0,
      type: 'DEPOSIT',
      cleared: false,
    },
  ]

  const voucherNotes = [
    'Annual family donation',
    'Hot dogs, drinks, popcorn — sold out by halftime!',
    'Fall fundraiser proceeds — 48 students participated',
    'Marching band show music order — invoice #SA-8842',
    'Food supplies for concessions — hot dog buns, nacho cheese, napkins',
    null,
    'Credit card batch deposit — May 14 game day sales',
    'Community car wash event at Johnsons Auto Detail — 6 hours, 22 volunteers',
    'Printer ink, copy paper, manila envelopes',
    'Big game — record sales! Ran out of pretzels in 3rd quarter',
    'Beverage restock — 10 cases Coke, 8 cases Sprite, 5 cases water',
    'Smith Auto Repair — banner sponsorship for fall season',
    'Community bingo night — 85 tickets sold, prizes donated by local businesses',
    'Replacement marching baritone — invoice #MWS-9912, net 30 terms',
    'Monthly account service fee',
    'Away game concessions — weather delay, still strong turnout',
  ]

  const receiptUrls = [
    null,
    'https://placehold.co/400x600/e2e8f0/1e293b?text=Receipt+%232\nConcessions',
    null,
    'https://placehold.co/400x600/fee2e2/7f1d1d?text=Receipt+%234\nSheet+Music',
    null,
    null,
    'https://placehold.co/400x600/dcfce7/14532d?text=Receipt+%237\nSquare+Batch',
    null,
    'https://placehold.co/400x600/fee2e2/7f1d1d?text=Receipt+%239\nOffice+Depot',
    'https://placehold.co/400x600/dcfce7/14532d?text=Receipt+%2310\nHomecoming',
    null,
    'https://placehold.co/400x600/dcfce7/14532d?text=Receipt+%2312\nSponsorship',
    null,
    'https://placehold.co/400x600/fee2e2/7f1d1d?text=Receipt+%2314\nInstruments',
    null,
    null,
  ]

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i]
    const voucherNumber = i + 1

    await prisma.transaction.create({
      data: {
        ...t,
        voucherNumber,
      },
    })

    await prisma.voucher.create({
      data: {
        voucherNumber,
        notes: voucherNotes[i],
        receiptImageUrl: receiptUrls[i],
      },
    })

    await prisma.counter.update({
      where: { id: 'voucher' },
      data: { value: voucherNumber },
    })
  }

  console.log(`Seeded ${transactions.length} transactions successfully!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })