import { useState } from "react";

interface SubmitFormModalProps {
  onClose: () => void;
  onConfirm: (eventName: string, eventDate: string, clientEmail: string) => void;
  isResubmit?: boolean;
  submitting?: boolean;
}

export function SubmitFormModal({ onClose, onConfirm, isResubmit = false, submitting = false }: SubmitFormModalProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [errors, setErrors] = useState<{ eventName?: string; clientEmail?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!eventName.trim()) e.eventName = "Event name is required.";
    if (!clientEmail.trim()) e.clientEmail = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) e.clientEmail = "Enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onConfirm(eventName.trim(), eventDate, clientEmail.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="paper rounded-2xl ring-gold w-full max-w-md p-8 fade-up" onClick={(ev) => ev.stopPropagation()}>
        <div className="stamp mb-1">{isResubmit ? "Submit changes" : "Almost there"}</div>
        <h2 className="font-display text-3xl text-bone mb-5">
          {isResubmit ? "Update your picks" : "Send to the band"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Event Name */}
          <div>
            <label className="block stamp mb-1" htmlFor="eventName">
              Event name <span className="text-skip">*</span>
            </label>
            <input
              id="eventName"
              type="text"
              placeholder="e.g. Abby & Austin · June 14"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {errors.eventName && <p className="text-[11px] text-skip mt-1">{errors.eventName}</p>}
          </div>

          {/* Event Date */}
          <div>
            <label className="block stamp mb-1" htmlFor="eventDate">
              Event date <span className="text-bone/40">(optional)</span>
            </label>
            <input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold scheme-dark"
            />
          </div>

          {/* Client Email */}
          <div>
            <label className="block stamp mb-1" htmlFor="clientEmail">
              Your email <span className="text-skip">*</span>
            </label>
            <input
              id="clientEmail"
              type="email"
              placeholder="you@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full rounded-md border hairline bg-ink/40 text-bone px-3 py-2 text-sm placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <p className="text-[11px] text-bone/40 mt-1">
              We'll send your reference code here so you can restore your session later.
            </p>
            {errors.clientEmail && <p className="text-[11px] text-skip mt-1">{errors.clientEmail}</p>}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border hairline text-bone/60 hover:text-bone py-2 text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 chip-gold rounded-md py-2 text-sm font-medium"
            >
              {submitting ? "Sending…" : isResubmit ? "Submit changes" : "Send to band"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
