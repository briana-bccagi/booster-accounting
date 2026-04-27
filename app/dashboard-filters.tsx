'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface FilterOption {
  label: string
  value: string
}

interface DashboardFiltersProps {
  monthOptions: FilterOption[]
  fiscalYearOptions: FilterOption[]
}

export default function DashboardFilters({ monthOptions, fiscalYearOptions }: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = searchParams.get('year')
  const currentMonth = searchParams.get('month')
  const currentFiscalYear = searchParams.get('fiscalYear')

  const selectedMonth = currentYear && currentMonth ? `${currentYear}-${currentMonth}` : ''
  const selectedFiscalYear = currentFiscalYear || ''

  const handleMonthChange = (value: string) => {
    if (!value) {
      router.push('/')
      return
    }
    const [year, month] = value.split('-')
    router.push(`/?year=${year}&month=${month}`)
  }

  const handleFiscalYearChange = (value: string) => {
    if (!value) {
      router.push('/')
      return
    }
    router.push(`/?fiscalYear=${value}`)
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label htmlFor="month-filter" className="block text-sm font-medium text-slate-700 mb-1">
          Month View
        </label>
        <select
          id="month-filter"
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
        >
          <option value="">All Months</option>
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fy-filter" className="block text-sm font-medium text-slate-700 mb-1">
          Fiscal Year View
        </label>
        <select
          id="fy-filter"
          value={selectedFiscalYear}
          onChange={(e) => handleFiscalYearChange(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
        >
          <option value="">All Fiscal Years</option>
          {fiscalYearOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {(selectedMonth || selectedFiscalYear) && (
        <button
          onClick={() => router.push('/')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

