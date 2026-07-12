'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../store/useAppStore';
import { toPersianDigits } from '../utils/farsi';
import { SubStatus } from '../hooks/useSubscriptionStatus';

interface SubscriptionBannersProps {
  subStatus: SubStatus | null;
  dismissedRejectionId: string | null;
  onDismissRejection: (id: string) => void;
}

export default function SubscriptionBanners({ subStatus, dismissedRejectionId, onDismissRejection }: SubscriptionBannersProps) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const planLabel = (plan: string) => plan === 'STANDARD' ? t('dashboard.planStandard') : t('dashboard.planPro');
  const periodLabel = (period: string) => period === 'annual' ? t('dashboard.periodAnnual') : t('dashboard.periodMonthly');

  const fontStack = isEn ? 'inherit' : 'Vazirmatn';

  return (
    <>
      {/* Pending Receipt Banner */}
      {subStatus?.pendingReceipt && subStatus.pendingReceipt.status === 'PENDING' && (
        <div style={{
          backgroundColor: 'rgba(255, 179, 0, 0.08)',
          border: '1px solid rgba(255, 179, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 179, 0, 0.2)',
          color: '#ffb300',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontFamily: fontStack,
        }}>
          <span className="material-symbols-outlined">pending_actions</span>
          <span>
            {t('dashboard.pendingReceiptBanner')
              .replace('{plan}', planLabel(subStatus.pendingReceipt.plan))
              .replace('{period}', periodLabel(subStatus.pendingReceipt.period))}
          </span>
        </div>
      )}

      {/* Rejected Receipt Banner */}
      {subStatus?.pendingReceipt && subStatus.pendingReceipt.status === 'REJECTED' && dismissedRejectionId !== subStatus.pendingReceipt.id && (
        <div style={{
          backgroundColor: 'rgba(255, 83, 112, 0.08)',
          border: '1px solid rgba(255, 83, 112, 0.2)',
          borderBottom: '1px solid rgba(255, 83, 112, 0.2)',
          color: '#ff5370',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontFamily: fontStack,
        }}>
          <span className="material-symbols-outlined">cancel</span>
          <span style={{ flex: 1, textAlign: isEn ? 'left' : 'right' }}>
            {t('dashboard.rejectedReceiptBanner')
              .replace('{plan}', planLabel(subStatus.pendingReceipt.plan))
              .replace('{reason}', subStatus.pendingReceipt.rejectionReason || '')}
          </span>
          <button
            onClick={() => onDismissRejection(subStatus.pendingReceipt!.id)}
            style={{ background: 'none', border: 'none', color: '#ff5370', cursor: 'pointer', padding: 0 }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Free Plan Limit Warning */}
      {subStatus?.plan === 'FREE' && subStatus?.usage?.monthlyTrades !== undefined && subStatus.usage.monthlyTrades >= 24 && (
        <div style={{
          backgroundColor: '#ffb300',
          color: '#111319',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: fontStack,
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
          <span>
            {subStatus.usage.monthlyTrades >= 30
              ? t('dashboard.limitWarning')
              : t('dashboard.limitWarningNear').replace('{count}', toPersianDigits(subStatus.usage.monthlyTrades))
            }
          </span>
          <Link
            href="/settings?tab=subscription"
            style={{
              color: '#111319',
              textDecoration: 'underline',
              marginRight: isEn ? '0px' : '15px',
              marginLeft: isEn ? '15px' : '0px',
            }}
          >
            {t('dashboard.upgradeSubscription')}
          </Link>
        </div>
      )}
    </>
  );
}
