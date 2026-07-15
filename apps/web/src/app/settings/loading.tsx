export default function SettingsLoading() {
  return (
    <div className="settings-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#94a3b8', animation: 'spin 1s linear infinite' }}>progress_activity</span>
    </div>
  );
}
