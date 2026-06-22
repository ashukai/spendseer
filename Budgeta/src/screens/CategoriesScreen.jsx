import { useState, useEffect } from 'react'
import { getCategories, upsertCategory, deleteCategory } from '../lib/db.js'
import { BottomNav } from './HomeScreen.jsx'
import CategoryIcon from '../components/CategoryIcon.jsx'

const PRESET_COLORS = [
  '#FF6B6B','#F5A623','#F5D800','#2DC88A',
  '#00B5A5','#378ADD','#7C6FFF','#E8558A',
  '#8A8AB0','#B0603C',
]

// Tabler icon names available as category icons
const PRESET_ICONS = [
  'tools-kitchen-2','coffee','pizza','cup',
  'bus','car','train','bike',
  'shopping-bag','shopping-cart','shirt','tag',
  'confetti','music','device-gamepad-2','headphones',
  'heart','pill','stethoscope','bandage',
  'plane','compass','beach','mountain',
  'home','bulb','device-laptop','briefcase',
  'pig-money','coin','wallet','credit-card',
  'book','school','pencil','palette',
  'dog','cat','plant-2','flower',
  'gift','star','crown','box',
]

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([])
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState({ name: '', color: PRESET_COLORS[0], icon: 'box' })
  const [saving, setSaving]         = useState(false)

  async function load() {
    const cats = await getCategories()
    setCategories(cats)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm({ name: '', color: PRESET_COLORS[0], icon: 'box' })
    setEditing('new')
  }

  function openEdit(cat) {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon })
    setEditing(cat)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await upsertCategory(
        editing === 'new'
          ? { ...form, sort_order: categories.length }
          : { ...editing, ...form }
      )
      await load()
      setEditing(null)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete "${cat.name}"? Existing expenses won't be affected.`)) return
    await deleteCategory(cat.id)
    await load()
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2 className="screen-title">Categories</h2>
        <button
          onClick={openNew}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>

      <div className="cat-manage-list">
        {categories.map((cat) => (
          <div key={cat.id} className="cat-manage-row">
            <CategoryIcon icon={cat.icon} color={cat.color} size={44} />
            <span className="cat-manage-name">{cat.name}</span>
            <button className="text-btn" onClick={() => openEdit(cat)}>Edit</button>
            <button className="text-btn danger" onClick={() => handleDelete(cat)}>Delete</button>
          </div>
        ))}
      </div>

      {/* Edit / New sheet */}
      {editing && (
        <div className="bottom-sheet-overlay" onClick={() => setEditing(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="sheet-title">
              {editing === 'new' ? 'New category' : `Edit "${editing.name}"`}
            </h3>

            <input
              className="auth-input"
              placeholder="Category name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />

            <p className="sheet-label">Icon</p>
            <div className="icon-picker">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  className={`icon-option ${form.icon === icon ? 'active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  style={{
                    background: form.icon === icon ? form.color + '18' : 'var(--bg)',
                    borderColor: form.icon === icon ? form.color : 'transparent',
                  }}
                  title={icon}
                >
                  <CategoryIcon icon={icon} color={form.icon === icon ? form.color : 'var(--text-muted)'} size={36} />
                </button>
              ))}
            </div>

            <p className="sheet-label">Color</p>
            <div className="color-picker">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${form.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                />
              ))}
            </div>

            {/* Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <CategoryIcon icon={form.icon} color={form.color} size={44} />
              <span style={{ fontWeight: 700, fontSize: 16, color: form.color }}>
                {form.name || 'Preview'}
              </span>
            </div>

            <div className="sheet-actions">
              <button className="text-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button
                style={{
                  padding: '10px 24px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 15, fontWeight: 700,
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="categories" />
    </div>
  )
}
