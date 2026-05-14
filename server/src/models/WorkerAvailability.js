import mongoose from 'mongoose';

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 6=Sat
    start: { type: String, required: true, default: '09:00' }, // "HH:mm"
    end: { type: String, required: true, default: '18:00' },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const blackoutSchema = new mongoose.Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, default: '', maxlength: 200 },
  },
  { _id: false }
);

const workerAvailabilitySchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    online: { type: Boolean, default: false, index: true },
    weeklySchedule: { type: [dayScheduleSchema], default: [] },
    blackouts: { type: [blackoutSchema], default: [] },
    lastSeenAt: { type: Date, default: null },
    lastLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      at: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const defaultWeeklySchedule = () =>
  [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    start: '09:00',
    end: '18:00',
    active: dayOfWeek !== 0, // closed Sunday by default
  }));

workerAvailabilitySchema.statics.ensureFor = async function ensureFor(workerId) {
  let avail = await this.findOne({ worker: workerId });
  if (!avail) {
    avail = await this.create({
      worker: workerId,
      online: false,
      weeklySchedule: defaultWeeklySchedule(),
    });
  }
  return avail;
};

workerAvailabilitySchema.methods.isOnDuty = function isOnDuty(at = new Date()) {
  const day = at.getDay();
  const entry = this.weeklySchedule.find((s) => s.dayOfWeek === day && s.active);
  if (!entry) return false;
  const [sh, sm] = entry.start.split(':').map(Number);
  const [eh, em] = entry.end.split(':').map(Number);
  const start = new Date(at);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(at);
  end.setHours(eh, em, 0, 0);
  if (at < start || at > end) return false;
  for (const b of this.blackouts || []) {
    if (at >= b.from && at <= b.to) return false;
  }
  return true;
};

const WorkerAvailability = mongoose.model('WorkerAvailability', workerAvailabilitySchema);
export default WorkerAvailability;
