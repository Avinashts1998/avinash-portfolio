export type FieldNoteType = "photo" | "text" | "design";

export type FieldNoteFilter = "all" | "photos" | "thoughts" | "design";

export interface FieldNote {
  id: string;
  type: FieldNoteType;
  title?: string;
  content: string; // Caption for photo, thought for text, description for design
  date: string;
  createdAt: number;
  imageUrl?: string;
  location?: string;
  tags?: string[];
  aspectRatio?: "auto" | "16/9" | "4/3" | "3/4" | "1/1";
}
