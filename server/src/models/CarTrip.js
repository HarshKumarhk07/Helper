import mongoose from 'mongoose';

const carTripSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true, index: true },
    returnTime: { type: Date, default: null },
    pricePerSeatOutbound: { type: Number, required: true },
    pricePerSeatReturn: { type: Number, default: 0 },
    totalSeatsOutbound: { type: Number, required: true },
    seatsAvailableOutbound: { type: Number, required: true },
    totalSeatsReturn: { type: Number, default: 0 },
    seatsAvailableReturn: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

const CarTrip = mongoose.model('CarTrip', carTripSchema);
export default CarTrip;
