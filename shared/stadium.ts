import type { Stadium } from './types';

/**
 * Static knowledge base for the demo venue.
 *
 * Modelled loosely on a large World Cup 2026 host stadium. Distances and times
 * are representative estimates for the demo, not surveyed measurements. The
 * data is deliberately kept in one auditable place so it is easy to review,
 * localize, or swap for a real venue feed.
 */
export const STADIUM: Stadium = {
  id: 'venue-nyj',
  name: 'MetLife Stadium (demo model)',
  city: 'East Rutherford',
  country: 'USA',

  zones: [
    {
      id: 'gate-a',
      name: 'Gate A',
      kind: 'gate',
      stepFree: true,
      description: 'North-west entrance, mobile ticketing.',
    },
    {
      id: 'gate-b',
      name: 'Gate B',
      kind: 'gate',
      stepFree: true,
      description: 'North-east entrance, accessible drop-off nearby.',
    },
    {
      id: 'gate-c',
      name: 'Gate C',
      kind: 'gate',
      stepFree: true,
      description: 'South-west entrance, closest to rail.',
    },
    {
      id: 'gate-d',
      name: 'Gate D',
      kind: 'gate',
      stepFree: true,
      description: 'South-east entrance.',
    },

    {
      id: 'concourse-n',
      name: 'North Concourse',
      kind: 'concourse',
      stepFree: true,
    },
    {
      id: 'concourse-s',
      name: 'South Concourse',
      kind: 'concourse',
      stepFree: true,
    },
    {
      id: 'concourse-u',
      name: 'Upper Concourse',
      kind: 'concourse',
      stepFree: true,
      description: 'Reachable by elevator or stairs.',
    },

    {
      id: 'sec-100',
      name: 'Lower Bowl (100s)',
      kind: 'seating',
      stepFree: true,
    },
    {
      id: 'sec-200',
      name: 'Club Level (200s)',
      kind: 'seating',
      stepFree: true,
    },
    {
      id: 'sec-300',
      name: 'Upper Bowl (300s)',
      kind: 'seating',
      stepFree: false,
      description: 'Upper deck; elevator available for step-free access.',
    },

    {
      id: 'first-aid-n',
      name: 'First Aid (North)',
      kind: 'medical',
      stepFree: true,
    },
    {
      id: 'food-court',
      name: 'Halftime Food Court',
      kind: 'amenity',
      stepFree: true,
    },
    {
      id: 'info-desk',
      name: 'Guest Services',
      kind: 'amenity',
      stepFree: true,
    },
    {
      id: 'restroom-s',
      name: 'South Restrooms',
      kind: 'amenity',
      stepFree: true,
    },

    {
      id: 'transit-rail',
      name: 'Rail Station',
      kind: 'transport',
      stepFree: true,
      description: 'Meadowlands rail line.',
    },
    { id: 'transit-bus', name: 'Bus Loop', kind: 'transport', stepFree: true },
    {
      id: 'parking-lot',
      name: 'Parking Lots',
      kind: 'transport',
      stepFree: true,
    },
  ],

  // Undirected walkable edges (the graph treats them as bidirectional).
  paths: [
    { from: 'transit-rail', to: 'gate-c', minutes: 5, hasStairs: false },
    { from: 'transit-bus', to: 'gate-a', minutes: 4, hasStairs: false },
    { from: 'parking-lot', to: 'gate-d', minutes: 8, hasStairs: false },

    { from: 'gate-a', to: 'concourse-n', minutes: 2, hasStairs: false },
    { from: 'gate-b', to: 'concourse-n', minutes: 2, hasStairs: false },
    { from: 'gate-c', to: 'concourse-s', minutes: 2, hasStairs: false },
    { from: 'gate-d', to: 'concourse-s', minutes: 2, hasStairs: false },

    { from: 'concourse-n', to: 'concourse-s', minutes: 6, hasStairs: false },
    { from: 'concourse-n', to: 'first-aid-n', minutes: 1, hasStairs: false },
    { from: 'concourse-n', to: 'info-desk', minutes: 2, hasStairs: false },
    { from: 'concourse-s', to: 'restroom-s', minutes: 1, hasStairs: false },
    { from: 'concourse-s', to: 'food-court', minutes: 2, hasStairs: false },

    { from: 'concourse-n', to: 'sec-100', minutes: 2, hasStairs: false },
    { from: 'concourse-s', to: 'sec-100', minutes: 2, hasStairs: false },
    { from: 'concourse-n', to: 'sec-200', minutes: 3, hasStairs: false },

    // Upper concourse reachable by stairs (fast) or elevator (step-free).
    { from: 'concourse-n', to: 'concourse-u', minutes: 3, hasStairs: true },
    { from: 'concourse-u', to: 'concourse-n', minutes: 4, hasStairs: false },
    { from: 'concourse-u', to: 'sec-300', minutes: 2, hasStairs: false },
  ],

  amenities: [
    {
      id: 'am-restroom',
      name: 'Restrooms',
      category: 'restroom',
      zoneId: 'restroom-s',
    },
    {
      id: 'am-acc-restroom',
      name: 'Accessible Restroom',
      category: 'accessible-restroom',
      zoneId: 'restroom-s',
    },
    {
      id: 'am-food',
      name: 'Food Court',
      category: 'food',
      zoneId: 'food-court',
    },
    {
      id: 'am-water',
      name: 'Free Water Refill',
      category: 'water',
      zoneId: 'food-court',
    },
    {
      id: 'am-firstaid',
      name: 'First Aid',
      category: 'first-aid',
      zoneId: 'first-aid-n',
    },
    {
      id: 'am-info',
      name: 'Guest Services',
      category: 'info',
      zoneId: 'info-desk',
    },
    {
      id: 'am-charge',
      name: 'Phone Charging',
      category: 'charging',
      zoneId: 'info-desk',
    },
  ],

  matches: [
    {
      id: 'm1',
      home: 'Argentina',
      away: 'Brazil',
      kickoff: '2026-06-20T19:00:00-04:00',
      stage: 'Group Stage',
    },
    {
      id: 'm2',
      home: 'USA',
      away: 'Mexico',
      kickoff: '2026-06-24T20:00:00-04:00',
      stage: 'Group Stage',
    },
    {
      id: 'm3',
      home: 'France',
      away: 'Spain',
      kickoff: '2026-07-19T15:00:00-04:00',
      stage: 'Final',
    },
  ],

  transport: [
    {
      id: 't-rail',
      mode: 'rail',
      name: 'Meadowlands Rail',
      note: 'Trains run every 10-15 min on match days from Secaucus Junction. Alight at the stadium stop and follow signs to Gate C.',
      accessible: true,
    },
    {
      id: 't-bus',
      mode: 'bus',
      name: 'Coach Shuttle',
      note: 'Shuttles from Port Authority drop off at the Bus Loop next to Gate A.',
      accessible: true,
    },
    {
      id: 't-park',
      mode: 'park',
      name: 'Parking Lots',
      note: 'Pre-book parking; accessible parking is in Lot G near Gate D.',
      accessible: true,
    },
    {
      id: 't-ride',
      mode: 'rideshare',
      name: 'Rideshare Zone',
      note: 'Pickup and drop-off is at the South Lot; expect delays for 30-45 min after full-time.',
      accessible: true,
    },
  ],
};
