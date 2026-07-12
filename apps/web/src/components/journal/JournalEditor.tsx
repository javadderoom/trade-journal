'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../../store/useAppStore';
import { getSharedTranslations } from '../../locales/components';

interface JournalEditorProps {
  value: string;
  onChange: (val: string) => void;
  onSave: () => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export default function JournalEditor({ value, onChange, onSave, saveStatus }: JournalEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const { language } = useTranslation();
  const isEn = language === 'en';

  const p = {
    ...getSharedTranslations(isEn),
    emptyPreview: isEn ? 'Nothing written yet...' : 'چیزی نوشته نشده است...',
    bold: isEn ? 'Bold' : 'ضخیم (Bold)',
    boldPlaceholder: isEn ? 'bold text' : 'متن ضخیم',
    italic: isEn ? 'Italic' : 'کج (Italic)',
    italicPlaceholder: isEn ? 'italic text' : 'متن کج',
    h2: isEn ? 'Large Heading (H2)' : 'عنوان بزرگ (H2)',
    h2Placeholder: isEn ? 'Heading 2' : 'عنوان ۲',
    h3: isEn ? 'Medium Heading (H3)' : 'عنوان متوسط (H3)',
    h3Placeholder: isEn ? 'Heading 3' : 'عنوان ۳',
    list: isEn ? 'Bulleted List (List)' : 'لیست نشانه‌دار (List)',
    listPlaceholder: isEn ? 'item' : 'مورد',
    numberedList: isEn ? 'Numbered List' : 'لیست عددی',
    todo: isEn ? 'Todo List (Todo)' : 'لیست انجام کار (Todo)',
    todoPlaceholder: isEn ? 'new task' : 'کار جدید',
    quote: isEn ? 'Quote (Quote)' : 'نقل قول (Quote)',
    quotePlaceholder: isEn ? 'quote text' : 'نقل قول',
    codeBlock: isEn ? 'Code block' : 'بلوک کد',
    codeBlockPlaceholder: isEn ? 'source code' : 'کد منبع',
    editMode: isEn ? 'Edit' : 'ویرایش',
    previewMode: isEn ? 'Preview' : 'پیش‌نمایش',
    textareaPlaceholder: isEn 
      ? 'Write your trading notes, market analysis, emotional and mental state here...'
      : 'یادداشت‌های معاملاتی، تحلیل بازار، وضعیت روحی و فکری امروز را در اینجا بنویسید...',
    saving: isEn ? 'Auto-saving...' : 'در حال ذخیره‌سازی خودکار...',
    saved: isEn ? 'All changes saved' : 'تمام تغییرات ذخیره شد',
    saveError: isEn ? 'Error auto-saving changes' : 'خطا در ذخیره‌سازی خودکار',
    markdownSupported: isEn ? 'Supports Markdown formatting' : 'پشتیبانی از فرمت‌های Markdown',
  };

  const insertMarkdown = (syntax: string, placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const replacement = syntax.replace('$1', selectedText || placeholder);

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      // Position cursor at the end of replacement text
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Simple Markdown parser for client preview rendering
  const parseMarkdown = (md: string) => {
    if (!md) return `<p style="color: #94a3b8; font-style: italic;">${p.emptyPreview}</p>`;
    
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Blockquotes
    html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote>$1</blockquote>');

    // Checklists
    html = html.replace(/^\s*-\s+\[ \] (.*$)/gim, '<li class="todo-list-item"><span class="checkbox"></span> $1</li>');
    html = html.replace(/^\s*-\s+\[x\] (.*$)/gim, '<li class="todo-list-item todo-checked"><span class="checkbox checked">✓</span> $1</li>');

    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

    // Code Blocks
    html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
    html = html.replace(/\`(.*?)\`/g, '<code>$1</code>');

    // Paragraphs (split by double newline)
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs
      .map(p => {
        if (p.startsWith('<h') || p.startsWith('<blockquote') || p.startsWith('<li') || p.startsWith('<pre') || p.startsWith('<li>')) {
          return p;
        }
        return `<p>${p.replace(/\n/g, '<br />')}</p>`;
      })
      .join('');

    return html;
  };

  return (
    <div className="journal-editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-actions">
          <button
            type="button"
            onClick={() => insertMarkdown('**$1**', p.boldPlaceholder)}
            title={p.bold}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_bold</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('*$1*', p.italicPlaceholder)}
            title={p.italic}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_italic</span>
          </button>
          <div className="divider" />
          <button
            type="button"
            onClick={() => insertMarkdown('\n## $1\n', p.h2Placeholder)}
            title={p.h2}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_h2</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n### $1\n', p.h3Placeholder)}
            title={p.h3}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_h3</span>
          </button>
          <div className="divider" />
          <button
            type="button"
            onClick={() => insertMarkdown('\n- $1', p.listPlaceholder)}
            title={p.list}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_list_bulleted</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n1. $1', p.listPlaceholder)}
            title={p.numberedList}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_list_numbered</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n- [ ] $1', p.todoPlaceholder)}
            title={p.todo}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">checklist</span>
          </button>
          <div className="divider" />
          <button
            type="button"
            onClick={() => insertMarkdown('\n> $1\n', p.quotePlaceholder)}
            title={p.quote}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">format_quote</span>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n```\n$1\n```\n', p.codeBlockPlaceholder)}
            title={p.codeBlock}
            disabled={showPreview}
          >
            <span className="material-symbols-outlined">code_blocks</span>
          </button>
        </div>

        <div className="toolbar-modes">
          <button
            type="button"
            className={`mode-btn ${!showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(false)}
          >
            {p.editMode}
          </button>
          <button
            type="button"
            className={`mode-btn ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(true)}
          >
            {p.previewMode}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="editor-body">
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            placeholder={p.textareaPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <div
            className="editor-preview markdown-preview"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
          />
        )}
      </div>

      {/* Footer / Auto-Save Status */}
      <div className="editor-footer">
        <div className="save-status">
          {saveStatus === 'saving' && (
            <div className="status-item saving">
              <div className="spinner-micro"></div>
              <span>{p.saving}</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="status-item saved">
              <span className="material-symbols-outlined">check_circle</span>
              <span>{p.saved}</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="status-item error">
              <span className="material-symbols-outlined">error</span>
              <span>{p.saveError}</span>
            </div>
          )}
        </div>
        <div className="editor-tips">
          <span>{p.markdownSupported}</span>
        </div>
      </div>
    </div>
  );
}
