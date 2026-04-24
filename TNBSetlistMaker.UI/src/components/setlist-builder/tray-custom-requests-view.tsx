import { useState } from "react";
import type { CustomRequest } from "@/types/custom-request";
import { MomentPicker } from "./moment-picker";
import { MomentChip } from "./moment-chip";

const MAX_REQUESTS = 5;

interface TrayCustomRequestsViewProps {
  customRequests: CustomRequest[];
  addCustomRequest: () => void;
  updateCustomRequest: (id: string, patch: Partial<Omit<CustomRequest, "id">>) => void;
  removeCustomRequest: (id: string) => void;
}

export function TrayCustomRequestsView({
  customRequests,
  addCustomRequest,
  updateCustomRequest,
  removeCustomRequest,
}: TrayCustomRequestsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<CustomRequest>>>({});

  function openEdit(id: string) {
    const req = customRequests.find((r) => r.id === id);
    if (!req) return;
    setDrafts((prev) => ({ ...prev, [id]: { ...req } }));
    setExpandedId(id);
  }

  function saveDraft(id: string) {
    const d = drafts[id];
    if (!d) return;
    const title = d.title?.trim() ?? "";
    const artist = d.artist?.trim() ?? "";
    if (!title || !artist) return;
    updateCustomRequest(id, {
      title,
      artist,
      linkUrl: d.linkUrl?.trim() || undefined,
      momentId: d.momentId,
      note: d.note?.trim() || undefined,
    });
    setExpandedId(null);
  }

  function cancelEdit(id: string) {
    // If the request is still empty (was just added), remove it
    const req = customRequests.find((r) => r.id === id);
    if (req && !req.title && !req.artist) {
      removeCustomRequest(id);
    }
    setExpandedId(null);
  }

  function patchDraft(id: string, patch: Partial<CustomRequest>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function handleAdd() {
    if (customRequests.length >= MAX_REQUESTS) return;
    addCustomRequest();
    // The new item lands at the end; open it immediately on next tick
    setTimeout(() => {
      // We can't know the new id here, so we use a stable ref trick via useEffect in the parent.
      // Instead, we expose a flag and let the list render handle it.
    }, 0);
  }

  // Auto-open newly added items that have no title yet
  const newItem = customRequests.find((r) => !r.title && !r.artist && r.id !== expandedId);
  if (newItem && expandedId !== newItem.id) {
    setExpandedId(newItem.id);
    setDrafts((prev) => ({ ...prev, [newItem.id]: { ...newItem } }));
  }

  const atMax = customRequests.length >= MAX_REQUESTS;

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      {customRequests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-bone/40 text-sm">No requests yet.</p>
          <p className="text-bone/30 text-xs mt-1">Add up to 5 songs you'd love to hear that aren't in our catalog.</p>
        </div>
      )}

      {customRequests.map((req) => {
        const isExpanded = expandedId === req.id;
        const d = drafts[req.id] ?? req;

        if (isExpanded) {
          const canSave = (d.title?.trim() ?? "").length > 0 && (d.artist?.trim() ?? "").length > 0;
          return (
            <div key={req.id} className="rounded-xl border hairline bg-ink/40 p-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <div>
                    <label className="stamp block mb-1">
                      Song title <span className="text-skip">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Can't Help Falling in Love"
                      value={d.title ?? ""}
                      onChange={(e) => patchDraft(req.id, { title: e.target.value })}
                      className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-gold"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="stamp block mb-1">
                      Artist <span className="text-skip">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elvis Presley"
                      value={d.artist ?? ""}
                      onChange={(e) => patchDraft(req.id, { artist: e.target.value })}
                      className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="stamp block mb-1">
                  Link <span className="text-bone/40">(optional — Spotify or YouTube)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/track/..."
                  value={d.linkUrl ?? ""}
                  onChange={(e) => patchDraft(req.id, { linkUrl: e.target.value })}
                  className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <div className="stamp mb-2">
                  Moment <span className="text-bone/40">(optional)</span>
                </div>
                <MomentPicker
                  singleSelect
                  selectedMomentId={d.momentId}
                  onSelectMoment={(id) => patchDraft(req.id, { momentId: id })}
                  compact
                />
              </div>

              <div>
                <label className="stamp block mb-1">
                  Note <span className="text-bone/40">(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. We danced to this at our first date — very special to us."
                  value={d.note ?? ""}
                  onChange={(e) => patchDraft(req.id, { note: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  onClick={() => cancelEdit(req.id)}
                  className="text-xs text-bone/50 hover:text-bone px-3 py-1.5 rounded-md border hairline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveDraft(req.id)}
                  disabled={!canSave}
                  className="text-xs bg-gold/20 text-goldlight border border-gold/30 px-3 py-1.5 rounded-md hover:bg-gold/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          );
        }

        // Collapsed row
        return (
          <div key={req.id} className="rounded-xl border hairline bg-ink/40 px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-bone leading-snug truncate">
                {req.title || <span className="text-bone/30 italic">Untitled</span>}
              </div>
              <div className="text-xs text-bone/55 truncate">
                {req.artist || <span className="italic">Unknown artist</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {req.momentId && <MomentChip moment={req.momentId} size="xs" />}
                {req.linkUrl && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-bone/40 bg-ink/60 px-1.5 py-0.5 rounded-full border hairline">
                    🔗 Link
                  </span>
                )}
                {req.note && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-bone/40 bg-ink/60 px-1.5 py-0.5 rounded-full border hairline">
                    ✏ Note
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEdit(req.id)}
                className="text-bone/40 hover:text-goldlight p-1.5 rounded-md hover:bg-gold/10"
                title="Edit"
              >
                ✎
              </button>
              <button
                onClick={() => removeCustomRequest(req.id)}
                className="text-bone/40 hover:text-skip p-1.5 rounded-md hover:bg-skip/10"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={handleAdd}
        disabled={atMax}
        className="mt-1 w-full rounded-xl border border-dashed border-bone/20 hover:border-gold/40 hover:bg-gold/5 text-bone/40 hover:text-goldlight text-sm py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-bone/20 disabled:hover:bg-transparent disabled:hover:text-bone/40"
      >
        {atMax
          ? `${MAX_REQUESTS}/${MAX_REQUESTS} max — remove one to add another`
          : `+ Add a request (${customRequests.length}/${MAX_REQUESTS})`}
      </button>
    </div>
  );
}
