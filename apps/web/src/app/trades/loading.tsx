export default function TradesLoading() {
  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <div className="dash-spinner" />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>در حال بارگذاری معاملات...</p>
      </div>
    </main>
  );
}
