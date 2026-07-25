'use client';

import React from 'react';
import { useTranslation } from '../../store/useAppStore';

export type DrawingToolMode = 'cursor' | 'trendline' | 'rectangle' | 'horizontal' | 'cut';

interface DrawingToolbarProps {
  activeTool: DrawingToolMode;
  onSelectTool: (tool: DrawingToolMode) => void;
  onClearDrawings: () => void;
  isCutActive?: boolean;
}

export default function DrawingToolbar({
  activeTool,
  onSelectTool,
  onClearDrawings,
  isCutActive = false,
}: DrawingToolbarProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const tools: { id: DrawingToolMode; icon: string; titleEn: string; titleFa: string }[] = [
    { id: 'cursor', icon: 'near_me', titleEn: 'Cursor / Pan', titleFa: 'نشانه / جابجایی' },
    { id: 'cut', icon: 'content_cut', titleEn: 'Replay Cut Tool (Select Start Candle)', titleFa: 'ابزار برش ریپلی (انتخاب کندل شروع)' },
    { id: 'trendline', icon: 'timeline', titleEn: 'Trend Line', titleFa: 'خط روند' },
    { id: 'rectangle', icon: 'crop_square', titleEn: 'Supply & Demand Rectangle', titleFa: 'مستطیل عرضه و تقاضا' },
    { id: 'horizontal', icon: 'horizontal_rule', titleEn: 'Horizontal Price Line', titleFa: 'خط افقی قیمت' },
  ];

  return (
    <div className="drawing-toolbar-container">
      <div className="tools-group">
        {tools.map((t) => {
          const isActive = activeTool === t.id || (t.id === 'cut' && isCutActive);
          return (
            <button
              key={t.id}
              type="button"
              className={`draw-tool-btn ${isActive ? 'active' : ''} ${t.id === 'cut' ? 'cut-tool' : ''}`}
              onClick={() => onSelectTool(t.id)}
              title={isEn ? t.titleEn : t.titleFa}
            >
              <span className="material-symbols-outlined">{t.icon}</span>
            </button>
          );
        })}
      </div>

      <div className="tools-divider" />

      {/* Clear Drawings Button */}
      <button
        type="button"
        className="draw-tool-btn clear-btn"
        onClick={onClearDrawings}
        title={isEn ? 'Clear All Chart Drawings' : 'پاک کردن تمام ترسیم‌ها'}
      >
        <span className="material-symbols-outlined">delete_sweep</span>
      </button>
    </div>
  );
}
