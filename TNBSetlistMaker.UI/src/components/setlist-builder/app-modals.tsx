import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import type { CustomRequest } from "@/types/custom-request";
import type { SubmitButtonState } from "./header";
import { Tray } from "./tray";
import { SubmitFormModal } from "./submit-form-modal";
import { SubmittedModal } from "./submitted-modal";
import { RestoreSessionInput } from "./restore-session-input";

interface AppModalsProps {
  songs: Song[];
  ratings: Map<string, SongRating>;
  moments: Map<string, Set<string>>;
  setRating: (id: string, bucket: SongRating) => void;
  toggleMoment: (songId: string, momentId: string) => void;
  totalCounts: { must: number; maybe: number; skip: number; rated: number };
  momentCounts: Record<string, number>;
  customRequests: CustomRequest[];
  addCustomRequest: () => void;
  updateCustomRequest: (id: string, patch: Partial<Omit<CustomRequest, "id">>) => void;
  removeCustomRequest: (id: string) => void;
  submitState: SubmitButtonState;
  setlistCode: string | undefined;
  submitting: boolean;
  showTray: boolean;
  showSubmitForm: boolean;
  showConfirmation: boolean;
  onCloseTray: () => void;
  onCloseSubmitForm: () => void;
  onCloseConfirmation: () => void;
  onConfirmSubmit: (eventName: string, eventDate: string, clientEmail: string) => Promise<void>;
  onRestoreSession: (code: string) => Promise<boolean>;
  restoredDetails: { eventName: string; eventDate: string; clientEmail: string };
}

export function AppModals({
  songs,
  ratings,
  moments,
  setRating,
  toggleMoment,
  totalCounts,
  momentCounts,
  customRequests,
  addCustomRequest,
  updateCustomRequest,
  removeCustomRequest,
  submitState,
  setlistCode,
  submitting,
  showTray,
  showSubmitForm,
  showConfirmation,
  onCloseTray,
  onCloseSubmitForm,
  onCloseConfirmation,
  onConfirmSubmit,
  onRestoreSession,
  restoredDetails,
}: AppModalsProps) {
  return (
    <>
      <div className="fixed bottom-16 sm:bottom-4 left-4 z-10">
        {submitState === "idle" && <RestoreSessionInput onRestore={onRestoreSession} />}
      </div>

      {showTray && (
        <Tray
          onClose={onCloseTray}
          songs={songs}
          ratings={ratings}
          setRating={setRating}
          moments={moments}
          toggleMoment={toggleMoment}
          customRequests={customRequests}
          addCustomRequest={addCustomRequest}
          updateCustomRequest={updateCustomRequest}
          removeCustomRequest={removeCustomRequest}
        />
      )}

      {showSubmitForm && (
        <SubmitFormModal
          onClose={onCloseSubmitForm}
          onConfirm={onConfirmSubmit}
          isResubmit={submitState === "editApproved"}
          submitting={submitting}
          initialValues={restoredDetails}
        />
      )}

      {showConfirmation && (
        <SubmittedModal
          onClose={onCloseConfirmation}
          counts={totalCounts}
          momentCounts={momentCounts}
          setlistCode={setlistCode}
        />
      )}
    </>
  );
}
