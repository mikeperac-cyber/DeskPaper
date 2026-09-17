export type NoteColor = "yellow" | "green" | "blue" | "pink" | "purple" | "dark";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown or raw text
  color: NoteColor;
  mode: "markdown" | "checklist";
  checklist: ChecklistItem[];
  tags: string[];
  pinned: boolean;        // Floating on desktop
  isCasted: boolean;      // Active on E-Paper
  createdAt: number;
  updatedAt: number;
  lastCastedAt?: number;
  position?: { x: number; y: number };
  folderPath?: string;
  folderSyncEnabled?: boolean;
}

export type DisplayModel = "4.2" | "2.9" | "2.13";
export type DisplayOrientation = "landscape" | "portrait";

export interface DisplayPreset {
  id: DisplayModel;
  name: string;
  width: number;
  height: number;
  description: string;
}

export const DISPLAY_PRESETS: Record<DisplayModel, { name: string; width: number; height: number; description: string }> = {
  "4.2": {
    name: "4.2-inch E-Paper (400x300)",
    width: 400,
    height: 300,
    description: "Classic 4:3 post-it note ratio (Waveshare 4.2inch)",
  },
  "2.9": {
    name: "2.9-inch E-Paper (296x128)",
    width: 296,
    height: 128,
    description: "Compact desk badge / stick (Waveshare 2.9inch)",
  },
  "2.13": {
    name: "2.13-inch E-Paper (250x122)",
    width: 250,
    height: 122,
    description: "Mini keychain / desk tag (Waveshare 2.13inch)",
  },
};

export interface HardwareSettings {
  selectedModel: DisplayModel;
  orientation: DisplayOrientation;
  baudRate: number;
  invertColors: boolean;
  autoSync: boolean;
  ditherMode: "threshold" | "floyd-steinberg";
  showSyncTimestamp: boolean;
  showTitleHeader: boolean;
}
