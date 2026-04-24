import { useState, useEffect, useRef, useCallback } from "react";
import type { Song } from "@/types/song";

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

function generateWaveform(audioBuffer: AudioBuffer, bars: number): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerBar = Math.floor(channelData.length / bars);
  const waveform: number[] = [];

  for (let i = 0; i < bars; i++) {
    const start = i * samplesPerBar;
    const end = start + samplesPerBar;
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }

    const avg = sum / samplesPerBar;
    waveform.push(avg);
  }

  // Normalize to 0.25 - 1 range
  const max = Math.max(...waveform);
  return waveform.map((v) => 0.25 + (v / max) * 0.75);
}

function generateFallbackWaveform(songId: string, bars: number): number[] {
  let h = 0;
  for (let i = 0; i < songId.length; i++) {
    h = (h * 31 + songId.charCodeAt(i)) >>> 0;
  }
  return Array.from({ length: bars }, () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    const r = (h & 0xff) / 255;
    return 0.25 + r * 0.75;
  });
}

interface PreviewProps {
  song: Song;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  previewUrl?: string | null;
  previewLoading?: boolean;
}

export function Preview({ song, playing, setPlaying, previewUrl: externalPreviewUrl, previewLoading }: PreviewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [waveform, setWaveform] = useState<number[] | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const hasPreview = !!externalPreviewUrl;
  const bars = 48;

  const skeletonWaveform = generateFallbackWaveform("skeleton", bars);

  const analyzeAudio = useCallback(
    async (url: string) => {
      setWaveform(null); // Clear waveform to show skeleton
      setWaveformLoading(true);
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const newWaveform = generateWaveform(audioBuffer, bars);
        setWaveform(newWaveform);
      } catch (err) {
        console.error("Failed to analyze audio:", err);
        setWaveform(generateFallbackWaveform(song.id, bars));
      } finally {
        setWaveformLoading(false);
      }
    },
    [song.id],
  );

  useEffect(() => {
    if (externalPreviewUrl) {
      analyzeAudio(externalPreviewUrl);
    } else {
      setWaveform(null);
    }
  }, [externalPreviewUrl, analyzeAudio]);

  const displayWaveform = waveform ?? skeletonWaveform;
  const isWaveformReady = waveform !== null && !waveformLoading;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasPreview) return;

    if (playing) {
      audio.play().catch(() => {
        setPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [playing, hasPreview, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
    if (playing) {
      setPlaying(false);
    }
  }, [song.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 30);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setPlaying, externalPreviewUrl]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (previewLoading) {
    return (
      <div className="w-full select-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-bone/10 flex items-center justify-center shrink-0">
            <svg
              className="animate-spin h-5 w-5 text-goldlight"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-0.5 h-8 opacity-30">
              {skeletonWaveform.map((h, i) => (
                <div
                  key={i}
                  className="w-0.75 rounded-sm animate-pulse"
                  style={{
                    height: `${h * 100}%`,
                    background: "rgba(227,199,122,0.22)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-center mt-1 font-mono text-[10px] text-bone/50">
              <span className="stamp">Loading preview...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPreview) {
    return (
      <div className="w-full select-none">
        <div className="flex items-center gap-3">
          <button
            disabled
            className="h-10 w-10 rounded-full bg-bone/10 flex items-center justify-center shrink-0 cursor-not-allowed opacity-50"
            aria-label="No preview available"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-0.5 h-8 opacity-30">
              {skeletonWaveform.map((h, i) => (
                <div
                  key={i}
                  className="w-0.75 rounded-sm"
                  style={{
                    height: `${h * 100}%`,
                    background: "rgba(227,199,122,0.22)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-center mt-1 font-mono text-[10px] text-bone/50">
              <span className="stamp">No preview available for this track</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {externalPreviewUrl && <audio ref={audioRef} src={externalPreviewUrl} preload="metadata" />}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className="h-10 w-10 rounded-full chip-gold flex items-center justify-center shrink-0"
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-0.5 h-8">
            {displayWaveform.map((h, i) => {
              const barPct = (i / bars) * 100;
              const passed = barPct < pct;
              return (
                <div
                  key={i}
                  className={`w-0.75 rounded-sm transition-all duration-150 ease-out ${!isWaveformReady ? "animate-pulse" : ""}`}
                  style={{
                    height: `${h * 100}%`,
                    background: !isWaveformReady
                      ? "rgba(227,199,122,0.22)"
                      : passed
                        ? "#e3c77a"
                        : "rgba(227,199,122,0.22)",
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-1 font-mono text-[10px] text-bone/50">
            <span>{fmtTime(currentTime)}</span>
            <span className="stamp">30-sec preview</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { fmtTime };
