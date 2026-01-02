import { Schema, model, models } from "mongoose";

export type TrashAction =
  | "BIN_OUT"
  | "NEW_BAG"
  | "TRASH_TO_CURB"
  | "TRASH_FROM_CURB"
  | "RECYCLE_TO_CURB"
  | "RECYCLE_FROM_CURB";

const TrashEntrySchema = new Schema(
  {
    date: {
      type: String, // YYYY-MM-DD (IMPORTANT)
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: [
        "BIN_OUT",
        "NEW_BAG",
        "TRASH_TO_CURB",
        "TRASH_FROM_CURB",
        "RECYCLE_TO_CURB",
        "RECYCLE_FROM_CURB",
      ],
      required: true,
    },

    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const TrashEntry =
  models.TrashEntry || model("TrashEntry", TrashEntrySchema);
