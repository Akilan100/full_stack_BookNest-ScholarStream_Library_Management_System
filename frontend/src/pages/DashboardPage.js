import React from 'react';

function DashboardPage({ onNavigate, books = [], issueRecords = [], holds = [], fines = [] }) {
  // Compute metrics from actual live state
  const totalBooks = books.length;
  const totalAvailableCopies = books.reduce(
    (acc, b) => acc + (b.availableCopies !== undefined ? b.availableCopies : b.totalCopies || 0),
    0
  );
  const activeIssuedCount = issueRecords.filter((r) => r.status === 'ISSUED').length;
  const returnedCount = issueRecords.filter((r) => r.status === 'RETURNED').length;
  const overdueCount = issueRecords.filter((r) => r.status === 'OVERDUE').length;
  const lostCount = issueRecords.filter((r) => r.status === 'LOST').length;

  const totalCirculations = activeIssuedCount + returnedCount + overdueCount + lostCount;
  const safeTotal = Math.max(1, totalCirculations);

  const pendingFines = fines.filter((f) => f.status === 'PENDING');
  const totalPenaltyAmount = pendingFines.reduce((acc, f) => acc + Number(f.fineAmount || 0), 0);

  // Donut SVG Calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.32

  const issuedRatio = totalCirculations > 0 ? activeIssuedCount / totalCirculations : 0;
  const returnedRatio = totalCirculations > 0 ? returnedCount / totalCirculations : 0;
  const overdueRatio = totalCirculations > 0 ? overdueCount / totalCirculations : 0;
  const lostRatio = totalCirculations > 0 ? lostCount / totalCirculations : 0;

  const issuedLen = issuedRatio * circumference;
  const returnedLen = returnedRatio * circumference;
  const overdueLen = overdueRatio * circumference;
  const lostLen = lostRatio * circumference;

  const issuedOffset = 0;
  const returnedOffset = -issuedLen;
  const overdueOffset = -(issuedLen + returnedLen);
  const lostOffset = -(issuedLen + returnedLen + overdueLen);

  // Generate real desk activity stream
  const recentActivities = [];

  // Recent holds
  holds.slice(0, 3).forEach((h) => {
    recentActivities.push({
      id: `hold-${h.id}`,
      type: 'HOLD',
      title: `Line Placement: "${h.bookTitle || (h.book && h.book.title) || 'Catalog Volume'}"`,
      desc: `Reserved by ${h.patronEmail || 'Patron'} — State: ${h.status}`,
      date: h.requestDate || new Date().toISOString().split('T')[0],
      badgeColor:
        h.status === 'READY_FOR_PICKUP'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200',
    });
  });

  // Recent circulations
  issueRecords.slice(0, 3).forEach((r) => {
    if (r.status === 'ISSUED') {
      recentActivities.push({
        id: `issue-${r.id}`,
        type: 'CHECKOUT',
        title: `Volume Check-out: "${r.bookTitle || (r.book && r.book.title) || 'Catalog Volume'}"`,
        desc: `Issued to ${r.userEmail || 'Borrower'} — Target Due: ${r.dueDate || 'Standard Term'}`,
        date: r.issueDate || new Date().toISOString().split('T')[0],
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    } else if (r.status === 'RETURNED') {
      recentActivities.push({
        id: `ret-${r.id}`,
        type: 'RETURN',
        title: `Volume Check-in: "${r.bookTitle || (r.book && r.book.title) || 'Catalog Volume'}"`,
        desc: `Returned by ${r.userEmail || 'Borrower'} — Shelf re-stocked`,
        date: r.returnDate || r.issueDate || new Date().toISOString().split('T')[0],
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      });
    }
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Welcome Banner (Clean White Theme) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            LIVE CIRCULATION TELEMETRY
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Library Administrative Operations Center
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Master dashboard overview tracking physical shelf distribution, checkouts and collection liquidity.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate && onNavigate('catalogue')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              Explore Catalogue <span>&rarr;</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('issues')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              Circulation Desk
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="card-modern p-5 relative overflow-hidden hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Holdings</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900">{totalBooks}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">Total Catalogued Volumes</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="card-modern p-5 relative overflow-hidden hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">On-Shelf Stock</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-emerald-600">{totalAvailableCopies}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">Volumes Available for Circulation</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="card-modern p-5 relative overflow-hidden hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Loans</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-sky-600">{activeIssuedCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">Active Circulations Out</div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="card-modern p-5 relative overflow-hidden hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Penalty Ledger</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-amber-600">${totalPenaltyAmount.toFixed(2)}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">Overdue Item Penalty Fees</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Circulation Breakdown & Live Desk Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circulation Status Distribution Panel with Interactive Donut Chart */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Circulation Status Distribution</h2>
              <p className="text-xs text-slate-500">Real-time distribution of physical library stock lifecycle across borrowing accounts.</p>
            </div>
            <span className="badge-pill bg-slate-100 text-slate-700 border border-slate-200">Inventory Ratio</span>
          </div>

          {/* Donut Chart & Legend Visual Row */}
          <div className="my-5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />

                {totalCirculations === 0 ? (
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#cbd5e1"
                    strokeWidth="12"
                  />
                ) : (
                  <>
                    {/* ISSUED Segment */}
                    {activeIssuedCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#2563eb"
                        strokeWidth="12"
                        strokeDasharray={`${issuedLen} ${circumference}`}
                        strokeDashoffset={issuedOffset}
                        className="transition-all duration-700"
                      />
                    )}

                    {/* RETURNED Segment */}
                    {returnedCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${returnedLen} ${circumference}`}
                        strokeDashoffset={returnedOffset}
                        className="transition-all duration-700"
                      />
                    )}

                    {/* OVERDUE Segment */}
                    {overdueCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeDasharray={`${overdueLen} ${circumference}`}
                        strokeDashoffset={overdueOffset}
                        className="transition-all duration-700"
                      />
                    )}

                    {/* LOST Segment */}
                    {lostCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeDasharray={`${lostLen} ${circumference}`}
                        strokeDashoffset={lostOffset}
                        className="transition-all duration-700"
                      />
                    )}
                  </>
                )}
              </svg>

              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-tight">
                  {totalCirculations}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Total Loans
                </span>
              </div>
            </div>

            {/* Legend / Status Badges List matching the image */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-2xs" />
                  <span className="text-xs font-bold text-slate-800">ISSUED ({activeIssuedCount})</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-blue-600 ml-auto">
                  {Math.round(issuedRatio * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                  <span className="text-xs font-bold text-slate-800">RETURNED ({returnedCount})</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-600 ml-auto">
                  {Math.round(returnedRatio * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
                  <span className="text-xs font-bold text-slate-800">OVERDUE ({overdueCount})</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-amber-600 ml-auto">
                  {Math.round(overdueRatio * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4 px-3 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
                  <span className="text-xs font-bold text-slate-800">LOST ({lostCount})</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-rose-600 ml-auto">
                  {Math.round(lostRatio * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress Meters Section */}
          <div className="space-y-4 mt-5">
            {/* Issued */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-blue-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  ISSUED (Active Out)
                </span>
                <span className="font-bold text-slate-800">{activeIssuedCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (activeIssuedCount / safeTotal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Returned */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  RETURNED (Archived Records)
                </span>
                <span className="font-bold text-slate-800">{returnedCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (returnedCount / safeTotal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Overdue */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  OVERDUE (Delinquent Accounts)
                </span>
                <span className="font-bold text-slate-800">{overdueCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (overdueCount / safeTotal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Lost */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  LOST (Pending Write-off)
                </span>
                <span className="font-bold text-slate-800">{lostCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (lostCount / safeTotal) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated Daily Synchronisation</span>
            <button
              onClick={() => onNavigate && onNavigate('issues')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              View Detailed Circulation Log &rarr;
            </button>
          </div>
        </div>

        {/* Recent Real-Time Desk Operations */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Real-time Desk Operations</h2>
              <p className="text-xs text-slate-500">Audit log of book checkouts, returns, priority hold stages, and penalty assessments.</p>
            </div>
            <span className="badge-pill bg-blue-50 text-blue-700 border border-blue-200">Live Desk Stream</span>
          </div>

          <div className="space-y-3 mt-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs mt-0.5 flex-shrink-0">
                      {act.type === 'HOLD' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      ) : act.type === 'CHECKOUT' ? (
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8-8-8 8" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20V4m-8 8l8 8 8-8" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{act.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
                    {act.date}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No circulation desk activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
