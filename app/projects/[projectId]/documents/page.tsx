"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Search,
  UploadCloud,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { useRecords } from "@/hooks/useRecords";

interface DocumentItem {
  _id: string;
  title: string;
  docNumber: string;
  category: string;
  fileType: string;
  version: string;
  uploadedDate: string;
  uploadedBy: string;
  status: "APPROVED" | "UNDER_REVIEW" | "DRAFT" | "ARCHIVED";
  fileUrl?: string;
  notes?: string;
}

const CATEGORIES = [
  "ALL",
  "Architectural Drawings",
  "Structural Engineering",
  "Contracts & Agreements",
  "Government & Municipal Permits",
  "Invoices & Receipts",
  "Safety & Environmental Certificates",
  "Site Inspection Reports",
  "Submittals & Specifications",
];

const FILE_TYPES = ["PDF", "DWG", "DOCX", "XLSX", "IMAGE", "ZIP", "OTHER"];

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Operational records store for documents
  const {
    records: docRecords,
    loading,
    reload: reloadDocs,
    create: createDocRecord,
    remove: removeDocRecord,
  } = useRecords("documents", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIES[1]);
  const [formFileType, setFormFileType] = useState("PDF");
  const [formVersion, setFormVersion] = useState("Rev 1.0");
  const [formStatus, setFormStatus] = useState<DocumentItem["status"]>("APPROVED");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Transform records into typed document items
  const documents: DocumentItem[] = useMemo(() => {
    return docRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        title: r.title || d.title || "Project Document",
        docNumber: d.docNumber || `DOC-${r._id.slice(-5).toUpperCase()}`,
        category: d.category || "General Documents",
        fileType: d.fileType || "PDF",
        version: d.version || "v1.0",
        uploadedDate: d.uploadedDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        uploadedBy: d.uploadedBy || "Project Engineer",
        status: (r.status as DocumentItem["status"]) || (d.status as DocumentItem["status"]) || "APPROVED",
        fileUrl: d.fileUrl,
        notes: d.notes,
      };
    });
  }, [docRecords]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const approved = documents.filter((d) => d.status === "APPROVED").length;
    const underReview = documents.filter((d) => d.status === "UNDER_REVIEW").length;
    const permits = documents.filter((d) => d.category.includes("Permit") || d.category.includes("Certificate")).length;

    return { total, approved, underReview, permits };
  }, [documents]);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (categoryFilter !== "ALL" && doc.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.docNumber.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          (doc.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, categoryFilter, statusFilter, search]);

  const handleRegisterDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedback({ type: "error", message: "Document title is required." });
      return;
    }

    try {
      setSubmitting(true);
      const docNum = formDocNumber.trim().toUpperCase() || `DOC-${Date.now().toString().slice(-6)}`;

      await createDocRecord({
        projectId,
        title: formTitle.trim(),
        status: formStatus,
        data: {
          title: formTitle.trim(),
          docNumber: docNum,
          category: formCategory,
          fileType: formFileType,
          version: formVersion.trim() || "v1.0",
          status: formStatus,
          uploadedDate: new Date().toISOString().split("T")[0],
          uploadedBy: "Site Architect",
          fileUrl: formFileUrl.trim(),
          notes: formNotes.trim(),
        },
      });

      setFeedback({ type: "success", message: `Document "${formTitle}" registered in project registry.` });
      setShowAddModal(false);
      setFormTitle("");
      setFormDocNumber("");
      setFormFileUrl("");
      setFormNotes("");
      reloadDocs();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error registering document" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeDocRecord(deletingId);
      setFeedback({ type: "success", message: "Document removed from registry." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadDocs();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete document" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] dark:bg-[#111111] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
              : "bg-[#FAFAFA] dark:bg-[#111111] border-[#303030] text-[#000000] dark:text-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-[#666666] dark:text-[#A3A3A3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Project Registry & Drawings
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Documents
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Architectural drawings, structural calculations, permits, contract agreements, and submittals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            Company Archive
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Documents</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Approved & Active</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.approved}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Under Technical Review</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.underReview}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Statutory Permits</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.permits}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title, drawing number, or scope..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none max-w-[190px] truncate"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {(search || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="px-2 py-1.5 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <FileText className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
          <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No documents in registry</h3>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
            {search || categoryFilter !== "ALL" || statusFilter !== "ALL"
              ? "No documents match your active search and filter parameters."
              : "Register engineering drawings, contractor agreements, and city council building permits."}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                <th className="py-3 px-4 font-semibold">Document Title & Ref</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-center">Format</th>
                <th className="py-3 px-4 font-semibold text-center">Version</th>
                <th className="py-3 px-4 font-semibold">Uploaded Date</th>
                <th className="py-3 px-4 font-semibold">Uploaded By</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {filteredDocs.map((doc) => (
                <tr key={doc._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{doc.title}</div>
                    <div className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">{doc.docNumber}</div>
                    {doc.notes && (
                      <div className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5 line-clamp-1 max-w-sm">
                        {doc.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{doc.category}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[10px] text-[#000000] dark:text-[#FFFFFF]">
                    <span className="px-1.5 py-0.5 rounded border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                      {doc.fileType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                    {doc.version}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                    {doc.uploadedDate}
                  </td>
                  <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{doc.uploadedBy}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {doc.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setFeedback({
                              type: "success",
                              message: `Document ${doc.docNumber} (${doc.title}) downloaded to workspace.`,
                            });
                          }}
                          title="Download Document"
                          className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeletingId(doc._id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REGISTER DOCUMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Register Document in Registry</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDocument} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Substructure Structural Steel Reinforcement Layout"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Drawing / Doc #
                  </label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    placeholder="e.g. DWG-STR-004"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Format
                  </label>
                  <select
                    value={formFileType}
                    onChange={(e) => setFormFileType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  >
                    {FILE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Version / Rev
                  </label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Approval Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as DocumentItem["status"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  File URL or Reference Link
                </label>
                <input
                  type="text"
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  placeholder="https://... or site-server/drawings/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Scope Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Approved by City Planning Authority on 12/03/2026..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-[#000000] dark:text-[#FFFFFF] mb-3">
              <div className="p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                <Trash2 className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
              </div>
              <h3 className="text-base font-bold">Remove Document</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to delete this document from the project registry?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteDocument}
                className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
