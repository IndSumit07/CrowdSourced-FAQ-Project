import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, disconnectDB } from "../src/configs/mongodb.config.js";
import { FAQ } from "../src/modules/faq/schema/faq.schema.js";
import { Section } from "../src/modules/faq/schema/section.schema.js";
import { cacheDelPattern } from "../src/utils/cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  try {
    await connectDB();
    const faqsPath = path.resolve(__dirname, "../../faqs.json");
    const raw = fs.readFileSync(faqsPath, "utf-8");
    const faqs = JSON.parse(raw);

    // Sync sections
    const uniqueSections = [
      ...new Map(
        faqs.map((f) => [f.section_id, { title: f.section_title.trim(), order: Number(f.section_id) }])
      ).values(),
    ];

    for (const s of uniqueSections) {
      await Section.findOneAndUpdate(
        { title: s.title },
        { $set: { title: s.title, order: s.order } },
        { upsert: true, new: true }
      );
    }

    const sections = await Section.find().lean();
    const sectionMap = new Map(sections.map((s) => [s.title, s._id]));

    let updated = 0;
    for (const faq of faqs) {
      const title = faq.question.trim();
      const sectionTitle = faq.section_title.trim();
      const sectionId = sectionMap.get(sectionTitle);

      const tags = [
        sectionTitle,
        `section:${sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        `section-id:${faq.section_id}`,
        `qid:${faq.question_id}`,
      ];

      const res = await FAQ.updateOne(
        { title },
        {
          $set: {
            tags,
            published: true,
            ...(sectionId && { section: sectionId }),
          },
        }
      );

      if (res.modifiedCount > 0) updated += 1;
    }

    await cacheDelPattern("faqs:*");
    console.log(`Sync complete: ${updated} FAQs updated with section tags and references.`);
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    await disconnectDB();
  }
};

run();
