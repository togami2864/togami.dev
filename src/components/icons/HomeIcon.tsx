import { useIsFirstVisit } from "@/hooks/useIsFirstVisit";
import type { SVGProps } from "react";

// icon source: https://icon-sets.iconify.design/line-md/home/
function AnimatedHomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path strokeDasharray={15} strokeDashoffset={15} d="M4.5 21.5h15">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.3s"
            values="15;0"
          />
        </path>
        <path
          strokeDasharray={15}
          strokeDashoffset={15}
          d="M4.5 21.5V8M19.5 21.5V8"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.3s"
            dur="0.3s"
            values="15;0"
          />
        </path>
        <path
          strokeDasharray={24}
          strokeDashoffset={24}
          d="M9.5 21.5V12.5H14.5V21.5"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.6s"
            dur="0.6s"
            values="24;0"
          />
        </path>
        <path
          strokeDasharray={30}
          strokeDashoffset={30}
          strokeWidth={2}
          d="M2 10L12 2L22 10"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.75s"
            dur="0.6s"
            values="30;0"
          />
        </path>
      </g>
    </svg>
  );
}

function StaticHomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 21.5h15"></path>
        <path d="M4.5 21.5V8M19.5 21.5V8"></path>
        <path d="M9.5 21.5V12.5H14.5V21.5"></path>
        <path strokeWidth={2} d="M2 10L12 2L22 10"></path>
      </g>
    </svg>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  const isFirstVisit = useIsFirstVisit("home");

  return isFirstVisit ? (
    <AnimatedHomeIcon {...props} />
  ) : (
    <StaticHomeIcon {...props} />
  );
}
