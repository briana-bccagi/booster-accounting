import { getAccountOverview, getMonthlyBreakdown, getTransactions } from './actions'
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

  const monthlyBreakdown = await getMonthlyBreakdown(filters)

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

  let headingText = 'Monthly Breakdown'
  let periodLabel = 'All Time'
  if (yearParam !== undefined && monthParam !== undefined) {
    const date = new Date(yearParam, monthParam)
    headingText = `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Breakdown`
    periodLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } else if (fiscalYearParam !== undefined) {
    headingText = `Fiscal Year ${fiscalYearParam}-${fiscalYearParam + 1} Breakdown (June - May)`
    periodLabel = `FY ${fiscalYearParam}-${fiscalYearParam + 1}`
  }

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

        {monthlyBreakdown.length === 0 ? (
          <p className="text-slate-500">No transactions for the selected period.</p>
        ) : (
          monthlyBreakdown.map((month) => (
            <div key={month.monthLabel} className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">{month.monthLabel}</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">+${month.totalDeposits.toFixed(2)}</span>
                  <span className="text-red-600 font-medium">-${month.totalWithdrawals.toFixed(2)}</span>
                  <span className={`font-bold ${month.net >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                    Net: ${month.net.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Deposits</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Withdrawals</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {month.categories.map((cat) => (
                      <tr key={cat.category} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm text-slate-900">{cat.category}</td>
                        <td className="px-6 py-3 text-sm text-right text-green-600 font-medium">
                          {cat.deposits > 0 ? `+$${cat.deposits.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-red-600 font-medium">
                          {cat.withdrawals > 0 ? `-$${cat.withdrawals.toFixed(2)}` : '-'}
                        </td>
                        <td className={`px-6 py-3 text-sm text-right font-bold ${cat.net >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                          ${cat.net.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-semibold">
                      <td className="px-6 py-3 text-sm text-slate-900">Month Total</td>
                      <td className="px-6 py-3 text-sm text-right text-green-700">
                        +${month.totalDeposits.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-red-700">
                        -${month.totalWithdrawals.toFixed(2)}
                      </td>
                      <td className={`px-6 py-3 text-sm text-right ${month.net >= 0 ? 'text-slate-900' : 'text-red-800'}`}>
                        ${month.net.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
                {month.transactionCount} transaction{month.transactionCount !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

