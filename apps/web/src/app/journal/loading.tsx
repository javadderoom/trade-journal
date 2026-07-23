import PageLoader from '../../components/ui/PageLoader';

export default function JournalLoading() {
  return (
    <div className="journal-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <PageLoader />
    </div>
  );
}
