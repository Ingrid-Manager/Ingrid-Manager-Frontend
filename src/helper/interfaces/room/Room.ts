import type { Location } from '@/helper/interfaces/location/location';

export interface Room {
  id: number;
  title: string;
  avm_id: string;
  comfort_temp: number;
  empty_temp: number;
  prelim_time: number;
  heated: boolean;
  color: string;
  hidden: boolean;
  location: Location;
}
