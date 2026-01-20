
export enum Language {
  FR = 'fr',
  KAB = 'kab'
}

export interface Quote {
  text: string;
  author: string;
  source?: string;
  def?: string;
}

export interface QuotesDatabase {
  [Language.FR]: Quote[];
  [Language.KAB]: Quote[];
}

export type Theme = 'light' | 'dark';
