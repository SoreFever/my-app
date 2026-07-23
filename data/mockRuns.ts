import { Run } from "@/types/run"

export const mockRuns: Run[] = [
  {
    id: '1',
    user_id: 'user_1',
    created_at: '2026-07-22T07:15:00Z',
    distance_km: 5.2,
    duration_seconds: 1620,
    title: 'Morning loop',
    photo_url: 'https://picsum.photos/seed/run1/600/300',
  },
  {
    id: '2',
    user_id: 'user_1',
    created_at: '2026-07-21T18:30:00Z',
    distance_km: 10.0,
    duration_seconds: 3300,
    title: 'Long run',
    photo_url: 'https://picsum.photos/seed/run2/600/300',
  },
  {
    id: '3',
    user_id: 'user_1',
    created_at: '2026-07-20T06:45:00Z',
    distance_km: 3.1,
    duration_seconds: 900,
    title: 'Quick shakeout',
    photo_url: 'https://picsum.photos/seed/run3/600/300',
  },
  {
    id: '4',
    user_id: 'user_1',
    created_at: '2026-07-19T07:00:00Z',
    distance_km: 8.4,
    duration_seconds: 2760,
    title: 'Trail run',
    photo_url: 'https://picsum.photos/seed/run4/600/300',
  },
  {
    id: '5',
    user_id: 'user_1',
    created_at: '2026-07-18T19:00:00Z',
    distance_km: 6.5,
    duration_seconds: 2100,
    title: 'Evening jog',
    photo_url: 'https://picsum.photos/seed/run5/600/300',
  },
]