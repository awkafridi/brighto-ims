// Centralized auth — all role checks go through here

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('ims_user') || '{}'); } catch { return {}; }
}

export function isAdmin() {
  const u = getCurrentUser();
  return u.role === 'Owner' || u.username === 'admin';
}

export function isStaff() {
  const u = getCurrentUser();
  return !isAdmin() && !!u.username;
}

// What each role can do
export const PERMISSIONS = {
  // Pages staff can VIEW (read-only)
  staffCanView: ['/', '/shopkeepers', '/invoices'],
  // Pages completely hidden from staff
  staffHidden: ['/inventory', '/suppliers', '/ledger', '/expenses', '/import', '/settings'],
};

export function canView(path, user) {
  if (!user?.username) return false;
  if (user.role === 'Owner' || user.username === 'admin') return true;
  // Staff: only shopkeepers, invoices, dashboard
  return PERMISSIONS.staffCanView.some(p => path === p || path.startsWith(p + '/'));
}
