export enum LevelOption {
  Junior = 'junior',
  Intermediate = 'intermediate',
  Senior = 'senior',
}

export enum TechFocusOption {
  Frontend = 'frontend',
  Backend = 'backend',
  Fullstack = 'fullstack',
}

export interface BriefGenerationOptions {
  level: LevelOption;
  domain: string;
  techFocus: TechFocusOption;
  stack: string[];
  duration: string;
  count: number;
  targetModel?: string;
}
