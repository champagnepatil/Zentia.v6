import React from "react";
import { useId } from "react";

export function FeaturesSectionWithCardGradient() {
  return (
    <div className="py-20 lg:py-40">
      <div className="max-w-4xl mx-auto mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4 whitespace-nowrap">Empowering therapists. Supporting clients.</h2>
        <p className="text-xl md:text-2xl text-neutral-600 font-normal">Secure, personalized therapy every day, between sessions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto">
        {grid.map((feature) => (
          <div
            key={feature.title}
            className="relative bg-white p-6 rounded-3xl overflow-hidden shadow-sm border border-neutral-200 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105"
          >
            <Grid size={20} hoverEffect />
            <p className="text-base font-bold text-neutral-900 relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-700 mt-4 text-base font-normal relative z-20">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const grid = [
  {
    title: "Personalized Guidance",
    description:
      "Support and resources tailored to each client's unique needs and therapy goals.",
  },
  {
    title: "Thought Wallet",
    description:
      "Easily log your thoughts and reflections. Zentia organizes them into an accessible, lifelong memory bank.",
  },
  {
    title: "Private & Secure",
    description:
      "Data is encrypted, confidential, and visible only to clients and their therapists.",
  },
  {
    title: "Therapist-Aligned Tools",
    description:
      "Every suggestion and resource is based on therapist-approved methods and input.",
  },
  {
    title: "Progress Insights",
    description:
      "Easy-to-understand mood and progress tracking for both clients and therapists.",
  },
  {
    title: "Smart Reminders",
    description:
      "Thoughtful prompts help clients stay engaged without extra effort for therapists.",
  },
  {
    title: "Centralized Notes & Resources",
    description:
      "All therapy notes, session history, and coping strategies in one organized place.",
  },
  {
    title: "Real-Time Collaboration",
    description:
      "Therapists and clients can share feedback, updates, and resources instantly between sessions.",
  },
];

export const Grid = ({
  pattern,
  size,
  hoverEffect = false,
}: {
  pattern?: number[][];
  size?: number;
  hoverEffect?: boolean;
}) => {
  const p = pattern ?? [
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
  ];
  return (
    <div className={
      `pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]` +
      (hoverEffect ? ' group' : '')
    }>
      <div className={
        `absolute inset-0 bg-gradient-to-b from-primary-100/80 to-primary-300/90 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-90 backdrop-blur-sm transition-all duration-300` +
        (hoverEffect ? ' group-hover:opacity-100 group-hover:scale-105' : '')
      } />
      <GridPattern
        width={size ?? 20}
        height={size ?? 20}
        x="-12"
        y="4"
        squares={p}
        className={
          `absolute inset-0 h-full w-full mix-blend-overlay stroke-primary-400/20 fill-primary-200/10 transition-all duration-300` +
          (hoverEffect ? ' group-hover:opacity-100 group-hover:scale-105' : '')
        }
      />
    </div>
  );
};

export function GridPattern({ width, height, x, y, squares, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: any) => (
            <rect
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
