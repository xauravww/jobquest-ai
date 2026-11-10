import React from "react";

type SectionHeadingProps = {
  heading: string;
  intro?: string;
  side?: boolean;
  id?: string;
};

// Consistent section scaffold: the h2 first, optional intro, one or two columns.
const SectionHeading = ({ heading, intro, side, id }: SectionHeadingProps) => {
  if (side) {
    return (
      <div id={id} className="grid md:grid-cols-[1fr_1.4fr] gap-6 mb-10 items-end">
        <h2 className="font-display font-medium text-4xl md:text-5xl tracking-[-0.03em] leading-[1.02]">
          {heading}
        </h2>
        {intro && (
          <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-xl">
            {intro}
          </p>
        )}
      </div>
    );
  }

  return (
    <div id={id} className="max-w-[720px] mb-14">
      <h2 className="font-display font-medium text-4xl md:text-5xl tracking-[-0.03em] leading-[1.02] mb-4">
        {heading}
      </h2>
      {intro && (
        <p className="text-[var(--text-muted)] text-lg">{intro}</p>
      )}
    </div>
  );
};

export default SectionHeading;
