import { useEffect, useState } from 'react';
import { markAdminSeen } from '../api/admin.js';

/**
 * Marks an admin console section as "seen" when the page mounts — this clears
 * that section's notification badge on the dashboard. Returns the timestamp of
 * the admin's PREVIOUS visit (a Date, or null on first ever visit) so the page
 * can highlight rows that have arrived since then.
 *
 * @param {'bookings'|'orders'|'users'|'kyc'|'support'} key
 * @returns {Date|null} previousSeen
 */
export default function useAdminSeen(key) {
  const [previousSeen, setPreviousSeen] = useState(null);

  useEffect(() => {
    let alive = true;
    markAdminSeen(key)
      .then((res) => {
        if (alive && res?.previousSeen) setPreviousSeen(new Date(res.previousSeen));
      })
      .catch(() => {
        /* badge clearing is best-effort — never block the page */
      });
    return () => {
      alive = false;
    };
  }, [key]);

  return previousSeen;
}
