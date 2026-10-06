import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { aboutImagesService, AboutPhoto } from "../../services/aboutImagesService";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

export interface PolaroidCardData {
  id: string;
  caption: string;
  imageUrl?: string;
  initialRotate: number;
  initialX: number;
  initialY: number;
  initialZIndex: number;
  hoverRotate: number;
  hoverX: number;
  hoverY: number;
  hoverZIndex: number;
}

const DEFAULT_STACK_LAYOUT: Omit<PolaroidCardData, "imageUrl" | "caption">[] = [
  {
    id: "card-1",
    initialRotate: -11,
    initialX: -42,
    initialY: -16,
    initialZIndex: 1,
    hoverRotate: -16,
    hoverX: -145,
    hoverY: -18,
    hoverZIndex: 10,
  },
  {
    id: "card-2",
    initialRotate: 8,
    initialX: 38,
    initialY: 18,
    initialZIndex: 2,
    hoverRotate: 6,
    hoverX: -75,
    hoverY: 75,
    hoverZIndex: 20,
  },
  {
    id: "card-3",
    initialRotate: -1.5,
    initialX: 0,
    initialY: 0,
    initialZIndex: 5,
    hoverRotate: 0,
    hoverX: 0,
    hoverY: -40, // Stands tall at top center
    hoverZIndex: 50,
  },
  {
    id: "card-4",
    initialRotate: -6,
    initialX: -32,
    initialY: 26,
    initialZIndex: 3,
    hoverRotate: -6,
    hoverX: 75,
    hoverY: 75,
    hoverZIndex: 25,
  },
  {
    id: "card-5",
    initialRotate: 12,
    initialX: 46,
    initialY: -20,
    initialZIndex: 4,
    hoverRotate: 16,
    hoverX: 145,
    hoverY: -12,
    hoverZIndex: 15,
  },
];

export default function PolaroidPhotoStack() {
  const [isHovered, setIsHovered] = useState(false);
  const [aboutPhotos, setAboutPhotos] = useState<AboutPhoto[]>(() => aboutImagesService.getAboutPhotos());

  useEffect(() => {
    const handleUpdate = () => {
      setAboutPhotos(aboutImagesService.getAboutPhotos());
    };

    window.addEventListener("portfolio_about_images_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("portfolio_about_images_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Merge layout with dynamic photos
  const cards: PolaroidCardData[] = DEFAULT_STACK_LAYOUT.map((layout, index) => {
    const photo = aboutPhotos[index] || aboutPhotos.find((p) => p.id === layout.id) || {
      caption: index === 2 ? "Avinash • Portrait" : "",
      imageUrl: "",
    };
    const cleanCaption = (photo.caption === "Mountain Trails" ? "" : photo.caption) || "";
    return {
      ...layout,
      caption: cleanCaption,
      imageUrl: photo.imageUrl,
    };
  });

  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-0 pb-2 select-none">
      {/* Stack Container */}
      <div
        className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[500px] h-[370px] sm:h-[420px] lg:h-[440px] flex items-center justify-center cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsHovered((prev) => !prev)}
      >
        {cards.map((card, index) => {
          const isMain = index === 2 || card.id === "card-3";

          // Compute offsets with mobile responsiveness scaling
          const rotate = isHovered ? card.hoverRotate : card.initialRotate;
          const x = isHovered ? card.hoverX * 0.95 : card.initialX;
          const y = isHovered ? card.hoverY * 0.95 : card.initialY;
          const baseZIndex = isHovered ? card.hoverZIndex : card.initialZIndex;

          const sizeClasses = isMain
            ? "w-[205px] sm:w-[245px] lg:w-[275px]"
            : "w-[185px] sm:w-[220px] lg:w-[250px]";

          return (
            <motion.div
              key={card.id}
              className={`absolute ${sizeClasses} will-change-transform origin-center`}
              style={{
                zIndex: baseZIndex,
              }}
              initial={{
                rotate: card.initialRotate,
                x: card.initialX,
                y: card.initialY,
              }}
              animate={{
                rotate,
                x,
                y,
                scale: isHovered && isMain ? 1.02 : 1,
              }}
              whileHover={{
                scale: 1.06,
                zIndex: 80,
                transition: { duration: 0.18, ease: "easeOut" },
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 26,
                mass: 0.7,
              }}
            >
              {/* Polaroid Frame */}
              <div className="bg-white text-neutral-800 p-2.5 pb-7 sm:p-3 sm:pb-9 rounded-[3px] border border-neutral-200/90 relative group/card shadow-lg hover:shadow-2xl transition-shadow duration-200">
                {/* Photo Area */}
                <div className="w-full aspect-[4/5] bg-neutral-300 dark:bg-neutral-400 rounded-[1px] relative overflow-hidden flex flex-col items-center justify-center group-hover/card:bg-neutral-350 transition-colors">
                  {card.imageUrl ? (
                    <img
                      src={getOptimizedImageUrl(card.imageUrl, isMain ? 600 : 450)}
                      alt={card.caption || "About photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-neutral-500/80 space-y-1.5">
                      {isMain ? (
                        <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-500 stroke-[1.5]" />
                      ) : (
                        <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-500/80 stroke-[1.5]" />
                      )}
                      {card.caption ? (
                        <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-600/90 text-center font-medium">
                          {card.caption}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Optional Subtle caption at bottom if card has title */}
                {card.caption && card.imageUrl && (
                  <div className="absolute bottom-1.5 sm:bottom-2 left-2 right-2 text-center overflow-hidden">
                    <p className="text-[10px] sm:text-[11px] font-sans font-medium text-neutral-600 truncate">
                      {card.caption}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
