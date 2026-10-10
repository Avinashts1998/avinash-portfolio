import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function PageWrapper({
  children,
  maxWidth = "max-w-[1150px] 2xl:max-w-[1360px] min-[1900px]:max-w-[1440px]",
  className = "",
}: PageWrapperProps) {
  return (
    <div
      className={`flex-1 w-full ${maxWidth} mx-auto pl-4 pr-4 sm:pl-6 sm:pr-6 2xl:pl-8 2xl:pr-8 pt-12 pb-24 sm:pb-24 mt-[20px] flex flex-col font-sans ${className}`}
    >
      {children}
    </div>
  );
}
