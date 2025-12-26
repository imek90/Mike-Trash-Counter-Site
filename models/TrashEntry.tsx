import { Schema, model, models } from "mongoose";

const TrashEntrySchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { timestamps: true }
);

export const TrashEntry =
  models.TrashEntry || model("TrashEntry", TrashEntrySchema);
