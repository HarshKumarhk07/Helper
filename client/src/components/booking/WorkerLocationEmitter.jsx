import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { socket } from '../../lib/socket.js';

export default function WorkerLocationEmitter({ workerId, activeJobs }) {
  const lastEmitTime = useRef(0);

  useEffect(() => {
    if (!workerId || !activeJobs || activeJobs.length === 0) return;

    if (!socket.connected) {
      socket.connect();
    }

    let watchId;
    let didWarnPermission = false;
    
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          // Throttle updates to 10 seconds
          if (now - lastEmitTime.current >= 10000) {
            const { latitude, longitude } = position.coords;
            
            activeJobs.forEach(job => {
              socket.emit('workerLocation', {
                workerId,
                bookingId: job._id,
                lat: latitude,
                lng: longitude
              });
            });
            lastEmitTime.current = now;
          }
        },
        (error) => {
          console.error("Error watching location:", error);
          if (!didWarnPermission && error?.code === error.PERMISSION_DENIED) {
            didWarnPermission = true;
            toast.error('Location access is required for live tracking');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      );
    } else {
      toast.error('This device does not support live location tracking');
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [workerId, activeJobs]);

  return null;
}
