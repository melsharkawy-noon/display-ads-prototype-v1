"use client";

import React, { useMemo, useState } from "react";
import { useAccount } from "@/context/AccountContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AccessAdFormat, AccessRelationship, AccessStatus, AccessType } from "@/lib/types";
import { Eye, Pencil, Shield, Trash2, Plus, X } from "lucide-react";
import { useIntake } from "@/context/IntakeContext";

const STATUS_STYLES: Record<AccessStatus, string> = {
  active: "bg-green-50 text-green-700",
  expired: "bg-amber-50 text-amber-700",
  revoked: "bg-red-50 text-red-700",
};

export function AccessControlPage() {
  const {
    accounts,
    accessRelationships,
    accessLogs,
    createAccessRelationship,
    updateAccessRelationship,
    revokeAccessRelationship,
  } = useAccount();
  const { bookings } = useIntake();

  const partners = accounts.filter((a) => a.type === "partner");
  const agencies = accounts.filter((a) => a.type === "agency");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AccessRelationship | null>(null);
  const [viewing, setViewing] = useState<AccessRelationship | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const [form, setForm] = useState({
    partnerAccountId: "",
    agencyAccountId: "",
    accessType: "write" as AccessType,
    allowedFormats: ["Display Ads"] as AccessAdFormat[],
    startDate: "2026-03-01",
    expiryDate: "2026-12-31",
    approver: "",
    notes: "",
    status: "active" as AccessStatus,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      partnerAccountId: "",
      agencyAccountId: "",
      accessType: "write",
      allowedFormats: ["Display Ads"],
      startDate: "2026-03-01",
      expiryDate: "2026-12-31",
      approver: "",
      notes: "",
      status: "active",
    });
    setShowForm(true);
  };

  const openEdit = (row: AccessRelationship) => {
    setEditing(row);
    setForm({
      partnerAccountId: row.partnerAccountId,
      agencyAccountId: row.agencyAccountId,
      accessType: row.accessType,
      allowedFormats: row.allowedFormats,
      startDate: row.startDate.toISOString().slice(0, 10),
      expiryDate: row.expiryDate.toISOString().slice(0, 10),
      approver: row.approver,
      notes: row.notes || "",
      status: row.status,
    });
    setShowForm(true);
  };

  const submitForm = () => {
    if (!form.partnerAccountId || !form.agencyAccountId) return;
    if (editing) {
      updateAccessRelationship(editing.id, {
        accessType: form.accessType,
        allowedFormats: form.allowedFormats,
        startDate: new Date(form.startDate),
        expiryDate: new Date(form.expiryDate),
        status: form.status,
        approver: form.approver,
        notes: form.notes,
      });
    } else {
      createAccessRelationship({
        partnerAccountId: form.partnerAccountId,
        agencyAccountId: form.agencyAccountId,
        accessType: form.accessType,
        allowedFormats: form.allowedFormats,
        startDate: new Date(form.startDate),
        expiryDate: new Date(form.expiryDate),
        approver: form.approver || "N/A",
        notes: form.notes,
      });
    }
    setShowForm(false);
  };

  const relatedCampaigns = useMemo(() => {
    if (!viewing) return [];
    return bookings
      .flatMap((b) => b.campaigns)
      .filter(
        (c) =>
          c.partnerAccountId === viewing.partnerAccountId &&
          c.ownerAccountId === viewing.agencyAccountId
      )
      .slice(0, 8);
  }, [viewing, bookings]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" />
            Access Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage partner-agency access relationships
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Grant Access
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Partner Account</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Partner ID</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Agency Account</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Access Type</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Allowed Formats</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Start</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Expiry</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessRelationships.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                    <td className="px-3 py-3">{row.partnerAccountName}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{row.partnerCode}</td>
                    <td className="px-3 py-3">{row.agencyAccountName}</td>
                    <td className="px-3 py-3 capitalize">{row.accessType}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{row.allowedFormats.join(", ")}</td>
                    <td className="px-3 py-3">{row.startDate.toLocaleDateString()}</td>
                    <td className="px-3 py-3">{row.expiryDate.toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_STYLES[row.status])}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewing(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {row.status !== "revoked" && (
                          <button onClick={() => setRevokeId(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Revoke">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Account Directory</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Partners</p>
              <ul className="space-y-1 text-gray-700">
                {partners.map((p) => (
                  <li key={p.id}>{p.name} {p.code ? `(${p.code})` : ""}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agencies</p>
              <ul className="space-y-1 text-gray-700">
                {agencies.map((a) => (
                  <li key={a.id}>{a.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Activity Log</h3>
          {accessLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No access changes yet.</p>
          ) : (
            <div className="space-y-2">
              {accessLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="text-sm text-gray-700">
                  <span className="font-medium">{log.action}</span> — {log.summary}
                  <span className="text-xs text-gray-400 ml-2">
                    by {log.actor} · {log.timestamp.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {editing ? "Edit Access Relationship" : "Grant Access"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <Field label="Partner Account">
                <select
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  value={form.partnerAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, partnerAccountId: e.target.value }))}
                  disabled={!!editing}
                >
                  <option value="">Select partner</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Agency Account">
                <select
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  value={form.agencyAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, agencyAccountId: e.target.value }))}
                  disabled={!!editing}
                >
                  <option value="">Select agency</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Access Type">
                <select
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  value={form.accessType}
                  onChange={(e) => setForm((f) => ({ ...f, accessType: e.target.value as AccessType }))}
                >
                  <option value="view">View</option>
                  <option value="write">Write</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AccessStatus }))}
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </Field>
              <Field label="Allowed Ad Formats">
                <div className="flex gap-2 flex-wrap">
                  {(["PLA", "Brand Ads", "Display Ads"] as AccessAdFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          allowedFormats: f.allowedFormats.includes(fmt)
                            ? f.allowedFormats.filter((x) => x !== fmt)
                            : [...f.allowedFormats, fmt],
                        }))
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs border",
                        form.allowedFormats.includes(fmt)
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-gray-300 text-gray-600"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Approver">
                <input
                  value={form.approver}
                  onChange={(e) => setForm((f) => ({ ...f, approver: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="Approver name"
                />
              </Field>
              <Field label="Start Date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </Field>
              <Field label="Expiry Date">
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </Field>
              <div className="col-span-2">
                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm min-h-20"
                    placeholder="Optional notes"
                  />
                </Field>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={submitForm}>{editing ? "Save Changes" : "Grant Access"}</Button>
            </div>
          </div>
        </div>
      )}

      {revokeId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-md p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Revoke Access?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will set the relationship status to Revoked and remove campaign creation rights.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRevokeId(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  revokeAccessRelationship(revokeId);
                  setRevokeId(null);
                }}
              >
                Confirm Revoke
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl border">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Access Relationship Detail</h3>
              <button onClick={() => setViewing(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <Info label="Partner" value={`${viewing.partnerAccountName} (${viewing.partnerCode})`} />
                <Info label="Agency" value={viewing.agencyAccountName} />
                <Info label="Status" value={viewing.status} />
                <Info label="Access Type" value={viewing.accessType} />
                <Info label="Formats" value={viewing.allowedFormats.join(", ")} />
                <Info label="Approver" value={viewing.approver} />
                <Info label="Start" value={viewing.startDate.toLocaleDateString()} />
                <Info label="Expiry" value={viewing.expiryDate.toLocaleDateString()} />
                <Info label="Updated" value={viewing.updatedAt.toLocaleString()} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{viewing.notes || "—"}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Related Campaigns</h4>
                {relatedCampaigns.length === 0 ? (
                  <p className="text-sm text-gray-500">No campaigns found for this relationship.</p>
                ) : (
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Campaign Name</th>
                        <th className="px-3 py-2 text-left">Owner</th>
                        <th className="px-3 py-2 text-left">Partner</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Spend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedCampaigns.map((c) => (
                        <tr key={c.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">{c.campaignName}</td>
                          <td className="px-3 py-2">{c.ownerAccountName || "—"}</td>
                          <td className="px-3 py-2">{c.partnerAccountName || "—"}</td>
                          <td className="px-3 py-2 capitalize">{c.status}</td>
                          <td className="px-3 py-2 text-right">${Math.round(c.spend).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

