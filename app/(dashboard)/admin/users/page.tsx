'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  ShieldCheck,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Edit,
  KeyRound,
  History,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Log History State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLogUserId, setSelectedLogUserId] = useState<string>('');
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchUserLogs = async (userIdToFetch?: string) => {
    setLoadingLogs(true);
    try {
      const targetId = userIdToFetch !== undefined ? userIdToFetch : selectedLogUserId;
      const q = new URLSearchParams();
      if (targetId) q.set('userId', targetId);

      const res = await fetch(`/api/admin/audit-logs?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUserLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load user logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenLogs = (userId?: string) => {
    const id = userId || '';
    setSelectedLogUserId(id);
    setIsLogModalOpen(true);
    fetchUserLogs(id);
  };

  const selectedLogUser = users.find((u) => u.id === selectedLogUserId) || null;

  const formatTimestamp = (val: any) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '-';
      return format(d, 'dd-MMM-yyyy HH:mm:ss');
    } catch {
      return '-';
    }
  };

  const renderDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    if (typeof details === 'object') {
      if (details.message) return String(details.message);
      if (details.email) return `Email: ${details.email}`;
      if (details.name) return `Name: ${details.name}`;
      try {
        const entries = Object.entries(details);
        if (entries.length === 0) return '-';
        return entries
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
          .join(', ');
      } catch {
        return JSON.stringify(details);
      }
    }
    return String(details);
  };

  const getActionBadgeClass = (action?: string | null) => {
    if (!action || typeof action !== 'string') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (action.includes('LOGIN')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (action.includes('CREATE') || action.includes('FINALIZED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('DELETE') || action.includes('PURGE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('SALES_USER');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setName('');
    setRole('SALES_USER');
    setPhone('');
    setActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setEmail(u.email);
    setPassword('');
    setName(u.name);
    setRole(u.role);
    setPhone(u.phone || '');
    setActive(u.active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const payload: any = {
        name,
        role,
        phone,
        active,
      };

      if (editingUser) {
        payload.id = editingUser.id;
        if (password) payload.password = password;
      } else {
        payload.email = email;
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: any) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      fetchUsers();
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              ADMIN MASTER
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure internal staff accounts, roles (Admin / Sales User), and system access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenLogs()}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Log History</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New User Account</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <span>Loading users...</span>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-mono font-bold text-slate-700">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {u.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3 text-indigo-600" />}
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{u.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {format(new Date(u.createdAt), 'dd-MMM-yyyy')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {u.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenLogs(u.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors inline-block"
                        title="View Log History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors inline-block"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingUser ? 'Edit User Account' : 'Create Internal User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-3 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="name@svgelectric.com"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Reset Password (leave empty to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SALES_USER">SALES_USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="userActive" className="text-slate-700 font-medium">
                  Active (Allowed to sign in)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'Update User' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log History Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">User Activity & Audit Log History</h2>
                  <p className="text-[11px] text-slate-400">
                    Chronological activity tracking of authentications, estimations, and master updates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar with Dropdown to select User */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                <span className="font-bold text-slate-700 whitespace-nowrap font-mono uppercase text-[11px]">
                  Select User:
                </span>
                <select
                  value={selectedLogUserId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedLogUserId(newId);
                    fetchUserLogs(newId);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-md"
                >
                  <option value="">-- All Users (System-wide History) --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — [{u.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {userLogs.length} events logged
                </span>
                <button
                  type="button"
                  onClick={() => fetchUserLogs(selectedLogUserId)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Refresh Log History"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Selected User Header Card (if user is picked) */}
            {selectedLogUser && (
              <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {(selectedLogUser.name || 'US').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold text-xs">{selectedLogUser.name}</strong>
                    <span className="text-slate-500 font-mono text-[11px]">{selectedLogUser.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200/70 text-slate-700">
                    ROLE: {selectedLogUser.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${selectedLogUser.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {selectedLogUser.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            )}

            {/* Log History Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingLogs ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <span>Loading user history records...</span>
                </div>
              ) : userLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No activity logs recorded yet</p>
                  <p className="text-[11px] text-slate-400">
                    Actions performed by this user will automatically be tracked here.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Timestamp</th>
                        {!selectedLogUserId && <th className="px-3.5 py-2.5">User</th>}
                        <th className="px-3.5 py-2.5">Action Event</th>
                        <th className="px-3.5 py-2.5">Target Entity</th>
                        <th className="px-3.5 py-2.5">Activity Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                            {formatTimestamp(log.createdAt)}
                          </td>
                          {!selectedLogUserId && (
                            <td className="px-3.5 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                              {log.user?.name || log.user?.email || 'System'}
                            </td>
                          )}
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeClass(
                                log.action
                              )}`}
                            >
                              {String(log.action || 'EVENT')}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                            {String(log.entity || '-')}
                            {log.entityId && (
                              <span className="text-slate-400 ml-1">
                                ({typeof log.entityId === 'string' ? log.entityId.slice(0, 8) : String(log.entityId).slice(0, 8)}...)
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 text-[11px] max-w-md break-words">
                            {renderDetails(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Audited with SHA-256 integrity logs &bull; Preserved across system restarts.
              </span>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}