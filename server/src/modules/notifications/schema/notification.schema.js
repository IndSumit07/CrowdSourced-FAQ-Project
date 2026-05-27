import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["query_completed", "query_expired", "faq_published", "contributor_accepted", "system"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      queryId: { type: mongoose.Schema.Types.ObjectId, ref: "Query" },
      faqId: { type: mongoose.Schema.Types.ObjectId, ref: "FAQ" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => { delete ret.__v; return ret; },
    },
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
