import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/configs/mongodb.config.js";
import { EmbeddingService } from "../src/modules/ai/service/embedding.service.js";
import { FAQ } from "../src/modules/faq/schema/faq.schema.js";
import { Section } from "../src/modules/faq/schema/section.schema.js";
import { User } from "../src/modules/users/schema/user.schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const embedWithRetry = async (embeddingService, text, maxRetries = 8) => {
  let attempt = 0;
  while (true) {
    try {
      return await embeddingService.embed(text);
    } catch (err) {
      attempt += 1;
      if (attempt > maxRetries) throw err;
      const delay = Math.min(5000 * attempt, 30000);
      await sleep(delay);
    }
  }
};

const getFaqFilePath = () => {
  const argPath = process.argv.find((arg) => arg.startsWith("--file="));
  if (argPath) return argPath.replace("--file=", "");
  return path.resolve(__dirname, "..", "..", "faqs.json");
};

const getAdminCredentials = () => {
  const email = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password =
    process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Missing admin credentials. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD).",
    );
  }
  return { email, password };
};

const mapCategory = (sectionTitle) => {
  if (!sectionTitle) return "general";
  const normalized = sectionTitle.toLowerCase();
  if (normalized.includes("internship")) return "internship";
  if (normalized.includes("placement")) return "placement";
  if (normalized.includes("resume")) return "resume";
  if (normalized.includes("dsa") || normalized.includes("algorithm"))
    return "dsa";
  if (normalized.includes("interview")) return "coding-interview";
  if (normalized.includes("career")) return "career";
  return "general";
};

const normalizeSectionTitle = (value) => value?.trim() || "General";

const buildEmbeddingText = (faq) => `${faq.question}\n${faq.answer}`.trim();

const ensureAdminUser = async ({ email, password }) => {
  const existing = await User.findOne({ email }).lean();
  if (existing) return existing;

  const admin = new User({
    name: "System Admin",
    email,
    password,
    role: "admin",
  });
  await admin.save();
  return admin.toObject();
};

const seedFaqs = async () => {
  const filePath = getFaqFilePath();
  const fileRaw = fs.readFileSync(filePath, "utf-8");
  const faqs = JSON.parse(fileRaw);

  if (!Array.isArray(faqs) || faqs.length === 0) {
    throw new Error("FAQ file is empty or not an array.");
  }

  const adminCredentials = getAdminCredentials();
  const admin = await ensureAdminUser(adminCredentials);
  const embeddingService = new EmbeddingService();

  const uniqueSections = [
    ...new Map(
      faqs.map((faq) => {
        const title = normalizeSectionTitle(faq.section_title);
        const order = Number.isFinite(Number(faq.section_id))
          ? Number(faq.section_id)
          : 0;
        return [title, { title, order }];
      }),
    ).values(),
  ];

  await FAQ.deleteMany({});

  for (const section of uniqueSections) {
    await Section.findOneAndUpdate(
      { title: section.title },
      { $setOnInsert: { title: section.title, order: section.order } },
      { upsert: true, new: true },
    );
  }

  const sectionDocs = await Section.find().lean();
  const sectionMap = new Map(
    sectionDocs.map((section) => [section.title, section]),
  );

  let inserted = 0;

  for (const faq of faqs) {
    const sectionTitle = normalizeSectionTitle(faq.section_title);
    const section = sectionMap.get(sectionTitle);
    if (!section) {
      throw new Error(`Missing section record for "${sectionTitle}"`);
    }

    const embedding = await embedWithRetry(
      embeddingService,
      buildEmbeddingText(faq),
    );
    await sleep(1500);

    const title = faq.question.trim();
    const answer = faq.answer.trim();

    await FAQ.create({
      title,
      answer,
      category: mapCategory(sectionTitle),
      section: section._id,
      tags: [sectionTitle],
      embedding,
      published: true,
      publishedAt: new Date(),
      createdBy: admin._id,
      approvedBy: admin._id,
      aiGenerated: false,
      editedByAdmin: true,
    });

    inserted += 1;
  }

  return { inserted, matched: 0 };
};

const run = async () => {
  try {
    await connectDB();
    const result = await seedFaqs();
    console.log("Seed complete:", result);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.disconnect();
  }
};

run();
