'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface FilterOption {
  label: string
  value: string
}

interface DashboardFiltersProps {
  monthOptions: FilterOption[]
  fiscalYearOptions: FilterOption[]
  defaultYear?: number
  defaultMonth?: number
}

export default function DashboardFilters({ monthOptions, fiscalYearOptions, defaultYear, defaultMonth }: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = searchParams.get('year')
  const currentMonth = searchParams.get('month')
  const currentFiscalYear = searchParams.get('fiscalYear')

  // Use URL params if present, otherwise use defaults if no fiscal year is selected
  const selectedMonth = currentYear && currentMonth
    ? `${currentYear}-${currentMonth}`
    : !currentFiscalYear && defaultYear !== undefined && defaultMonth !== undefined
      ? `${defaultYear}-${defaultMonth}`
      : ''
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

  const activeFilter = selectedMonth
    ? 'month'
    : selectedFiscalYear
      ? 'fiscalYear'
      : null

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
          className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px] ${
            activeFilter === 'month'
              ? 'border-blue-500 ring-1 ring-blue-500'
              : activeFilter === 'fiscalYear'
                ? 'border-slate-200 opacity-60'
                : 'border-slate-300'
          }`}
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
          className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px] ${
            activeFilter === 'fiscalYear'
              ? 'border-blue-500 ring-1 ring-blue-500'
              : activeFilter === 'month'
                ? 'border-slate-200 opacity-60'
                : 'border-slate-300'
          }`}
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

