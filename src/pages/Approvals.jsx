import { useState, useEffect } from 'react';
import { useStore } from '../data/store';
import { Card, Badge, Table, PageHeader, Btn } from '../components/UI';
import { getPendingApprovals, getAuditLog, approveRequest, rejectRequest } from '../utils/auditLog';

export default function Approvals() {
  const store = useStore();
  const [pending, setPending] = useState(getPendingApprovals());
  const [auditLog, setAuditLog] = useState(getAuditLog());
  const [tab, setTab] = useState('pending');

  const refresh = () => {
    setPending(getPendingApprovals());
    setAuditLog(getAuditLog());
  };

  useEffect(() => { refresh(); }, []);

  const pendingItems = pending.filter(r => r.status === 'pending');
  const resolvedItems = pending.filter(r => r.status !== 'pending');

  const handleApprove = (req) => {
    approveRequest(req.id, (payload) => {
      // Apply the change based on action type
      if (req.action === 'edit-invoice' && payload?.id) {
        store.editInvoice(payload.id, payload.changes);
      } else if (req.action === 'delete-invoice' && payload?.id) {
        store.deleteInvoice(payload.id);
      }
    });
    refresh();
  };

  const handleReject = (req) => {
    rejectRequest(req.id);
    refresh();
  };

  const statusColor = { pending: 'amber', approved: 'green', rejected: 'red' };

  return (
    <div>
      <PageHeader title="✅ Approvals & Audit Log" subtitle="Review staff edit requests and see a full activity trail" />

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['pending', 'resolved', 'audit'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 18px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: tab === t ? 'var(--accent)' : 'var(--bg2)',
            color: tab === t ? '#fff' : 'var(--text2)',
            border: tab === t ? 'none' : '0.5px solid var(--border2)', cursor: 'pointer',
            textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6
          }}>
            {t === 'pending' ? `Pending (${pendingItems.length})` : t === 'resolved' ? `Resolved (${resolvedItems.length})` : `Audit log (${auditLog.length})`}
          </button>
        ))}
        <Btn variant="ghost" onClick={refresh} style={{ marginLeft: 'auto', fontSize: 12 }}>↻ Refresh</Btn>
      </div>

      {/* Pending approvals */}
      {tab === 'pending' && (
        <div>
          {pendingItems.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No pending requests</div>
                <div style={{ fontSize: 13 }}>All staff edit requests have been resolved</div>
              </div>
            </Card>
          ) : (
            pendingItems.map(req => (
              <Card key={req.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Badge color="amber">⏳ Pending</Badge>
                      <Badge color="accent">{req.action}</Badge>
                      <Badge color="gray">{req.resourceType}</Badge>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{req.detail}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                      Requested by <strong>{req.user}</strong> at {new Date(req.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Btn onClick={() => handleApprove(req)}>✓ Approve</Btn>
                    <Btn variant="danger" onClick={() => handleReject(req)}>✗ Reject</Btn>
                  </div>
                </div>
                {req.payload && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
                    {JSON.stringify(req.payload, null, 2).slice(0, 200)}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Resolved */}
      {tab === 'resolved' && (
        <Card style={{ padding: 0 }}>
          <Table columns={[
            { key: 'timestamp', label: 'Time', render: v => new Date(v).toLocaleString() },
            { key: 'user', label: 'Requested by' },
            { key: 'action', label: 'Action', render: v => <Badge color="accent">{v}</Badge> },
            { key: 'detail', label: 'Detail', muted: true },
            { key: 'status', label: 'Status', render: v => <Badge color={statusColor[v] || 'gray'}>{v}</Badge> },
          ]} data={resolvedItems.reverse()} />
          {resolvedItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No resolved requests yet</div>
          )}
        </Card>
      )}

      {/* Audit log */}
      {tab === 'audit' && (
        <Card style={{ padding: 0 }}>
          <Table columns={[
            { key: 'timestamp', label: 'Time', render: v => new Date(v).toLocaleString() },
            { key: 'user', label: 'User' },
            { key: 'role', label: 'Role', render: v => <Badge color={v === 'Owner' ? 'accent' : 'amber'}>{v || 'staff'}</Badge> },
            { key: 'action', label: 'Action', render: v => <Badge color="gray">{v}</Badge> },
            { key: 'resourceType', label: 'Type' },
            { key: 'detail', label: 'Detail', muted: true },
            { key: 'approved', label: 'Result', render: v => <Badge color={v ? 'green' : 'red'}>{v ? 'Done' : 'Pending'}</Badge> },
          ]} data={[...auditLog].reverse()} />
          {auditLog.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>No activity logged yet</div>
          )}
        </Card>
      )}
    </div>
  );
}
