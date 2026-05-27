import mongoose from "mongoose";
import { env } from "../../../configs/env.config.js";

const querySchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [10, "Question must be at least 10 characters"],
      maxlength: [1000, "Question cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      enum: ["internship", "placement", "resume", "dsa", "coding-interview", "career", "general"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["pending", "open", "in-progress", "processing", "completed", "rejected", "expired"],
      default: "pending",
    },
    deadline: {
      type: Date,
      required: true,
    },
    embedding: {
      type: [Number],
      select: false,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aiValidated: {
      type: Boolean,
      default: false,
    },
    aiRelevanceScore: {
      type: Number,
      default: 0,
    },
    aiRejectionReason: {
      type: String,
      default: null,
    },
    acceptedContributors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    responseCount: {
      type: Number,
      default: 0,
    },
    deadlineJobId: {
      type: String,
      default: null,
    },
    processingStartedAt: {
      type: Date,
    },
    faqGenerated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FAQ",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => { delete ret.__v; delete ret.embedding; return ret; },
    },
  }
);

querySchema.index({ status: 1, deadline: 1 });
querySchema.index({ creator: 1, createdAt: -1 });
querySchema.index({ category: 1, status: 1 });
querySchema.index({ createdAt: -1 });

export const Query = mongoose.model("Query", querySchema);

// ─── Contributor Response Schema ──────────────────────────────────────────────

const contributorResponseSchema = new mongoose.Schema(
  {
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query",
      required: true,
    },
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answer: {
      type: String,
      trim: true,
      minlength: [10, "Answer must be at least 10 characters"],
      maxlength: [5000, "Answer cannot exceed 5000 characters"],
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    skipped: {
      type: Boolean,
      default: false,
    },
    accepted: {
      type: Boolean,
      default: false,
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

contributorResponseSchema.index({ query: 1, contributor: 1 }, { unique: true });
contributorResponseSchema.index({ query: 1, skipped: 1 });

export const ContributorResponse = mongoose.model("ContributorResponse", contributorResponseSchema);
