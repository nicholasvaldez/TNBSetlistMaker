import { useState, useEffect } from "react";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import type { CustomRequest } from "@/types/custom-request";
import type { SubmitButtonState } from "@/components/setlist-builder/header";
import { generateSetlistPdfBase64 } from "@/components/setlist-builder/setlist-pdf";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5152";

interface UseSetlistSubmitOptions {
  songs: Song[];
  ratings: Map<string, SongRating>;
  moments: Map<string, Set<string>>;
  customRequests: CustomRequest[];
  initialCode: string | undefined;
  initialSubmitState: SubmitButtonState;
  onRestoreRatings: (ratings: Map<string, SongRating>, moments: Map<string, Set<string>>) => void;
  onRestoreCustomRequests: (customRequests: CustomRequest[]) => void;
  onRestoreEventDetails: (eventName: string, eventDate: string, clientEmail: string) => void;
}

export interface SetlistSubmitState {
  setlistCode: string | undefined;
  submitState: SubmitButtonState;
  showSubmitForm: boolean;
  showConfirmation: boolean;
  submitting: boolean;
  setShowSubmitForm: (v: boolean) => void;
  setShowConfirmation: (v: boolean) => void;
  handleConfirmSubmit: (eventName: string, eventDate: string, clientEmail: string) => Promise<void>;
  handleRequestEdit: () => Promise<void>;
  handleRestoreSession: (code: string) => Promise<boolean>;
}

export function useSetlistSubmit({
  songs,
  ratings,
  moments,
  customRequests,
  initialCode,
  initialSubmitState,
  onRestoreRatings,
  onRestoreCustomRequests,
  onRestoreEventDetails,
}: UseSetlistSubmitOptions): SetlistSubmitState {
  const [setlistCode, setSetlistCode] = useState<string | undefined>(initialCode);
  const [submitState, setSubmitState] = useState<SubmitButtonState>(initialSubmitState);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handle ?editApproved= redirect from bandleader approval link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const approvedCode = params.get("editApproved");
    if (!approvedCode || approvedCode !== setlistCode) return;

    setSubmitState("editApproved");
    window.history.replaceState({}, "", "/");

    fetch(`${API_BASE}/api/setlist/${approvedCode}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          onRestoreEventDetails(data.eventName ?? "", data.eventDate ?? "", data.clientEmail ?? "");
        }
      });
  }, [setlistCode]);

  async function handleConfirmSubmit(eventName: string, eventDate: string, clientEmail: string) {
    setSubmitting(true);
    try {
      const pdfBase64 = await generateSetlistPdfBase64({
        eventName,
        eventDate: eventDate || undefined,
        songs,
        ratings,
        moments,
        customRequests,
      });

      const entries = [...ratings.entries()]
        .filter(([, r]) => r !== null)
        .map(([songId, rating]) => ({
          songId,
          rating,
          momentIds: [...(moments.get(songId) ?? [])],
        }));

      const submittableRequests = customRequests
        .filter((r) => r.title.trim() && r.artist.trim())
        .map(({ title, artist, linkUrl, momentId, note }) => ({
          title: title.trim(),
          artist: artist.trim(),
          linkUrl: linkUrl?.trim() || undefined,
          momentId: momentId || undefined,
          note: note?.trim() || undefined,
        }));

      const res = await fetch(`${API_BASE}/api/setlist/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          eventDate: eventDate || null,
          clientEmail,
          entries,
          customRequests: submittableRequests,
          pdfBase64,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      const { code } = await res.json();
      setSetlistCode(code);
      setSubmitState("submitted");
      setShowSubmitForm(false);
      setShowConfirmation(true);
    } catch {
      // TODO: surface error toast
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestEdit() {
    if (!setlistCode) return;
    await fetch(`${API_BASE}/api/setlist/${setlistCode}/request-edit`, { method: "POST" });
    setSubmitState("editRequested");
  }

  async function handleRestoreSession(code: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/setlist/${code}`);
    if (!res.ok) return false;

    const data = await res.json();

    const newRatings = new Map<string, SongRating>();
    const newMoments = new Map<string, Set<string>>();
    for (const entry of data.entries ?? []) {
      newRatings.set(entry.songId, entry.rating as SongRating);
      if (entry.momentIds?.length) newMoments.set(entry.songId, new Set(entry.momentIds));
    }

    onRestoreRatings(newRatings, newMoments);
    onRestoreCustomRequests(
      (data.customRequests ?? []).map(
        (r: { title: string; artist: string; linkUrl?: string; momentId?: string; note?: string }) => ({
          id: crypto.randomUUID(),
          title: r.title,
          artist: r.artist,
          linkUrl: r.linkUrl,
          momentId: r.momentId,
          note: r.note,
        }),
      ),
    );
    onRestoreEventDetails(data.eventName ?? "", data.eventDate ?? "", data.clientEmail ?? "");
    setSetlistCode(code);
    setSubmitState(
      data.status === "Submitted"
        ? "submitted"
        : data.status === "EditRequested"
          ? "editRequested"
          : data.status === "EditApproved"
            ? "editApproved"
            : "idle",
    );

    return true;
  }

  return {
    setlistCode,
    submitState,
    showSubmitForm,
    showConfirmation,
    submitting,
    setShowSubmitForm,
    setShowConfirmation,
    handleConfirmSubmit,
    handleRequestEdit,
    handleRestoreSession,
  };
}
