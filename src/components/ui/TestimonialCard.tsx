import { useState } from "react";
import ScrollReveal from "../layout/ScrollReveal";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import { utils_icons } from "../../feeders/feeder";

interface TestimonialCardProps {
  photo: string;
  name: string;
  role: string;
  company: string;
  linkedinUrl?: string;
  quote: string;
}

export default function TestimonialCard({
  photo,
  name,
  role,
  company,
  linkedinUrl,
  quote,
}: TestimonialCardProps) {
  const [imgError, setImgError] = useState(false);

  // Derive initials for avatar fallback if photo is missing or fails to load
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  // Optimize profile image for the circular avatar (60x60, using 120px for retina crispness)
  const optimizedPhoto = getOptimizedImageUrl(photo, 120);

  return (
    <ScrollReveal delay={0.15}>
      <div className="w-full min-h-[240px] sm:min-h-[280px] md:min-h-[300px] rounded-[24px] bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none p-6 sm:p-8 md:p-10 transition-colors duration-300 flex flex-col justify-center">
        <div className="flex flex-col md:flex-row gap-6 md:gap-0 items-stretch h-full">
          {/* Left Column: Profile Info */}
          <div className="w-full md:w-[250px] shrink-0 flex flex-col items-center text-center justify-center py-2 md:pr-7 border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.08] pb-6 md:pb-0">
            {/* Circular Profile Photo Container with ambient glow & border */}
            <div className="relative group">
              {/* Outer ambient soft glow behind the avatar */}
              <div className="absolute -inset-1.5 rounded-full bg-black/[0.01] dark:bg-black/[0.01] blur-md transition-all duration-300 group-hover:scale-105" />
              
              {/* Profile Photo frame */}
              <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                {!imgError && photo ? (
                  <img
                    src={optimizedPhoto}
                    alt={name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-sm font-sans font-bold text-neutral-800 dark:text-neutral-200 tracking-wider">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <h3 
              className="text-[15px] font-sans font-bold text-neutral-950 dark:text-neutral-50 tracking-tight mt-4 leading-tight"
            >
              {name}
            </h3>

            {/* Role & Title */}
            <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 font-sans font-normal mt-2 leading-tight">
              {role}
            </p>

            {/* Company Name */}
            <p className="text-[12px] text-neutral-700 dark:text-neutral-300 font-sans font-bold mt-1.5 leading-tight">
              {company}
            </p>

            {/* LinkedIn Button */}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 w-[42px] h-[42px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors duration-200"
                aria-label={`${name}'s LinkedIn Profile`}
              >
                <img 
                  src={utils_icons?.linkedIn || "/assets/icons/linkedIn_icon.svg"} 
                  alt="LinkedIn" 
                  className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100 transition-opacity duration-200 object-contain"
                  referrerPolicy="no-referrer"
                />
              </a>
            )}
          </div>

          {/* Right Column with Responsive Spacing */}
          <div className="flex-1 flex flex-col items-start text-left pt-5 mt-5 md:pt-0 md:mt-0 md:pl-8 lg:pl-10 justify-center">
            {/* Testimonial Quote text */}
            <p className="text-[16px] text-left text-neutral-700 dark:text-neutral-300 leading-[1.75] font-sans font-normal antialiased max-w-[680px]">
              {quote}
            </p>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
