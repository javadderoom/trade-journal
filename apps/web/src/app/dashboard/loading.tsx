export default function DashboardLoading() {
  return (
    <main className="dashboard-page">
      <div className="dash-loading">
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#6366f1', animation: 'spin 1s linear infinite' }}>progress_activity</span>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>در حال بارگذاری داشبورد...</p>
      </div>
    </main>
  );
}
