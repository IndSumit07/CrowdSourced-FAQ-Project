import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Section } from "../schema/section.schema.js";
import { logger } from "../../../utils/logger.js";

export class SectionService {
  async getAll() {
    return Section.find().sort({ order: 1, title: 1 }).lean();
  }

  async create(data) {
    const maxOrder = await Section.findOne().sort({ order: -1 }).lean();
    const section = await Section.create({
      title: data.title,
      order: (maxOrder?.order || 0) + 1,
    });
    return section;
  }

  async seedFromJson() {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const faqsPath = path.resolve(__dirname, "../../../../../faqs.json");
      if (!fs.existsSync(faqsPath)) return { seeded: 0 };

      const raw = fs.readFileSync(faqsPath, "utf-8");
      const faqs = JSON.parse(raw);

      const uniqueSections = [...new Map(
        faqs.map((f) => [f.section_id, { title: f.section_title, order: f.section_id }])
      ).values()];

      let seeded = 0;
      for (const s of uniqueSections) {
        await Section.findOneAndUpdate(
          { title: s.title },
          { $setOnInsert: { title: s.title, order: s.order } },
          { upsert: true, new: true },
        );
        seeded++;
      }

      logger.info({ msg: "Sections seeded from faqs.json", count: seeded });
      return { seeded };
    } catch (err) {
      logger.warn({ msg: "Failed to seed sections from faqs.json", err: err.message });
      return { seeded: 0 };
    }
  }
}