import React from "react";
import { Home, Layers, BookOpenText } from "lucide-react";

export interface NavIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

export const ModernHomeIcon = Home;
export const ModernProjectsIcon = Layers;
export const ModernArticlesIcon = BookOpenText;

export const NavHomeIcon = Home;
export const NavProjectsIcon = Layers;
export const NavArticlesIcon = BookOpenText;

export default {
  Home,
  Layers,
  BookOpenText,
};
