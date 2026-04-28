import { getAccountOverview, getPivotTable, getTransactions } from './actions'
import DashboardFilters from './dashboard-filters'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string; fiscalYear?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams

  const yearParam = params.year ? parseInt(params.year, 10) : undefined
  const monthParam = params.month ? parseInt(params.month, 10) : undefined
  const fiscalYearParam = params.fiscalYear ? parseInt(params.fiscalYear, 10) : undefined

  const filters =
    yearParam !== undefined && monthParam !== undefined
      ? { year: yearParam, month: monthParam }
      : fiscalYearParam !== undefined
        ? { fiscalYear: fiscalYearParam }
        : undefined

  const overview = await getAccountOverview(filters)

  const pivot = await getPivotTable(filters)

  const allTransactions = await getTransactions()

  const monthSet = new Map<string, { label: string; value: string }>()
  const fiscalYearSet = new Set<number>()

  for (const t of allTransactions) {
    const date = new Date(t.date)
    const year = date.getFullYear()
    const monthIndex = date.getMonth()
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const value = `${year}-${monthIndex}`
    if (!monthSet.has(value)) {
      monthSet.set(value, { label, value })
    }

    const fiscalYear = monthIndex >= 5 ? year : year - 1
    fiscalYearSet.add(fiscalYear)
  }

  const monthOptions = Array.from(monthSet.values()).sort((a, b) => {
    const [aYear, aMonth] = a.value.split('-').map(Number)
    const [bYear, bMonth] = b.value.split('-').map(Number)
    if (bYear !== aYear) return bYear - aYear
    return bMonth - aMonth
  })

  const fiscalYearOptions = Array.from(fiscalYearSet)
    .sort((a, b) => b - a)
    .map((fy) => ({
      label: `FY ${fy}-${fy + 1} (June - May)`,
      value: String(fy),
    }))

  let headingText = 'Category Breakdown by Month'
  let periodLabel = 'All Time'
  if (yearParam !== undefined && monthParam !== undefined) {
    const date = new Date(yearParam, monthParam)
    headingText = `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Breakdown`
    periodLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else if (fiscalYearParam !== undefined) {
    headingText = `Fiscal Year ${fiscalYearParam}-${fiscalYearParam + 1} Breakdown (June - May)`
    periodLabel = `FY ${fiscalYearParam}-${fiscalYearParam + 1}`
  }

  const hasData = pivot.monthLabels.length > 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Account Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {filters ? `${periodLabel} Balance` : 'Current Balance'}
          </h2>
          <p className="text-2xl font-bold text-slate-900 mt-1">${overview.balance.toFixed(2)}</p>
          {filters && (
            <p className="text-[10px] text-slate-400 mt-1">for selected period</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {filters ? `${periodLabel} Cleared` : 'Cleared Balance'}
          </h2>
          <p className="text-2xl font-bold text-green-600 mt-1">${overview.clearedBalance.toFixed(2)}</p>
          {filters && (
            <p className="text-[10px] text-slate-400 mt-1">for selected period</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {filters ? `${periodLabel} Pending` : 'Pending'}
          </h2>
          <p className="text-2xl font-bold text-amber-600 mt-1">${overview.pendingBalance.toFixed(2)}</p>
          {filters && (
            <p className="text-[10px] text-slate-400 mt-1">for selected period</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900">{headingText}</h2>
          <DashboardFilters monthOptions={monthOptions} fiscalYearOptions={fiscalYearOptions} />
        </div>

        {!hasData ? (
          <p className="text-slate-500">No transactions for the selected period.</p>
        ) : (
          <>
            {/* Deposits Table */}
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
              <div className="px-4 py-2 bg-green-50 border-b border-slate-200">
                <h3 className="text-base font-semibold text-green-800">Deposits</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-slate-200">
                        Month
                      </th>
                      {pivot.depositCategories.map((cat) => (
                        <th
                          key={cat}
                          className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider min-w-[100px]"
                        >
                          {cat}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider border-l border-slate-200 bg-slate-100 min-w-[100px]">
                        Month Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pivot.monthLabels.map((month) => (
                      <tr key={month} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs font-semibold text-slate-900 sticky left-0 bg-white border-r border-slate-200">
                          {month}
                        </td>
                        {pivot.depositCategories.map((cat) => {
                          const val = pivot.values[month]?.[cat] ?? 0
                          return (
                            <td
                              key={`${month}-${cat}`}
                              className="px-3 py-2 text-xs text-right font-medium text-green-600"
                            >
                              {val !== 0 ? `$${val.toFixed(2)}` : '-'}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-xs text-right font-bold border-l border-slate-200 bg-slate-50 text-slate-900">
                          ${pivot.monthTotals[month] >= 0 ? pivot.monthTotals[month].toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                      <td className="px-3 py-2 text-xs text-slate-900 sticky left-0 bg-slate-100 border-r border-slate-200">
                        Category Total
                      </td>
                      {pivot.depositCategories.map((cat) => (
                        <td
                          key={`total-${cat}`}
                          className="px-3 py-2 text-xs text-right font-bold text-green-700"
                        >
                          {pivot.categoryTotals[cat] !== 0
                            ? `$${pivot.categoryTotals[cat].toFixed(2)}`
                            : '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs text-right font-bold border-l border-slate-200 text-slate-900">
                        ${pivot.depositTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-right">
                {pivot.monthLabels.length} month{pivot.monthLabels.length !== 1 ? 's' : ''} ·{' '}
                {pivot.depositCategories.length} deposit categories
              </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden mt-6">
              <div className="px-4 py-2 bg-red-50 border-b border-slate-200">
                <h3 className="text-base font-semibold text-red-800">Withdrawals</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-slate-200">
                        Month
                      </th>
                      {pivot.withdrawalCategories.map((cat) => (
                        <th
                          key={cat}
                          className="px-3 py-2 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider min-w-[100px]"
                        >
                          {cat}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-700 uppercase tracking-wider border-l border-slate-200 bg-slate-100 min-w-[100px]">
                        Month Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pivot.monthLabels.map((month) => (
                      <tr key={month} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs font-semibold text-slate-900 sticky left-0 bg-white border-r border-slate-200">
                          {month}
                        </td>
                        {pivot.withdrawalCategories.map((cat) => {
                          const val = pivot.values[month]?.[cat] ?? 0
                          return (
                            <td
                              key={`${month}-${cat}`}
                              className="px-3 py-2 text-xs text-right font-medium text-red-600"
                            >
                              {val !== 0 ? `$${val.toFixed(2)}` : '-'}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-xs text-right font-bold border-l border-slate-200 bg-slate-50 text-red-700">
                          ${Math.abs(pivot.monthTotals[month] < 0 ? pivot.monthTotals[month] : 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                      <td className="px-3 py-2 text-xs text-slate-900 sticky left-0 bg-slate-100 border-r border-slate-200">
                        Category Total
                      </td>
                      {pivot.withdrawalCategories.map((cat) => (
                        <td
                          key={`total-${cat}`}
                          className="px-3 py-2 text-xs text-right font-bold text-red-700"
                        >
                          {pivot.categoryTotals[cat] !== 0
                            ? `$${Math.abs(pivot.categoryTotals[cat]).toFixed(2)}`
                            : '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs text-right font-bold border-l border-slate-200 text-red-800">
                        ${Math.abs(pivot.withdrawalTotal).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 text-right">
                {pivot.monthLabels.length} month{pivot.monthLabels.length !== 1 ? 's' : ''} ·{' '}
                {pivot.withdrawalCategories.length} withdrawal categories
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

