// Audit log + approval request system
// All edit/delete actions by staff are logged.
// Staff edits create a pending approval request.
// Admin sees them in a notification badge and can approve/reject.

const AUDIT_KEY    = 'ims_audit_log';
const PENDING_KEY  = 'ims_pending_approvals';

// Log rotation — once the audit log exceeds this many entries, the oldest
// chunk is auto-downloaded as a JSON archive and dropped from localStorage
// so the app stays comfortably under the browser's storage quota.
const ROTATION_THRESHOLD = 1000;
const ROTATION_CHUNK = 500;

export function getAuditLog() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); } catch { return []; }
}

export function getPendingApprovals() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}

// Triggers a browser download of `data` as a formatted JSON file.
function downloadJSON(data, filename) {
  if (typeof document === 'undefined') return; // safety for non-browser/offline contexts
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Archives the oldest `count` entries of `log` as a downloadable JSON file
// and returns the remaining (trimmed) log. Exported so it can also be
// triggered manually (e.g. from a Settings "Archive now" button).
export function rotateAuditLog(log, count = ROTATION_CHUNK) {
  if (log.length <= count) return log;
  const oldest = log.slice(0, count);
  const remaining = log.slice(count);
  const filename = `audit-log-archive-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
  try {
    downloadJSON(oldest, filename);
  } catch (e) {
    console.warn('Audit log auto-archive download failed; keeping entries to avoid data loss', e);
    return log; // don't drop entries if the download failed
  }
  return remaining;
}

function saveAuditLog(log) {
  const toSave = log.length > ROTATION_THRESHOLD ? rotateAuditLog(log, ROTATION_CHUNK) : log;
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Could not save audit log to localStorage', e);
  }
}

function savePending(items) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(items));
}

export function logAudit({ user, action, resourceType, resourceId, detail, approved = true }) {
  const log = getAuditLog();
  log.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: user?.username || 'unknown',
    role: user?.role || 'staff',
    action,           // 'edit' | 'delete' | 'create'
    resourceType,     // 'invoice' | 'product' | etc
    resourceId,
    detail,
    approved,
  });
  saveAuditLog(log);
}

export function createApprovalRequest({ user, action, resourceType, resourceId, detail, payload }) {
  const pending = getPendingApprovals();
  const req = {
    id: `req-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'pending',   // 'pending' | 'approved' | 'rejected'
    user: user?.username || 'staff',
    action,
    resourceType,
    resourceId,
    detail,
    payload,             // the actual change data to apply if approved
  };
  pending.push(req);
  savePending(pending);

  // Also log to audit trail as 'pending'
  logAudit({ user, action, resourceType, resourceId, detail, approved: false });

  return req;
}

export function approveRequest(requestId, applyFn) {
  const pending = getPendingApprovals();
  const req = pending.find(r => r.id === requestId);
  if (!req) return;

  req.status = 'approved';
  req.resolvedAt = new Date().toISOString();
  savePending(pending);

  // Apply the change
  if (applyFn) applyFn(req.payload);

  // Update audit log
  logAudit({
    user: { username: 'admin', role: 'Owner' },
    action: `approved:${req.action}`,
    resourceType: req.resourceType,
    resourceId: req.resourceId,
    detail: `Approved request from ${req.user}: ${req.detail}`,
    approved: true,
  });
}

export function rejectRequest(requestId) {
  const pending = getPendingApprovals();
  const req = pending.find(r => r.id === requestId);
  if (!req) return;
  req.status = 'rejected';
  req.resolvedAt = new Date().toISOString();
  savePending(pending);

  logAudit({
    user: { username: 'admin', role: 'Owner' },
    action: `rejected:${req.action}`,
    resourceType: req.resourceType,
    resourceId: req.resourceId,
    detail: `Rejected request from ${req.user}: ${req.detail}`,
    approved: false,
  });
}

export function pendingCount() {
  return getPendingApprovals().filter(r => r.status === 'pending').length;
}
