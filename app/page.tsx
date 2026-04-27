import { getAccountOverview, getTransactions } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const overview = await getAccountOverview()
  const recentTransactions = (await getTransactions()).slice(0, 5)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Account Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Current Balance</h2>
          <p className="text-3xl font-bold text-slate-900 mt-2">${overview.balance.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Cleared Balance</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">${overview.clearedBalance.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Pending</h2>
          <p className="text-3xl font-bold text-amber-600 mt-2">${overview.pendingBalance.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Deposits</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Deposits</span>
              <span className="font-medium text-green-600">+${overview.totalDeposits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cleared</span>
              <span className="font-medium text-green-600">+${overview.clearedDeposits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pending</span>
              <span className="font-medium text-amber-600">+${overview.pendingDeposits.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Withdrawals</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Withdrawals</span>
              <span className="font-medium text-red-600">-${overview.totalWithdrawals.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cleared</span>
              <span className="font-medium text-red-600">-${overview.clearedWithdrawals.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pending</span>
              <span className="font-medium text-amber-600">-${overview.pendingWithdrawals.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {recentTransactions.length === 0 ? (
            <p className="px-6 py-4 text-slate-500">No transactions yet.</p>
          ) : (
            recentTransactions.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{t.vendor}</p>
                  <p className="text-sm text-slate-500">{t.category}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${t.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'DEPOSIT' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.cleared ? 'Cleared' : 'Pending'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

