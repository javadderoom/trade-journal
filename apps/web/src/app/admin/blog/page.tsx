'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { toPersianDigits } from '@/utils/farsi';
import '../admin.scss';

import BlogEditor from '@/components/admin/BlogEditor';
import AILogModal from '@/components/admin/AILogModal';
import Select from '@/components/ui/Select';

export default function AdminBlogPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'tags' | 'comments'>('posts');
  const [activeLocale, setActiveLocale] = useState<'fa' | 'en'>('fa');
  const [aiModel, setAiModel] = useState<string>('gemini-3.5-flash');
  
  // States
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);

  // Modals / Form states
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showAILogModal, setShowAILogModal] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', parent_id: '' });

  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [tagForm, setTagForm] = useState({ name: '', slug: '' });

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/api/admin/blog/posts?locale=${activeLocale}`);
      setPosts(res.data);
    } catch (error) {
      notify.error('خطا در دریافت مقالات');
    }
  };

  const handleTranslatePost = async (id: string) => {
    try {
      const res = await api.post(`/api/admin/blog/posts/${id}/translate`, { modelId: aiModel });
      notify.success('پیش‌نویس ترجمه ایجاد شد!');
      setEditingPost(res.data);
      setShowEditor(true);
      setActiveLocale(res.data.locale);
    } catch (error) {
      notify.error('خطا در ایجاد ترجمه');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/api/blog/categories?locale=${activeLocale}`);
      setCategories(res.data);
    } catch (err) {
      notify.error('Failed to fetch categories');
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get(`/api/blog/tags?locale=${activeLocale}`);
      setTags(res.data);
    } catch (err) {
      notify.error('Failed to fetch tags');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get('/api/admin/blog/comments');
      setComments(res.data);
    } catch (err) {
      notify.error('Failed to fetch comments');
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      if (activeTab === 'posts') fetchPosts();
      if (activeTab === 'categories') fetchCategories();
      if (activeTab === 'tags') fetchTags();
      if (activeTab === 'comments') fetchComments();
    }
  }, [activeTab, activeLocale, user]);

  const handleDeletePost = async (id: string) => {
    if (!await notify.confirm({ title: 'Delete Post', message: 'Are you sure?', danger: true })) return;
    try {
      await api.delete(`/api/admin/blog/posts/${id}`);
      notify.success('Post deleted');
      fetchPosts();
    } catch (err) {
      notify.error('Failed to delete');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) {
      notify.error('نام و آدرس (Slug) اجباری است');
      return;
    }
    try {
      if (editingCategory) {
        await api.put(`/api/admin/blog/categories/${editingCategory.id}`, { ...categoryForm, locale: activeLocale });
        notify.success('دسته‌بندی ویرایش شد');
      } else {
        await api.post('/api/admin/blog/categories', { ...categoryForm, locale: activeLocale });
        notify.success('دسته‌بندی ایجاد شد');
      }
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      notify.error('خطا در ذخیره دسته‌بندی');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!await notify.confirm({ title: 'حذف دسته‌بندی', message: 'آیا از حذف دسته‌بندی مطمئن هستید؟', danger: true })) return;
    try {
      await api.delete(`/api/admin/blog/categories/${id}`);
      notify.success('دسته‌بندی حذف شد');
      fetchCategories();
    } catch (err) {
      notify.error('خطا در حذف دسته‌بندی');
    }
  };

  const handleSaveTag = async () => {
    if (!tagForm.name || !tagForm.slug) {
      notify.error('نام و آدرس (Slug) اجباری است');
      return;
    }
    try {
      if (editingTag) {
        await api.put(`/api/admin/blog/tags/${editingTag.id}`, { ...tagForm, locale: activeLocale });
        notify.success('برچسب ویرایش شد');
      } else {
        await api.post('/api/admin/blog/tags', { ...tagForm, locale: activeLocale });
        notify.success('برچسب ایجاد شد');
      }
      handleCloseModal();
      fetchTags();
    } catch (err) {
      notify.error('خطا در ذخیره برچسب');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!await notify.confirm({ title: 'حذف برچسب', message: 'آیا از حذف برچسب مطمئن هستید؟', danger: true })) return;
    try {
      await api.delete(`/api/admin/blog/tags/${id}`);
      notify.success('برچسب حذف شد');
      fetchTags();
    } catch (err) {
      notify.error('خطا در حذف برچسب');
    }
  };

  const handleGenerateAIPost = async () => {
    if (!await notify.confirm({ title: 'تولید مقاله با هوش مصنوعی', message: 'آیا مطمئن هستید که می‌خواهید پروسه تولید مقاله با هوش مصنوعی را به صورت دستی آغاز کنید؟ این کار ممکن است چند دقیقه طول بکشد.' })) return;
    try {
      await api.post('/api/admin/blog/posts/generate-ai', { modelId: aiModel });
      notify.success('پروسه تولید مقاله در پس‌زمینه آغاز شد.');
      setShowAILogModal(true);
    } catch (err) {
      notify.error('خطا در شروع پروسه هوش مصنوعی');
    }
  };

  const handleApproveComment = async (id: string) => {
    try {
      await api.put(`/api/admin/blog/comments/${id}/approve`);
      notify.success('نظر با موفقیت تایید شد');
      fetchComments();
    } catch (err) {
      notify.error('خطا در تایید نظر');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!await notify.confirm({ title: 'حذف نظر', message: 'آیا از حذف این نظر مطمئن هستید؟', danger: true })) return;
    try {
      await api.delete(`/api/admin/blog/comments/${id}`);
      notify.success('نظر حذف شد');
      fetchComments();
    } catch (err) {
      notify.error('خطا در حذف نظر');
    }
  };

  const handleAdminReply = async () => {
    if (!replyContent.trim()) {
      notify.error('متن پاسخ نمی‌تواند خالی باشد');
      return;
    }
    try {
      await api.post(`/api/admin/blog/comments/${replyingToComment.id}/reply`, { content: replyContent });
      notify.success('پاسخ ثبت شد');
      setShowReplyModal(false);
      setReplyingToComment(null);
      setReplyContent('');
      fetchComments();
    } catch (err) {
      notify.error('خطا در ثبت پاسخ');
    }
  };

  useEffect(() => {
    const isModalOpen = showEditor || showCategoryModal || showTagModal || showReplyModal;
    if (isModalOpen) {
      window.history.pushState({ modalOpen: true }, '', '');
    }

    const handlePopState = (e: PopStateEvent) => {
      if (showEditor) {
        setShowEditor(false);
        setEditingPost(null);
      }
      if (showCategoryModal) setShowCategoryModal(false);
      if (showTagModal) setShowTagModal(false);
      if (showReplyModal) {
        setShowReplyModal(false);
        setReplyingToComment(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showEditor, showCategoryModal, showTagModal, showReplyModal]);

  const handleCloseModal = () => {
    if (showEditor) {
      setShowEditor(false);
      setEditingPost(null);
    }
    if (showCategoryModal) setShowCategoryModal(false);
    if (showTagModal) setShowTagModal(false);
    if (showReplyModal) {
      setShowReplyModal(false);
      setReplyingToComment(null);
    }
    window.history.back();
  };

  if (!user || user.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Checking access...</div>;
  }

  if (showEditor) {
    return (
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1>{editingPost ? 'ویرایش مقاله' : 'مقاله جدید'}</h1>
          </div>
          <button className="btn btn-secondary" onClick={handleCloseModal}>
            بازگشت به لیست
          </button>
        </header>
        <div className="admin-panel-card" style={{ padding: '20px' }}>
          <BlogEditor 
            initialData={editingPost} 
            locale={activeLocale} 
            onSuccess={() => { fetchPosts(); }} 
            onCancel={handleCloseModal} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {showAILogModal && <AILogModal onClose={() => { setShowAILogModal(false); fetchPosts(); }} />}
      <header className="admin-header">
        <div>
          <h1>مدیریت وبلاگ</h1>
          <span className="admin-sub">ایجاد مقالات، دسته‌بندی‌ها و مدیریت نظرات</span>
        </div>
      </header>

      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <span className="material-symbols-outlined">article</span>
          <span>مقالات</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <span className="material-symbols-outlined">category</span>
          <span>دسته‌بندی‌ها</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'tags' ? 'active' : ''}`} onClick={() => setActiveTab('tags')}>
          <span className="material-symbols-outlined">tag</span>
          <span>برچسب‌ها</span>
        </button>
        <button className={`admin-tab-btn ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
          <span className="material-symbols-outlined">forum</span>
          <span>نظرات</span>
        </button>
      </div>

      {activeTab === 'posts' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>لیست مقالات</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Select
                value={aiModel}
                onChange={(val) => setAiModel(val as string)}
                options={[
                  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
                  { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
                  { value: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro' }
                ]}
              />
              <Select
                value={activeLocale}
                onChange={(val) => setActiveLocale(val as 'fa' | 'en')}
                options={[
                  { value: 'fa', label: 'فارسی (FA)' },
                  { value: 'en', label: 'انگلیسی (EN)' }
                ]}
              />
              <button className="btn btn-secondary" onClick={handleGenerateAIPost} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined">smart_toy</span>
                تولید خودکار
              </button>
              <button className="btn btn-primary" onClick={() => setShowEditor(true)}>مقاله جدید +</button>
            </div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>وضعیت</th>
                  <th>بازدید</th>
                  <th>نویسنده</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td>{post.status}</td>
                    <td>{toPersianDigits(post.view_count)}</td>
                    <td>{post.author?.name}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!(post.translation || post.translated_from) && (
                        <button className="icon-btn text-green" onClick={() => handleTranslatePost(post.id)} title="ایجاد ترجمه">
                          <span className="material-symbols-outlined">translate</span>
                        </button>
                      )}
                      {(post.translation || post.translated_from) && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          fontSize: '11px', 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          color: '#60a5fa', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontWeight: 500,
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          دو زبانه
                        </span>
                      )}
                      <button className="icon-btn text-blue" onClick={() => { setEditingPost(post); setShowEditor(true); }}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="icon-btn text-red" onClick={() => handleDeletePost(post.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>هیچ مقاله‌ای یافت نشد.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>لیست دسته‌بندی‌ها</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Select
                value={activeLocale}
                onChange={(val) => setActiveLocale(val as 'fa' | 'en')}
                options={[
                  { value: 'fa', label: 'فارسی (FA)' },
                  { value: 'en', label: 'انگلیسی (EN)' }
                ]}
              />
              <button className="btn btn-primary" onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', slug: '', description: '', parent_id: '' });
                setShowCategoryModal(true);
              }}>دسته‌بندی جدید +</button>
            </div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>آدرس (Slug)</th>
                  <th>توضیحات</th>
                  <th>زیرمجموعه (والد)</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td style={{ direction: 'ltr', textAlign: 'left' }}>{cat.slug}</td>
                    <td>{cat.description || '-'}</td>
                    <td>{cat.parent ? cat.parent.name : '-'}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn text-blue" onClick={() => { 
                        setEditingCategory(cat); 
                        setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', parent_id: cat.parent_id || '' });
                        setShowCategoryModal(true); 
                      }}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="icon-btn text-red" onClick={() => handleDeleteCategory(cat.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>هیچ دسته‌بندی یافت نشد.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>لیست برچسب‌ها</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Select
                value={activeLocale}
                onChange={(val) => setActiveLocale(val as 'fa' | 'en')}
                options={[
                  { value: 'fa', label: 'فارسی (FA)' },
                  { value: 'en', label: 'انگلیسی (EN)' }
                ]}
              />
              <button className="btn btn-primary" onClick={() => { setEditingTag(null); setTagForm({ name: '', slug: '' }); setShowTagModal(true); }}>
                برچسب جدید +
              </button>
            </div>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>آدرس (Slug)</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((t: any) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td dir="ltr" style={{ textAlign: 'left' }}>{t.slug}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => { 
                        setEditingTag(t); 
                        setTagForm({ name: t.name, slug: t.slug }); 
                        setShowTagModal(true); 
                      }}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="icon-btn text-red" onClick={() => handleDeleteTag(t.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {tags.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center' }}>هیچ برچسبی یافت نشد.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>لیست نظرات</h3>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>نویسنده</th>
                  <th>متن نظر</th>
                  <th>مقاله</th>
                  <th>تاریخ</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c: any) => (
                  <tr 
                    key={c.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      // Prevent row click if clicking on a button
                      if ((e.target as HTMLElement).closest('.icon-btn')) return;
                      window.open(`/${activeLocale}/blog/${c.post?.slug}`, '_blank');
                    }}
                  >
                    <td>
                      <div>{c.user?.name}</div>
                      <small style={{ color: '#9ca3af' }}>{c.user?.email}</small>
                    </td>
                    <td style={{ maxWidth: '400px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.content}>
                        {c.content}
                      </div>
                      {c.replies && c.replies.length > 0 && (
                        <div 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '12px', fontSize: '11px', cursor: 'help' }}
                          title={`پاسخ شما: ${c.replies[0].content}`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>reply</span>
                          پاسخ داده شده
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#9ca3af', fontSize: '13px' }} title={c.post?.title}>
                      {c.post?.title}
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString('fa-IR')}</td>
                    <td>
                      {c.is_approved ? (
                        <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>تایید شده</span>
                      ) : (
                        <span style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>در انتظار</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      {!c.is_approved && (
                        <button className="icon-btn text-green" onClick={() => handleApproveComment(c.id)} title="تایید نظر">
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                      )}
                      <button className="icon-btn text-blue" onClick={() => { setReplyingToComment(c); setShowReplyModal(true); }} title="ثبت پاسخ">
                        <span className="material-symbols-outlined">reply</span>
                      </button>
                      <button className="icon-btn text-red" onClick={() => handleDeleteComment(c.id)} title="حذف نظر">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>هیچ نظری یافت نشد.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="admin-overlay">
          <div className="admin-modal-card">
            <h4>{editingCategory ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h4>
            <div className="admin-form-grid" style={{ display: 'flex', flexDirection: 'column', padding: 0, border: 'none', background: 'transparent', gap: '15px' }}>
              <div className="form-group">
                <label>نام دسته‌بندی</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>آدرس (Slug)</label>
                <input type="text" style={{ direction: 'ltr', textAlign: 'left' }} value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} />
              </div>
              <div className="form-group">
                <label>توضیحات (اختیاری)</label>
                <textarea rows={3} value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>دسته‌بندی والد (اختیاری)</label>
                <Select
                  value={categoryForm.parent_id}
                  onChange={(val) => setCategoryForm({...categoryForm, parent_id: val})}
                  options={[
                    { value: '', label: 'بدون والد (اصلی)' },
                    ...categories
                      .filter(c => c.id !== editingCategory?.id && !c.parent_id) // Only allow top-level categories as parents (1 level deep)
                      .map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>
            </div>
            <div className="receipt-modal-actions">
              <button className="admin-btn btn-secondary" onClick={handleCloseModal}>انصراف</button>
              <button className="admin-btn" onClick={handleSaveCategory}>ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="admin-overlay">
          <div className="admin-modal-card">
            <h4>{editingTag ? 'ویرایش برچسب' : 'برچسب جدید'}</h4>
            <div className="admin-form-grid" style={{ display: 'flex', flexDirection: 'column', padding: 0, border: 'none', background: 'transparent', gap: '15px' }}>
              <div className="form-group">
                <label>نام برچسب</label>
                <input type="text" value={tagForm.name} onChange={e => setTagForm({...tagForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>آدرس (Slug)</label>
                <input type="text" style={{ direction: 'ltr', textAlign: 'left' }} value={tagForm.slug} onChange={e => setTagForm({...tagForm, slug: e.target.value})} />
              </div>
            </div>
            <div className="receipt-modal-actions">
              <button className="admin-btn btn-secondary" onClick={handleCloseModal}>انصراف</button>
              <button className="admin-btn" onClick={handleSaveTag}>ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="admin-overlay">
          <div className="admin-modal-card">
            <h4>ثبت پاسخ</h4>
            <div className="admin-form-grid" style={{ display: 'flex', flexDirection: 'column', padding: 0, border: 'none', background: 'transparent', gap: '15px' }}>
              <div className="form-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                <label style={{ color: '#9ca3af', marginBottom: '8px', display: 'block' }}>پاسخ به {replyingToComment?.user?.name}:</label>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#d1d5db' }}>{replyingToComment?.content}</div>
              </div>
              <div className="form-group">
                <label>متن پاسخ شما</label>
                <textarea rows={4} value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="پاسخ خود را بنویسید..." />
              </div>
            </div>
            <div className="receipt-modal-actions">
              <button className="admin-btn btn-secondary" onClick={handleCloseModal}>انصراف</button>
              <button className="admin-btn" onClick={handleAdminReply}>ارسال پاسخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
