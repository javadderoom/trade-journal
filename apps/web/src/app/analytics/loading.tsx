export default function AnalyticsLoading() {
  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#6366f1', animation: 'spin 1s linear infinite' }}>progress_activity</span>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>در حال بارگذاری تحلیل‌ها...</p>
      </div>
    </main>
  );
}
