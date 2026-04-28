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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Account Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            {filters ? `${periodLabel} Balance` : 'Current Balance'}
          </h2>
          <p className="text-3xl font-bold text-slate-900 mt-2">${overview.balance.toFixed(2)}</p>
          {filters && (
            <p className="text-xs text-slate-400 mt-1">for selected period</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            {filters ? `${periodLabel} Cleared` : 'Cleared Balance'}
          </h2>
          <p className="text-3xl font-bold text-green-600 mt-2">${overview.clearedBalance.toFixed(2)}</p>
          {filters && (
            <p className="text-xs text-slate-400 mt-1">for selected period</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            {filters ? `${periodLabel} Pending` : 'Pending'}
          </h2>
          <p className="text-3xl font-bold text-amber-600 mt-2">${overview.pendingBalance.toFixed(2)}</p>
          {filters && (
            <p className="text-xs text-slate-400 mt-1">for selected period</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">{headingText}</h2>
          <DashboardFilters monthOptions={monthOptions} fiscalYearOptions={fiscalYearOptions} />
        </div>

        {!hasData ? (
          <p className="text-slate-500">No transactions for the selected period.</p>
        ) : (
          <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-slate-200">
                      Month
                    </th>
                    {pivot.categoryNames.map((cat) => (
                      <th
                        key={cat}
                        className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]"
                      >
                        {cat}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-l border-slate-200 bg-slate-100 min-w-[120px]">
                      Month Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pivot.monthLabels.map((month) => (
                    <tr key={month} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 sticky left-0 bg-white border-r border-slate-200">
                        {month}
                      </td>
                      {pivot.categoryNames.map((cat) => {
                        const val = pivot.values[month]?.[cat] ?? 0
                        return (
                          <td
                            key={`${month}-${cat}`}
                            className={`px-4 py-3 text-sm text-right font-medium ${
                              val > 0
                                ? 'text-green-600'
                                : val < 0
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                            }`}
                          >
                            {val !== 0 ? `$${val.toFixed(2)}` : '-'}
                          </td>
                        )
                      })}
                      <td
                        className={`px-4 py-3 text-sm text-right font-bold border-l border-slate-200 bg-slate-50 ${
                          pivot.monthTotals[month] >= 0 ? 'text-slate-900' : 'text-red-700'
                        }`}
                      >
                        ${pivot.monthTotals[month].toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                    <td className="px-4 py-3 text-sm text-slate-900 sticky left-0 bg-slate-100 border-r border-slate-200">
                      Category Total
                    </td>
                    {pivot.categoryNames.map((cat) => (
                      <td
                        key={`total-${cat}`}
                        className={`px-4 py-3 text-sm text-right font-bold ${
                          pivot.categoryTotals[cat] > 0
                            ? 'text-green-700'
                            : pivot.categoryTotals[cat] < 0
                              ? 'text-red-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {pivot.categoryTotals[cat] !== 0
                          ? `$${pivot.categoryTotals[cat].toFixed(2)}`
                          : '-'}
                      </td>
                    ))}
                    <td
                      className={`px-4 py-3 text-sm text-right font-bold border-l border-slate-200 ${
                        pivot.grandTotal >= 0 ? 'text-slate-900' : 'text-red-800'
                      }`}
                    >
                      ${pivot.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
              {pivot.monthLabels.length} month{pivot.monthLabels.length !== 1 ? 's' : ''} ·{' '}
              {pivot.categoryNames.length} categories
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

