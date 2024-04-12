import { useIsFirstVisit } from "@/hooks/useIsFirstVisit";
import type { SVGProps } from "react";

// icon source: https://icon-sets.iconify.design/line-md/briefcase/
export function AnimatedBriefIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="none" stroke="white" strokeLinecap="round" strokeWidth={2}>
        <path
          strokeDasharray={16}
          strokeDashoffset={16}
          d="M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7"
          opacity={0}
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="1.05s"
            dur="0.3s"
            values="16;0"
          />
          <set attributeName="opacity" begin="1.05s" to={1} />
        </path>
        <path
          strokeDasharray={64}
          strokeDashoffset={64}
          d="M9 7H20C20.5523 7 21 7.44772 21 8V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V8C3 7.44772 3.44772 7 4 7z"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.9s"
            values="64;0"
          />
        </path>
      </g>
    </svg>
  );
}

export function StaticBriefIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g fill="none" stroke="white" strokeLinecap="round" strokeWidth={2}>
        <path d="M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7" />
        <path d="M9 7H20C20.5523 7 21 7.44772 21 8V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V8C3 7.44772 3.44772 7 4 7z" />
      </g>
    </svg>
  );
}

export function BriefIcon(props: SVGProps<SVGSVGElement>) {
  const isFirstVisit = useIsFirstVisit("brief");

  return isFirstVisit ? (
    <AnimatedBriefIcon {...props} />
  ) : (
    <StaticBriefIcon {...props} />
  );
}
