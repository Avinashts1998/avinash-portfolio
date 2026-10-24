import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Code2, Megaphone, Heart, Calendar, Compass, Camera, Sparkles, ArrowRight } from "lucide-react";
import { bitMoreAboutMeService, AboutMoreItem, DEFAULT_ABOUT_MORE_ITEMS } from "../../services/bitMoreAboutMeService";
import { sessionConfigService, SessionConfig } from "../../services/sessionConfigService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";
import ScrollReveal from "../layout/ScrollReveal";

export const BitMoreAboutMeSection: React.FC = () => {
  const [items, setItems] = useState<AboutMoreItem[]>(() => bitMoreAboutMeService.getItems());
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => sessionConfigService.getConfig());

  useEffect(() => {
    const unsubscribe = bitMoreAboutMeService.initListener((fetchedItems) => {
      if (fetchedItems && fetchedItems.length > 0) {
        setItems(fetchedItems);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = sessionConfigService.initListener((cfg) => {
      setSessionConfig(cfg);
    });
    return () => unsub();
  }, []);

  const totalItems = items.length;

  const getIconForType = (iconType?: string) => {
    switch (iconType) {
      case "code":
        return <Code2 size={17} className="text-white" />;
      case "speaker":
        return <Megaphone size={17} className="text-white" />;
      case "heart":
        return <Heart size={17} className="text-white" strokeWidth={2} />;
      case "calendar":
        return <Calendar size={17} className="text-white" />;
      case "camera":
        return <Camera size={17} className="text-white" />;
      case "sparkles":
        return <Sparkles size={17} className="text-white" />;
      case "compass":
      default:
        return <Compass size={17} className="text-white" />;
    }
  };

  return (
    <section className="relative z-10 pt-16 sm:pt-20" id="about-bit-more-section">
      {/* Header with Eyebrow Chip & Display Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-12">
        <ScrollReveal>
          <div className="space-y-4">
            {/* Eyebrow Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ebebeb] dark:bg-neutral-800 text-[var(--ink)] font-sans text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--blue)] shrink-0" />
              <span>The person behind the work.</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-hero font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
              A bit more <span className="text-[var(--blue)]">about me</span>
            </h2>
          </div>
        </ScrollReveal>
      </div>

      {/* Cards Layout matching 2x2 Asymmetrical Reference */}
      <ScrollReveal delay={0.15}>
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-4.5">
            {items.map((item, idx) => {
              // Asymmetrical alternation:
              // Row 1: Left wide (7 cols), Right narrow (5 cols)
              // Row 2: Left narrow (5 cols), Right wide (7 cols)
              const mod4 = idx % 4;
              const colSpanClass =
                mod4 === 0
                  ? "lg:col-span-7"
                  : mod4 === 1
                  ? "lg:col-span-5"
                  : mod4 === 2
                  ? "lg:col-span-5"
                  : "lg:col-span-7";

              // Gradient presets for top presentation areas
              const gradientPresets = [
                "from-[#2a3744] via-[#1c242c] to-[#12161a]", // Slate blue / dark vibe
                "from-[#382b26] via-[#241a15] to-[#140f0d]", // Warm bronze / stage
                "from-[#262f3a] via-[#171e26] to-[#0f141a]", // Cool indigo / craft
                "from-[#22352c] via-[#14231b] to-[#0e1712]", // Forest green / community
              ];
              const cardGradient = gradientPresets[idx % gradientPresets.length];

              const isCodeCard = item.iconType === "code";
              const imageUrl = item.imageUrl || (isCodeCard ? "https://res.cloudinary.com/p66qxgqe/image/upload/v1787048973/hyllpuch85dsg06ch5q5.png" : DEFAULT_ABOUT_MORE_ITEMS.find((d) => d.id === item.id)?.imageUrl || "");

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (idx % 2) * 0.1 }}
                  className={`about-more-card ${colSpanClass} group relative flex flex-col rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#ebebeb] dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800/80 shadow-none transition-all duration-300`}
                >
                  {/* Top Image / Media Presentation Container */}
                  {isCodeCard ? (
                    <div className={`relative w-full aspect-[16/11] sm:aspect-[16/10] overflow-hidden bg-gradient-to-b ${cardGradient} p-4 sm:p-6 md:p-8 flex items-center justify-center`}>
                      <img
                        src={getOptimizedImageUrl(imageUrl, 1400)}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain rounded-md sm:rounded-lg border border-white/10 drop-shadow-2xl transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="eager"
                        decoding="async"
                      />

                      {/* Bottom-Left Floating Dark Icon Badge */}
                      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 shadow-xl flex items-center justify-center">
                          {getIconForType(item.iconType)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-[16/11] sm:aspect-[16/10] overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(imageUrl, 1400)}
                        alt={item.title}
                        className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="eager"
                        decoding="async"
                      />

                      {/* Bottom-Left Floating Dark Icon Badge */}
                      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 shadow-xl flex items-center justify-center">
                          {getIconForType(item.iconType)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Solid Text Area Section */}
                  <div className="p-5 sm:p-6 md:p-7 bg-[#ebebeb] dark:bg-[#18181b] flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <h3 className="text-xl sm:text-2xl font-sans font-bold text-[var(--ink)] dark:text-white tracking-tight leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-[15px] text-[var(--ink-soft)] dark:text-neutral-400 font-sans leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Optional Action Button */}
                    {item.buttonText && (() => {
                      const isBookingButton =
                        item.id === "more_giving_back" ||
                        item.iconType === "heart" ||
                        /session|book|mentorship/i.test(item.buttonText) ||
                        !item.buttonUrl ||
                        item.buttonUrl.startsWith("mailto:");

                      const configuredUrl = sessionConfigService.getBookingUrl();
                      const targetUrl = isBookingButton
                        ? configuredUrl
                        : (item.buttonUrl || configuredUrl);

                      const isExternal = Boolean(
                        targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://"))
                      );

                      return (
                        <div className="pt-5 mt-auto">
                          <a
                            href={targetUrl}
                            target={sessionConfig.openInNewTab && isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                            onClick={(e) => {
                              if (isBookingButton) {
                                e.preventDefault();
                                sessionConfigService.navigateToBooking(targetUrl);
                              }
                            }}
                            className="group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white text-xs sm:text-sm font-sans font-semibold transition-all duration-200 active:scale-95 shadow-sm hover:shadow cursor-pointer"
                          >
                            <span>{item.buttonText}</span>
                            <ArrowRight size={14} className="opacity-85 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default BitMoreAboutMeSection;
