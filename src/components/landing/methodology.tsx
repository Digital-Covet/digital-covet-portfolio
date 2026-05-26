export function Methodology() {
  const steps = [
    {
      num: "01",
      title: "Discovery",
      desc: "Deep dive into brand DNA, market positioning, and user needs to form a solid foundation.",
    },
    {
      num: "02",
      title: "Architecture",
      desc: "Structuring the digital experience through precise wireframing, user flows, and strategic planning.",
    },
    {
      num: "03",
      title: "Execution",
      desc: "Bringing the vision to life with pixel-perfect design and robust, high-performance engineering.",
    },
  ];

  return (
    <section className="max-w-360 px-6 md:px-12 py-36 border-b border-border font-heading">
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
          Our Methodology
        </h2>
      </div>

      <div className="grid md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="text-center fade-up flex flex-col items-center"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-sm font-bold text-primary/10 leading-none mb-4">
              {step.num}
            </span>
            <h3 className="text-3xl font-semibold mb-4">{step.title}</h3>
            <p className="text-foreground/70 max-w-sm">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
