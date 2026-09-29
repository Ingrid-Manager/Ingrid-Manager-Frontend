// The backend never returns the AHA password or session id.
export interface Location {
  id: number;
  title: string;
  ahaurl: string | null;
  ahauser: string | null;
}
