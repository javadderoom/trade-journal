import PageLoader from '../../components/ui/PageLoader';

export default function SupportLoading() {
  return (
    <div className="support-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <PageLoader />
    </div>
  );
}
