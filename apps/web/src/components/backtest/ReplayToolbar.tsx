'use client';

import React from 'react';
import { useTranslation } from '../../store/useAppStore';

interface ReplayToolbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentBarIndex: number;
  totalBars: number;
  onJumpToBar?: (index: number) => void;
}

export default function ReplayToolbar({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  speed,
  onSpeedChange,
  currentBarIndex,
  totalBars,
}: ReplayToolbarProps) {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const speeds = [0.5, 1, 2, 5, 10];

  const progressPercent = totalBars > 0 ? Math.min(100, Math.round((currentBarIndex / totalBars) * 100)) : 0;

  return (
    <div className="replay-toolbar-container">
      <div className="replay-controls">
        {/* Step Back / Undo */}
        <button
          type="button"
          className="replay-btn"
          onClick={onStepBackward}
          disabled={isPlaying || currentBarIndex <= 10}
          title={isEn ? 'Step Back' : 'یک کندل به عقب'}
        >
          <span className="material-symbols-outlined">skip_previous</span>
        </button>

        {/* Play / Pause Toggle */}
        <button
          type="button"
          className={`replay-btn play-btn ${isPlaying ? 'active' : ''}`}
          onClick={onTogglePlay}
          title={isPlaying ? (isEn ? 'Pause' : 'توقف') : (isEn ? 'Play Replay' : 'شروع ریپلی')}
        >
          <span className="material-symbols-outlined">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Step Forward (Next Bar) */}
        <button
          type="button"
          className="replay-btn next-btn"
          onClick={onStepForward}
          disabled={isPlaying || currentBarIndex >= totalBars}
          title={isEn ? 'Next Candle (Hotkey: Arrow Right)' : 'کندل بعدی (کلید ➔)'}
        >
          <span className="material-symbols-outlined">skip_next</span>
          <span className="btn-text">{isEn ? 'Next Bar' : 'کندل بعدی'}</span>
        </button>

        {/* Speed Selector */}
        <div className="speed-selector">
          <span className="speed-label">{isEn ? 'Speed:' : 'سرعت:'}</span>
          <div className="speed-pills">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                className={`speed-pill ${speed === s ? 'active' : ''}`}
                onClick={() => onSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Reset Session */}
        <button
          type="button"
          className="replay-btn reset-btn"
          onClick={onReset}
          title={isEn ? 'Reset Replay' : 'بازنشانی ریپلی'}
        >
          <span className="material-symbols-outlined">restart_alt</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="replay-progress-wrap">
        <div className="replay-progress-bar">
          <div className="replay-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="replay-counter">
          {currentBarIndex} / {totalBars} {isEn ? 'bars' : 'کندل'} ({progressPercent}%)
        </span>
      </div>
    </div>
  );
}
