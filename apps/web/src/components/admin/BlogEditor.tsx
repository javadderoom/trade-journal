import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Select from '../ui/Select';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import LoadingButton from '../ui/LoadingButton';
import './BlogEditor.scss';

export default function BlogEditor({ initialData, locale, onSuccess, onCancel }: { initialData?: any, locale: 'fa' | 'en', onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [tagIds, setTagIds] = useState<string[]>(initialData?.tags?.map((t:any) => t.id) || []);
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || '');

  const [categories, setCategories] = useState<any[]>([]);
  const [tagsList, setTagsList] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/api/blog/categories?locale=${locale}`).then(res => setCategories(res.data)).catch(() => {});
    api.get(`/api/blog/tags?locale=${locale}`).then(res => setTagsList(res.data)).catch(() => {});
  }, [locale]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: initialData?.content || '<p>محتوای مقاله...</p>',
    immediatelyRender: false,
  });

  const handleSave = async () => {
    if (!title || !slug) {
      notify.error('Title and Slug are required');
      return;
    }
    setLoading(true);
    const payload = {
      title, slug, excerpt, cover_image: coverImage, status,
      category_id: categoryId || null,
      tag_ids: tagIds,
      content: editor?.getHTML(),
      seo_title: seoTitle,
      seo_description: seoDescription,
      locale,
    };

    try {
      if (initialData?.id) {
        await api.put(`/api/admin/blog/posts/${initialData.id}`, payload);
        notify.success('Post updated');
      } else {
        await api.post('/api/admin/blog/posts', payload);
        notify.success('Post created');
      }
      onSuccess();
    } catch (err) {
      notify.error('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (id: string) => {
    setTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="blog-editor-container">
      <div className="form-group">
        <label>عنوان مقاله</label>
        <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="form-group">
        <label>آدرس (Slug)</label>
        <input type="text" className="input-field" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} />
      </div>

      <div className="form-group">
        <label>ویرایشگر محتوا</label>
        <div className="tiptap-toolbar">
          <div className="toolbar-group">
            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'is-active' : ''} title="Bold">
              <span className="material-symbols-outlined">format_bold</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'is-active' : ''} title="Italic">
              <span className="material-symbols-outlined">format_italic</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive('underline') ? 'is-active' : ''} title="Underline">
              <span className="material-symbols-outlined">format_underlined</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={editor?.isActive('strike') ? 'is-active' : ''} title="Strike">
              <span className="material-symbols-outlined">format_strikethrough</span>
            </button>
          </div>
          
          <div className="toolbar-group">
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2">
              <span className="material-symbols-outlined">format_h2</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3">
              <span className="material-symbols-outlined">format_h3</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={editor?.isActive('blockquote') ? 'is-active' : ''} title="Quote">
              <span className="material-symbols-outlined">format_quote</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={editor?.isActive('codeBlock') ? 'is-active' : ''} title="Code Block">
              <span className="material-symbols-outlined">code_blocks</span>
            </button>
          </div>

          <div className="toolbar-group">
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={editor?.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Align Right">
              <span className="material-symbols-outlined">format_align_right</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={editor?.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Align Center">
              <span className="material-symbols-outlined">format_align_center</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={editor?.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Align Left">
              <span className="material-symbols-outlined">format_align_left</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} className={editor?.isActive({ textAlign: 'justify' }) ? 'is-active' : ''} title="Justify">
              <span className="material-symbols-outlined">format_align_justify</span>
            </button>
          </div>

          <div className="toolbar-group">
            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'is-active' : ''} title="Bullet List">
              <span className="material-symbols-outlined">format_list_bulleted</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'is-active' : ''} title="Numbered List">
              <span className="material-symbols-outlined">format_list_numbered</span>
            </button>
          </div>

          <div className="toolbar-group">
            <button type="button" onClick={() => {
              const url = window.prompt('URL');
              if (url) editor?.chain().focus().setImage({ src: url }).run();
            }} title="Insert Image">
              <span className="material-symbols-outlined">image</span>
            </button>
            <button type="button" onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
              }
            }} className={editor?.isActive('link') ? 'is-active' : ''} title="Insert Link">
              <span className="material-symbols-outlined">link</span>
            </button>
            <button type="button" onClick={() => editor?.chain().focus().unsetLink().run()} disabled={!editor?.isActive('link')} title="Remove Link">
              <span className="material-symbols-outlined">link_off</span>
            </button>
          </div>

          <div className="toolbar-group color-picker">
            <input
              type="color"
              onInput={event => editor?.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
              value={editor?.getAttributes('textStyle').color || '#e5e7eb'}
              title="Text Color"
            />
          </div>
        </div>
        <div className="tiptap-editor-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="form-group">
        <label>خلاصه مقاله</label>
        <textarea className="input-field" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label>دسته‌بندی</label>
          <Select
            value={categoryId}
            onChange={setCategoryId}
            options={[
              { value: '', label: '-- بدون دسته --' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>وضعیت</label>
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'DRAFT', label: 'پیش‌نویس' },
              { value: 'PUBLISHED', label: 'منتشر شده' },
              { value: 'ARCHIVED', label: 'بایگانی' }
            ]}
          />
        </div>
      </div>

      <div className="form-group">
        <label>برچسب‌ها</label>
        <div className="tags-checkboxes">
          {tagsList.map(t => (
            <label key={t.id} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '15px' }}>
              <input type="checkbox" checked={tagIds.includes(t.id)} onChange={() => handleTagToggle(t.id)} />
              <span style={{ marginRight: '5px' }}>{t.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>لینک تصویر کاور (Cover Image)</label>
        <input type="text" className="input-field" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} />
      </div>

      <hr style={{ margin: '30px 0', borderColor: '#333' }} />
      
      <div className="form-group">
        <label>SEO Title</label>
        <input type="text" className="input-field" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </div>
      <div className="form-group">
        <label>SEO Description</label>
        <textarea className="input-field" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
        <LoadingButton isLoading={loading} onClick={handleSave} className="btn-primary">ذخیره مقاله</LoadingButton>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>انصراف</button>
      </div>
    </div>
  );
}
