import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { Song } from "@/types/song";
import type { SongRating } from "@/types/rating";
import type { CustomRequest } from "@/types/custom-request";
import { MOMENTS } from "@/types/moment";

const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingVertical: 36,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  headerRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4 },
  brand: { fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 1.5 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginVertical: 10 },
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 10 },
  metaLabel: { fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.8 },
  metaValue: { fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 5, marginTop: 10 },
  sectionDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  sectionCount: { fontSize: 9, color: "#888", marginLeft: 5 },
  songRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  songIndex: { width: 20, fontSize: 8, color: "#bbb", paddingTop: 1 },
  songContent: { flex: 1 },
  songTopRow: { flexDirection: "row", alignItems: "center" },
  songTitleArtist: { flex: 1 },
  songTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  songArtist: { fontSize: 8, color: "#555", marginTop: 1 },
  songMeta: { fontSize: 8, color: "#999", marginTop: 1 },
  playlistBadge: {
    backgroundColor: "#efefef",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
    marginRight: 4,
    alignSelf: "center",
  },
  playlistBadgeText: { fontSize: 7, color: "#777" },
  songMoments: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginLeft: 6, alignSelf: "center" },
  momentTag: {
    fontSize: 7,
    color: "#555",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  songDuration: { width: 32, fontSize: 8, color: "#999", textAlign: "right", paddingTop: 1 },
  requestRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  requestBody: { flex: 1 },
  requestTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  requestArtist: { fontSize: 8, color: "#555", marginTop: 1 },
  requestLink: { fontSize: 7, color: "#4a6fa5", marginTop: 2 },
  requestNote: { fontSize: 8, color: "#777", marginTop: 2, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#bbb" },
});

const BUCKET_CONFIG: Record<string, { label: string; color: string }> = {
  must: { label: "Must Play", color: "#4a7a40" },
  maybe: { label: "Maybe", color: "#b07030" },
  skip: { label: "Do not play", color: "#a04030" },
};

const momentLabel = (id: string) => MOMENTS.find((m) => m.id === id)?.label ?? id;

interface SetlistPdfDocumentProps {
  eventName: string;
  eventDate?: string;
  setlistCode?: string;
  songs: Song[];
  ratings: Map<string, SongRating>;
  moments: Map<string, Set<string>>;
  customRequests?: CustomRequest[];
}

function SetlistPdfDocument({
  eventName,
  eventDate,
  setlistCode,
  songs,
  ratings,
  moments,
  customRequests,
}: SetlistPdfDocumentProps) {
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
                    <View style={S.songContent}>
                      <View style={S.songTopRow}>
                        <View style={S.songTitleArtist}>
                          <Text style={S.songTitle}>{song.title}</Text>
                          <Text style={S.songArtist}>{song.artist}</Text>
                        </View>
                        {songMoments.length > 0 && (
                          <View style={S.songMoments}>
                            {songMoments.map((mid) => (
                              <Text key={mid} style={S.momentTag}>
                                {momentLabel(mid)}
                              </Text>
                            ))}
                          </View>
                        )}
                        {song.playlistName && (
                          <View style={S.playlistBadge}>
                            <Text style={S.playlistBadgeText}>{song.playlistName}</Text>
                          </View>
                        )}
                        {song.duration && <Text style={S.songDuration}>{song.duration}</Text>}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Song Requests */}
        {customRequests && customRequests.length > 0 && (
          <View>
            <View style={S.sectionHeader}>
              <View style={[S.sectionDot, { backgroundColor: "#4a6fa5" }]} />
              <Text style={[S.sectionTitle, { color: "#4a6fa5" }]}>Song Requests</Text>
              <Text style={S.sectionCount}>
                {customRequests.length} request{customRequests.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {customRequests.map((req, i) => (
              <View key={req.id} style={S.requestRow} wrap={false}>
                <Text style={S.songIndex}>{i + 1}</Text>
                <View style={S.requestBody}>
                  <View style={S.songTopRow}>
                    <View style={S.songTitleArtist}>
                      <Text style={S.requestTitle}>{req.title}</Text>
                      <Text style={S.requestArtist}>{req.artist}</Text>
                    </View>
                    {req.momentId && (
                      <View style={S.songMoments}>
                        <Text style={S.momentTag}>{momentLabel(req.momentId)}</Text>
                      </View>
                    )}
                  </View>
                  {req.linkUrl && <Text style={S.requestLink}>{req.linkUrl}</Text>}
                  {req.note && <Text style={S.requestNote}>"{req.note}"</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>The Nashville Band · Song Curator</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

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
