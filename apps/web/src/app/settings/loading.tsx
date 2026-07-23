import PageLoader from '../../components/ui/PageLoader';

export default function SettingsLoading() {
  return (
    <div className="settings-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <PageLoader />
    </div>
  );
}
