import { ProjectBrief } from '../schema/brief.schema';

export abstract class BriefsEmbeddingService {
  abstract generateEmbedding(brief: ProjectBrief): Promise<number[]>;
}
