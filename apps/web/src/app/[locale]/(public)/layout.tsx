import React from 'react';
import PublicHeader from '../../../components/layout/PublicHeader';
import PublicFooter from '../../../components/layout/PublicFooter';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  );
}
