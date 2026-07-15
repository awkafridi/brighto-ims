// Audit log + approval request system
// All edit/delete actions by staff are logged.
// Staff edits create a pending approval request.
// Admin sees them in a notification badge and can approve/reject.

const AUDIT_KEY    = 'ims_audit_log';
const PENDING_KEY  = 'ims_pending_approvals';

// Rotation thresholds — once the log exceeds MAX_LOG_SIZE entries, the oldest
// ROTATE_CHUNK_SIZE entries are auto-downloaded as a JSON backup file and
// removed from localStorage, keeping the browser's storage usage bounded.
const MAX_LOG_SIZE = 1000;
const ROTATE_CHUNK_SIZE = 500;

export function getAuditLog() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); } catch { return []; }
}

export function getPendingApprovals() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}

// Downloads the given log entries as a timestamped JSON file so nothing is
// lost when older entries are rotated out of localStorage.
function downloadLogArchive(entries) {
  try {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `audit-log-archive-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('Could not auto-download audit log archive', e);
  }
}

// If the log has grown past MAX_LOG_SIZE, download the oldest ROTATE_CHUNK_SIZE
// entries as a backup file and return the remaining (most recent) entries.
// Otherwise returns the log unchanged.
export function rotateAuditLogIfNeeded(log) {
  if (log.length <= MAX_LOG_SIZE) return log;
  const toArchive = log.slice(0, ROTATE_CHUNK_SIZE);
  const remaining = log.slice(ROTATE_CHUNK_SIZE);
  downloadLogArchive(toArchive);
  return remaining;
}

function saveAuditLog(log) {
  const rotated = rotateAuditLogIfNeeded(log);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(rotated));
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
