const features = [
  {
    title: "Warm knowledge base",
    body: "Organize answers with friendly tone templates and soft nudges.",
  },
  {
    title: "Story-first responses",
    body: "Guide helpers to share examples that feel personal and human.",
  },
  {
    title: "Calm escalation",
    body: "Turn tricky questions into collaborative moments in seconds.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="space-y-8" id="features">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
        <h2 className="font-display text-3xl font-semibold text-[#1f1a2e]">
          Built for calm, consistent support
        </h2>
        <p className="max-w-sm text-sm text-[#5d5a6a]">
          Everything you need to keep answers helpful and on-brand.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl bg-white p-6 shadow-soft"
          >
            <h3 className="text-lg font-semibold text-[#1f1a2e]">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm text-[#5d5a6a]">{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
