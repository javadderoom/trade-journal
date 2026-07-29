import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import LoadingButton from '../ui/LoadingButton';
import './BlogEditor.scss';

export default function BlogEditor({ initialData, onSuccess, onCancel }: { initialData?: any, onSuccess: () => void, onCancel: () => void }) {
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
    api.get('/api/blog/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/api/blog/tags').then(res => setTagsList(res.data)).catch(() => {});
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialData?.content || '<p>محتوای مقاله...</p>',
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
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'is-active' : ''}>Bold</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'is-active' : ''}>Italic</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'is-active' : ''}>List</button>
          <button type="button" onClick={() => {
            const url = window.prompt('URL');
            if (url) editor?.chain().focus().setImage({ src: url }).run();
          }}>Image</button>
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
          <select className="input-field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">-- بدون دسته --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>وضعیت</label>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشر شده</option>
            <option value="ARCHIVED">بایگانی</option>
          </select>
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
