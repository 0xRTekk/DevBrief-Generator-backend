import { InsertBriefResult } from '../infrastructure/persistence/supabase-briefs.repository';

interface PersistedBriefSummary {
  briefId: string;
  userStoriesInserted: number;
}

export interface GenerateBriefsResponse {
  results: PersistedBriefSummary[];
  filePath: string;
}

export class BriefsPresenter {
  static toResponse(result: InsertBriefResult[], filePath: string): GenerateBriefsResponse {
    return {
      results: result.map((item) => ({
        briefId: String((item.brief as Record<string, unknown> | undefined)?.id ?? ''),
        userStoriesInserted: item.userStoriesInserted,
      })),
      filePath,
    };
  }
}
