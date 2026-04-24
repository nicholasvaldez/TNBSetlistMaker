export interface CustomRequest {
  id: string; // client-generated UUID (crypto.randomUUID())
  title: string;
  artist: string;
  linkUrl?: string;
  momentId?: string;
  note?: string;
}
