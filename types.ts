export interface ListItem {
  text: string;
  count: number;
}

export interface SavedList {
  id: string;
  name: string;
  items: string[];
  centerImage?: string;
  theme?: string;
  updatedAt: number;
}

export interface CatalogList {
  name: string;
  items: string[];
  icon?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  emoji: string;
  lists: CatalogList[];
}

export interface Settings {
  removeAfterSpin: boolean;
  spinCenterImage: boolean;
  theme: string;
  wheelSize: number;
  isHistoryOpen: boolean;
}
