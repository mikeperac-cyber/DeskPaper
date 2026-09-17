export interface DesktopAPI {
  isElectron: boolean;
  selectFolder: () => Promise<string | null>;
  openFolder: (folderPath: string) => Promise<boolean>;
  syncFolderNote: (folderPath: string, note: any) => Promise<boolean>;
  createDesktopShortcut: (note: any) => Promise<boolean>;
}

declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
  }
}
