import Button from "../ui/Button.jsx";

const CtaSection = () => {
  return (
    <section
      className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-gradient-to-r from-[#ffe7d6] to-[#e8e3ff] p-8 shadow-soft md:flex-row md:items-center"
      id="stories"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#1f1a2e]">
          Provide the best material with passion.
        </h2>
        <p className="mt-2 max-w-md text-sm text-[#5d5a6a]">
          Create the core essence of your community through stories, signals,
          and supportive feedback loops.
        </p>
      </div>
      <Button>Load more</Button>
    </section>
  );
};

export default CtaSection;
