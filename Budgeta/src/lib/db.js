/**
 * db.js — the ONLY file that imports supabase.
 * All UI code calls functions from here; never import supabase directly.
 */
import { supabase } from './supabase.js'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const getSession = () => supabase.auth.getSession()

export const onAuthChange = (cb) => supabase.auth.onAuthStateChange(cb)

export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const resetPassword = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

export const updatePassword = (newPassword) =>
  supabase.auth.updateUser({ password: newPassword })

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateSettings(patch) {
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
  if (error) throw error
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function upsertCategory(cat) {
  const { data: { session } } = await supabase.auth.getSession()
  const payload = { ...cat, user_id: session.user.id }
  const { data, error } = await supabase
    .from('categories')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Returns all non-deleted transactions between two ISO timestamps.
 */
export async function getTransactions(from, to) {
  let q = supabase
    .from('transactions')
    .select('*, categories(id, name, color, icon)')
    .is('deleted_at', null)
    .order('spent_at', { ascending: false })
  if (from) q = q.gte('spent_at', from)
  if (to)   q = q.lt('spent_at', to)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function addTransaction(tx) {
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...tx, user_id: session.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function clearAllTransactions() {
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
  if (error) throw error
}

export async function clearPeriodTransactions(from, to) {
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .gte('spent_at', from)
    .lt('spent_at', to)
  if (error) throw error
}

export async function clearCategoryTransactions(categoryId) {
  const { data: { session } } = await supabase.auth.getSession()
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .eq('category_id', categoryId)
    .is('deleted_at', null)
  if (error) throw error
}
