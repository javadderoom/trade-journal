export default function DashboardLoading() {
  return (
    <main className="dashboard-page">
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>در حال بارگذاری داشبورد...</p>
      </div>
    </main>
  );
}
