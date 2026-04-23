import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import { MOMENTS } from "@/types/moment";

// ── Styles (light mode — white paper, dark text) ──────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingVertical: 48,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  // Header
  headerRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4 },
  brand: { fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1.5 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginVertical: 16 },
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  metaLabel: { fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.8 },
  metaValue: { fontSize: 11, marginTop: 2 },
  // Section
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 16 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  sectionCount: { fontSize: 10, color: "#888", marginLeft: 6 },
  // Song row
  songRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  songIndex: { width: 24, fontSize: 9, color: "#bbb", paddingTop: 1 },
  songBody: { flex: 1 },
  songTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  songArtist: { fontSize: 9, color: "#555", marginTop: 1 },
  songMeta: { fontSize: 9, color: "#999", marginTop: 1 },
  songMoments: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 },
  momentTag: {
    fontSize: 8,
    color: "#555",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  songDuration: { width: 36, fontSize: 9, color: "#999", textAlign: "right", paddingTop: 1 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#bbb" },
});

// Bucket display config
const BUCKET_CONFIG: Record<string, { label: string; color: string }> = {
  must: { label: "Must Play", color: "#4a7a40" },
  maybe: { label: "Maybe", color: "#b07030" },
  skip: { label: "Skip", color: "#a04030" },
};

const momentLabel = (id: string) => MOMENTS.find((m) => m.id === id)?.label ?? id;

interface SetlistPdfDocumentProps {
  eventName: string;
  eventDate?: string;
  setlistCode?: string;
  songs: Song[];
  ratings: Map<string, SongRating>;
  moments: Map<string, Set<string>>;
}

function SetlistPdfDocument({ eventName, eventDate, setlistCode, songs, ratings, moments }: SetlistPdfDocumentProps) {
  const grouped: Record<string, Song[]> = { must: [], maybe: [], skip: [] };
  songs.forEach((s) => {
    const r = ratings.get(s.id);
    if (r) grouped[r].push(s);
  });

  const submittedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document title={`Setlist — ${eventName}`} author="The Nashville Band">
      <Page size="A4" style={S.page}>
        {/* Header */}
        <Text style={S.brand}>The Nashville Band · Song Curator</Text>
        <View style={S.divider} />
        <Text style={S.title}>{eventName}</Text>
        <View style={S.metaRow}>
          {eventDate && (
            <View>
              <Text style={S.metaLabel}>Event Date</Text>
              <Text style={S.metaValue}>{eventDate}</Text>
            </View>
          )}
          <View>
            <Text style={S.metaLabel}>Submitted</Text>
            <Text style={S.metaValue}>{submittedDate}</Text>
          </View>
          {setlistCode && (
            <View>
              <Text style={S.metaLabel}>Reference</Text>
              <Text style={S.metaValue}>{setlistCode}</Text>
            </View>
          )}
        </View>
        <View style={S.divider} />

        {/* Sections */}
        {(["must", "maybe", "skip"] as const).map((bucket) => {
          const cfg = BUCKET_CONFIG[bucket];
          const bucketSongs = grouped[bucket];
          if (bucketSongs.length === 0) return null;

          return (
            <View key={bucket}>
              <View style={S.sectionHeader}>
                <View style={[S.sectionDot, { backgroundColor: cfg.color }]} />
                <Text style={[S.sectionTitle, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={S.sectionCount}>{bucketSongs.length} songs</Text>
              </View>
              {bucketSongs.map((song, i) => {
                const songMoments = [...(moments.get(song.id) ?? [])];
                return (
                  <View key={song.id} style={S.songRow} wrap={false}>
                    <Text style={S.songIndex}>{i + 1}</Text>
                    <View style={S.songBody}>
                      <Text style={S.songTitle}>{song.title}</Text>
                      <Text style={S.songArtist}>{song.artist}</Text>
                      {song.playlistName && <Text style={S.songMeta}>{song.playlistName}</Text>}
                      {songMoments.length > 0 && (
                        <View style={S.songMoments}>
                          {songMoments.map((mid) => (
                            <Text key={mid} style={S.momentTag}>
                              {momentLabel(mid)}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    {song.duration && <Text style={S.songDuration}>{song.duration}</Text>}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>The Nashville Band · Song Curator</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ── Export: generate base64 PDF string ────────────────────────────────────────

export async function generateSetlistPdfBase64(props: SetlistPdfDocumentProps): Promise<string> {
  const blob = await pdf(<SetlistPdfDocument {...props} />).toBlob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:application/pdf;base64," prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
