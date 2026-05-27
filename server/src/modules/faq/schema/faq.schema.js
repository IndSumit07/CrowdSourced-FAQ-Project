import mongoose from "mongoose";
import { env } from "../../../configs/env.config.js";

const faqSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "FAQ title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      minlength: [20, "Answer must be at least 20 characters"],
      maxlength: [10000, "Answer cannot exceed 10000 characters"],
    },
    category: {
      type: String,
      required: true,
      enum: ["internship", "placement", "resume", "dsa", "coding-interview", "career", "general"],
      default: "general",
    },
    tags: {
      type: [String],
      default: [],
    },
    embedding: {
      type: [Number],
      required: true,
      select: false, // Exclude from normal queries to save bandwidth
    },
    views: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    sourceQuery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    aiGenerated: {
      type: Boolean,
      default: true,
    },
    editedByAdmin: {
      type: Boolean,
      default: false,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        delete ret.embedding; // Never leak embeddings in JSON responses
        return ret;
      },
    },
  }
);

// Indexes
faqSchema.index({ title: "text", answer: "text", tags: "text" }); // Full-text search
faqSchema.index({ category: 1, published: 1 });
faqSchema.index({ published: 1, createdAt: -1 });
faqSchema.index({ views: -1 });
faqSchema.index({ upvotes: -1 });

// Note: Vector search index must be created separately in MongoDB Atlas:
// Index name: "faq_vector_index"
// Field: "embedding"
// Type: knnVector
// Dimensions: 768 (or 1536 for OpenAI)
// Similarity: cosine

export const FAQ = mongoose.model("FAQ", faqSchema);
