import clsx from "clsx";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  Trash2,
  User,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  demoRequestsAPI,
  type DemoRequest,
  type DemoRequestStats,
  type DemoRequestStatus,
} from "../api/demoRequests";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SlideInModal } from "../components/SlideInModal";
import { TableSkeleton } from "../components/TableSkeleton";

const STATUS_TABS: Array<{ key: DemoRequestStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "closed", label: "Closed" },
];

const STATUS_STYLES: Record<DemoRequestStatus, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  contacted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  qualified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  closed: "bg-secondary-500/15 text-secondary-300 border-secondary-600/30",
};

const PAGE_SIZE = 20;

export const DemoRequests: React.FC = () => {
  const [items, setItems] = useState<DemoRequest[]>([]);
  const [stats, setStats] = useState<DemoRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DemoRequestStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DemoRequestStatus>("new");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DemoRequest | null>(null);

  const fetchAll = async (
    pageNum = page,
    status = statusFilter,
    q = search,
  ) => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        demoRequestsAPI.list({
          page: pageNum,
          limit: PAGE_SIZE,
          status: status === "all" ? undefined : status,
          search: q || undefined,
        }),
        demoRequestsAPI.stats(),
      ]);
      setItems(listRes.items || []);
      setPages(listRes.pages || 1);
      setTotal(listRes.total || 0);
      setStats(statsRes);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to load demo requests",
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchAll(1, statusFilter, search);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetchAll(page, statusFilter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const openDetails = (req: DemoRequest) => {
    setSelected(req);
    setDraftStatus(req.status);
    setDraftNotes(req.notes || "");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
  };

  const saveDraft = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await demoRequestsAPI.update(selected._id, {
        status: draftStatus,
        notes: draftNotes,
      });
      toast.success("Demo request updated");
      setItems((arr) =>
        arr.map((r) => (r._id === updated._id ? updated : r)),
      );
      setSelected(updated);
      // refresh stats
      const s = await demoRequestsAPI.stats();
      setStats(s);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (req: DemoRequest) => {
    setToDelete(req);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await demoRequestsAPI.remove(toDelete._id);
      toast.success("Demo request deleted");
      if (selected?._id === toDelete._id) closeDrawer();
      fetchAll(page, statusFilter, search);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  const statCards = useMemo(() => {
    const by = stats?.byStatus || {
      new: 0,
      contacted: 0,
      qualified: 0,
      closed: 0,
    };
    return [
      { label: "All", value: stats?.total ?? 0, tone: "text-white" },
      { label: "New", value: by.new, tone: "text-blue-300" },
      { label: "Contacted", value: by.contacted, tone: "text-amber-300" },
      { label: "Qualified", value: by.qualified, tone: "text-emerald-300" },
      { label: "Closed", value: by.closed, tone: "text-secondary-300" },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-5rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Demo Requests</h1>
          <p className="text-secondary-400">
            Inbound requests from the QualityCore landing page.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-secondary-700/50 bg-secondary-900/60 backdrop-blur p-4"
          >
            <div className="text-xs uppercase tracking-widest text-secondary-400">
              {s.label}
            </div>
            <div className={clsx("mt-1 text-3xl font-extrabold", s.tone)}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-secondary-700/50 bg-secondary-900/60 backdrop-blur p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setPage(1);
              }}
              className={clsx(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-colors",
                statusFilter === t.key
                  ? "bg-primary-500/20 text-white border-primary-500/40"
                  : "bg-secondary-800/60 text-secondary-300 border-secondary-700/60 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-500" />
          <input
            type="text"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary-800/60 border border-secondary-700/60 text-sm text-white placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40"
          />
        </div>
      </div>

      {/* Table */}
      {loading && items.length === 0 ? (
        <TableSkeleton rows={8} hasHeader={false} hasFilters={false} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-secondary-700/50 bg-secondary-900/60 p-12 text-center">
          <Send className="w-10 h-10 text-secondary-500 mx-auto" />
          <h3 className="mt-4 text-lg font-bold text-white">
            No demo requests yet
          </h3>
          <p className="mt-2 text-sm text-secondary-400">
            New inbound requests from the landing page will show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-secondary-700/50 bg-secondary-900/60 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-800/60 text-xs uppercase tracking-wider text-secondary-400">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Company</th>
                  <th className="text-left px-5 py-3 font-semibold">Contact</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">
                    Received
                  </th>
                  <th className="text-right px-5 py-3 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-800/60">
                {items.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-secondary-800/40 transition cursor-pointer"
                    onClick={() => openDetails(r)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">
                        {r.fullName}
                      </div>
                      {r.role && (
                        <div className="text-xs text-secondary-400">
                          {r.role}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-secondary-200">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-secondary-500" />
                        {r.company}
                      </div>
                      {r.country && (
                        <div className="text-xs text-secondary-500 mt-0.5">
                          {r.country}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-secondary-300">
                      <a
                        href={`mailto:${r.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 hover:text-white transition"
                      >
                        <Mail className="w-4 h-4 text-secondary-500" />
                        <span className="truncate max-w-[220px]">
                          {r.email}
                        </span>
                      </a>
                      {r.phone && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary-500">
                          <Phone className="w-3.5 h-3.5" />
                          {r.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={clsx(
                          "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                          STATUS_STYLES[r.status],
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-secondary-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary-500" />
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-secondary-500 mt-0.5">
                        {new Date(r.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(r);
                          }}
                          className="p-2 rounded-lg hover:bg-secondary-700/60 text-secondary-300 hover:text-white"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(r);
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-secondary-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-secondary-800/60 text-sm text-secondary-400">
              <div>
                Page {page} of {pages} · {total} total
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-secondary-700/60 hover:bg-secondary-800/60 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="p-2 rounded-lg border border-secondary-700/60 hover:bg-secondary-800/60 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <SlideInModal
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={selected ? selected.fullName : "Demo request"}
        icon={Send}
        iconColor="blue"
        size="md"
        badges={
          selected
            ? [{ label: selected.status, variant: "primary" }]
            : undefined
        }
        footer={
          selected ? (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDrawer}
                className="px-4 py-2 rounded-xl border border-secondary-700/60 text-secondary-300 hover:text-white hover:bg-secondary-800/60"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow icon={User} label="Name" value={selected.fullName} />
              <DetailRow
                icon={Mail}
                label="Email"
                value={
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-primary-400 hover:underline"
                  >
                    {selected.email}
                  </a>
                }
              />
              <DetailRow
                icon={Building2}
                label="Company"
                value={selected.company}
              />
              <DetailRow icon={User} label="Role" value={selected.role || "—"} />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={selected.phone || "—"}
              />
              <DetailRow
                icon={Calendar}
                label="Country"
                value={selected.country || "—"}
              />
              <DetailRow
                icon={Calendar}
                label="Submitted"
                value={new Date(selected.createdAt).toLocaleString()}
              />
              <DetailRow
                icon={Send}
                label="Source"
                value={selected.source || "—"}
              />
            </div>

            {selected.message && (
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-secondary-400 mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </div>
                <div className="rounded-xl border border-secondary-700/60 bg-secondary-800/40 p-3 text-sm text-secondary-100 whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            )}

            <div className="border-t border-secondary-800/60 pt-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-secondary-400 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["new", "contacted", "qualified", "closed"] as DemoRequestStatus[]
                  ).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraftStatus(s)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors",
                        draftStatus === s
                          ? STATUS_STYLES[s]
                          : "bg-secondary-800/40 text-secondary-400 border-secondary-700/60 hover:text-white",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-secondary-400 mb-2">
                  Internal notes
                </label>
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-secondary-800/60 border border-secondary-700/60 text-sm text-white placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40"
                  placeholder="Notes from outreach, next steps, qualification details..."
                />
              </div>
            </div>
          </div>
        )}
      </SlideInModal>

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete demo request?"
        message={
          toDelete
            ? `This will permanently remove the demo request from ${toDelete.fullName} (${toDelete.company}).`
            : ""
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

const DetailRow: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-secondary-700/60 bg-secondary-800/30 p-3">
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-secondary-400">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <div className="mt-1 text-sm text-white font-medium break-words">
      {value}
    </div>
  </div>
);
