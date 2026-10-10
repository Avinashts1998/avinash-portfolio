import React from "react";

export interface Icons8ForwardArrowProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  fill?: string;
}

/**
 * Icons8 Forward Arrow icon (ID 11537)
 * URL: https://icons8.com/icon/11537/forward-arrow
 * Style: iOS Filled curved forward/share arrow
 */
export const Icons8ForwardArrow: React.FC<Icons8ForwardArrowProps> = ({
  size = 13,
  className = "",
  fill = "currentColor",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M 28 11 L 45 24.5 L 28 38 L 28 30.5 C 20.8 30.5 14.5 32.8 8.5 37.8 C 6.5 39.5 5 41.8 4 44 C 4 39.2 4.6 34.2 8.2 29.5 C 12.8 23.5 19.8 19 28 18.5 L 28 11 Z" />
    </svg>
  );
};

export default Icons8ForwardArrow;
