import { Injectable, Logger } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';
import { ProjectBrief } from '../../domain/schema/brief.schema';
import { BriefsEmbeddingService } from '../../domain/services/briefs-embedding.service';

@Injectable()
export class TransformersBriefsEmbeddingService extends BriefsEmbeddingService {
  private readonly logger = new Logger(TransformersBriefsEmbeddingService.name);
  private embeddingPipelinePromise?: Promise<(input: string) => Promise<number[]>>;

  async generateEmbedding(brief: ProjectBrief): Promise<number[]> {
    const pipelineInstance = await this.resolvePipeline();
    const output = await pipelineInstance(JSON.stringify(brief));
    return Array.from(output);
  }

  private resolvePipeline(): Promise<(input: string) => Promise<number[]>> {
    if (!this.embeddingPipelinePromise) {
      this.embeddingPipelinePromise = this.createPipeline();
    }
    return this.embeddingPipelinePromise;
  }

  private async createPipeline(): Promise<(input: string) => Promise<number[]>> {
    this.logger.debug('Loading embedding pipeline (Supabase/gte-small)...');
    const generatedPipeline = await pipeline('feature-extraction', 'Supabase/gte-small');
    return async (input: string) => {
      const output = await generatedPipeline(input, {
        pooling: 'mean',
        normalize: true,
      });

      return Array.from(output.data as Iterable<number>);
    };
  }
}
