'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { notify } from '../../../lib/notify';
import { toPersianDigits } from '../../../utils/farsi';
import '../admin.scss';

import BlogEditor from '../../../components/admin/BlogEditor';

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
  
  // States
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);

  // Modals / Form states
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);

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
      const res = await api.post(`/api/admin/blog/posts/${id}/translate`);
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

  const handleGenerateAIPost = async () => {
    if (!await notify.confirm({ title: 'تولید مقاله با هوش مصنوعی', message: 'آیا مطمئن هستید که می‌خواهید پروسه تولید مقاله با هوش مصنوعی را به صورت دستی آغاز کنید؟ این کار ممکن است چند دقیقه طول بکشد.' })) return;
    try {
      await api.post('/api/admin/blog/posts/generate-ai');
      notify.success('پروسه تولید مقاله در پس‌زمینه آغاز شد. چند دقیقه دیگر لیست را رفرش کنید.');
    } catch (err) {
      notify.error('خطا در شروع پروسه هوش مصنوعی');
    }
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
          <button className="btn-secondary" onClick={() => { setShowEditor(false); setEditingPost(null); }}>
            بازگشت به لیست
          </button>
        </header>
        <div className="admin-panel-card" style={{ padding: '20px' }}>
          <BlogEditor 
            initialData={editingPost} 
            locale={activeLocale}
            onSuccess={() => { setShowEditor(false); setEditingPost(null); fetchPosts(); }} 
            onCancel={() => { setShowEditor(false); setEditingPost(null); }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={handleGenerateAIPost} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="material-symbols-outlined">smart_toy</span>
                تولید خودکار
              </button>
              <button className="btn-primary" onClick={() => setShowEditor(true)}>مقاله جدید +</button>
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
                    <td>
                      {!(post.translation || post.translated_from) && (
                        <button className="icon-btn text-green" onClick={() => handleTranslatePost(post.id)} title="ایجاد ترجمه">
                          <span className="material-symbols-outlined">translate</span>
                        </button>
                      )}
                      {(post.translation || post.translated_from) && (
                        <span className="badge" style={{ fontSize: '10px', background: '#374151', padding: '2px 6px', borderRadius: '4px', marginRight: '5px' }}>
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
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>بخش مدیریت دسته‌بندی‌ها به زودی اضافه می‌شود.</div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>لیست برچسب‌ها</h3>
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>بخش مدیریت برچسب‌ها به زودی اضافه می‌شود.</div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="admin-panel-card">
          <div className="card-header-actions">
            <h3>لیست نظرات</h3>
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>بخش مدیریت نظرات به زودی اضافه می‌شود.</div>
        </div>
      )}
    </div>
  );
}
