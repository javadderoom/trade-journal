'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';
import { useTranslation } from '../../store/useAppStore';

export interface TradingConcept {
  id: string;
  name: string;
  allowed_roles: string[];
  color: string | null;
  icon: string | null;
}

export default function ConceptsSettings() {
  const { t, language } = useTranslation();
  const [concepts, setConcepts] = useState<TradingConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('');

  const isFa = language === 'fa';

  const fetchConcepts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/trading-concepts');
      setConcepts(res.data);
    } catch (err) {
      notify.error(isFa ? 'خطا در دریافت مفاهیم' : 'Failed to load concepts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcepts();
  }, []);

  const handleRoleToggle = (role: string) => {
    setRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const handleEdit = (c: TradingConcept) => {
    setEditingId(c.id);
    setName(c.name);
    setRoles(c.allowed_roles);
    setColor(c.color || '#2563eb');
    setIcon(c.icon || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRoles([]);
    setColor('#2563eb');
    setIcon('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error(isFa ? 'نام مفهوم الزامی است' : 'Concept name is required');
    if (roles.length === 0) return notify.error(isFa ? 'انتخاب حداقل یک نقش الزامی است' : 'At least one role must be selected');

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        allowed_roles: roles,
        color: color || null,
        icon: icon || null
      };

      if (editingId) {
        await api.put(`/api/trading-concepts/${editingId}`, payload);
        notify.success(isFa ? 'مفهوم به‌روز شد' : 'Concept updated');
      } else {
        await api.post('/api/trading-concepts', payload);
        notify.success(isFa ? 'مفهوم جدید اضافه شد' : 'New concept added');
      }
      resetForm();
      fetchConcepts();
    } catch (err: any) {
      const msg = err.response?.data?.error || (isFa ? 'خطا در ذخیره' : 'Failed to save');
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isFa ? 'آیا از حذف این مفهوم اطمینان دارید؟' : 'Are you sure you want to delete this concept?')) return;
    
    try {
      await api.delete(`/api/trading-concepts/${id}`);
      notify.success(isFa ? 'مفهوم حذف شد' : 'Concept deleted');
      fetchConcepts();
    } catch (err) {
      notify.error(isFa ? 'خطا در حذف' : 'Failed to delete');
    }
  };

  const roleOptions = [
    { value: 'SETUP', labelEn: 'Setup', labelFa: 'سِتاپ' },
    { value: 'TRIGGER', labelEn: 'Trigger', labelFa: 'تاییدیه (تریگر)' },
    { value: 'CONFLUENCE', labelEn: 'Confluence', labelFa: 'هم‌راستایی (کانفلوئنس)' }
  ];

  if (loading) {
    return <div>{isFa ? 'در حال بارگذاری...' : 'Loading...'}</div>;
  }

  return (
    <section className="settings-section concepts-settings">
      <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        {isFa ? 'مدیریت مفاهیم معاملاتی' : 'Trading Concepts Management'}
      </h3>
      <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '20px' }}>
        {isFa 
          ? 'مفاهیم معاملاتی (سِتاپ‌ها، تاییدیه ها، هم‌راستایی‌ها) کتابخانه معاملاتی شما را تشکیل می‌دهند. این موارد متناسب با استراتژی شما قابل شخصی‌سازی هستند.'
          : 'Trading concepts (Setups, Triggers, Confluences) build up your trading library. You can customize them based on your strategy.'}
      </p>

      {/* Form */}
      <form onSubmit={handleSave} style={{ background: '#0f121d', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ marginBottom: '15px' }}>{editingId ? (isFa ? 'ویرایش مفهوم' : 'Edit Concept') : (isFa ? 'ایجاد مفهوم جدید' : 'Create New Concept')}</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#a0aec0' }}>
              {isFa ? 'نام مفهوم' : 'Concept Name'}
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder={isFa ? 'مثلا: OB, FVG, MSS...' : 'e.g., OB, FVG, MSS...'}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#0b0d19', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#a0aec0' }}>
              {isFa ? 'رنگ لیبل' : 'Label Color'}
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)}
                style={{ width: '40px', height: '40px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem' }}>{color}</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '10px', color: '#a0aec0' }}>
            {isFa ? 'نقش‌ها (میتواند چند مورد باشد)' : 'Roles (Can be multiple)'}
          </label>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {roleOptions.map(r => (
              <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: roles.includes(r.value) ? 'rgba(37,99,235,0.1)' : 'transparent', padding: '8px 12px', border: `1px solid ${roles.includes(r.value) ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px' }}>
                <input 
                  type="checkbox" 
                  checked={roles.includes(r.value)}
                  onChange={() => handleRoleToggle(r.value)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', color: roles.includes(r.value) ? '#60a5fa' : '#a0aec0' }}>
                  {isFa ? r.labelFa : r.labelEn}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
            {saving ? '...' : (editingId ? (isFa ? 'به‌روزرسانی' : 'Update') : (isFa ? 'افزودن' : 'Add'))}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: '8px 20px', background: 'transparent', color: '#a0aec0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {concepts.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f121d', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${c.color || '#3b82f6'}` }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '5px' }}>{c.name}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {c.allowed_roles.map(r => {
                  const opt = roleOptions.find(ro => ro.value === r);
                  return (
                    <span key={r} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#a0aec0' }}>
                      {opt ? (isFa ? opt.labelFa : opt.labelEn) : r}
                    </span>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleEdit(c)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}
        {concepts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
            {isFa ? 'هیچ مفهومی یافت نشد' : 'No concepts found'}
          </div>
        )}
      </div>
    </section>
  );
}
