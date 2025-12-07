export type ViewState = 'dashboard' | 'ideas' | 'rules' | 'briefs' | 'packs' | 'editor';

export interface Idea {
  title: string;
  description: string;
  type: string;
  isAi?: boolean;
  isNew?: boolean;
}

export interface Pack {
  id: string;
  name: string;
  status: 'Ready for Review' | 'Drafting' | 'Published' | 'Error';
  completedItems: number;
  totalItems: number;
  lastModified: string;
}

export interface Rule {
  id: string;
  name: string;
  isActive: boolean;
}