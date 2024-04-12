import { useIsFirstVisit } from "@/hooks/useIsFirstVisit";
import type { SVGProps } from "react";

// icon source: https://icon-sets.iconify.design/line-md/pencil/
function AnimatedPencilIcon(props: SVGProps<SVGSVGElement>) {
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
        strokeWidth={2}
      >
        <path
          strokeDasharray={56}
          strokeDashoffset={56}
          d="M3 21L4.99998 15L16 4C17 3 19 3 20 4C21 5 21 7 20 8L8.99998 19L3 21"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.9s"
            values="56;0"
          />
        </path>
        <g strokeDasharray={6} strokeDashoffset={6}>
          <path d="M15 5L19 9">
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.9s"
              dur="0.3s"
              values="6;0"
            />
          </path>
          <path strokeWidth={1} d="M6 15L9 18">
            <animate
              fill="freeze"
              attributeName="stroke-dashoffset"
              begin="0.9s"
              dur="0.3s"
              values="6;0"
            />
          </path>
        </g>
      </g>
    </svg>
  );
}

function StaticPencilIcon(props: SVGProps<SVGSVGElement>) {
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
        strokeWidth={2}
      >
        <path d="M3 21L4.99998 15L16 4C17 3 19 3 20 4C21 5 21 7 20 8L8.99998 19L3 21" />
        <g strokeDasharray={6} strokeDashoffset={6}>
          <path d="M15 5L19 9" strokeDashoffset={0}></path>
          <path strokeWidth={1} d="M6 15L9 18" strokeDashoffset={0}></path>
        </g>
      </g>
    </svg>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  const isFirstVisit = useIsFirstVisit("pencil");

  return isFirstVisit ? (
    <AnimatedPencilIcon {...props} />
  ) : (
    <StaticPencilIcon {...props} />
  );
}
