import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BriefsPromptFactory } from '../../domain/services/briefs-prompt.factory';
import { BriefsParser } from '../../domain/services/briefs-parser.service';
import { BriefsEmbeddingService } from '../../domain/services/briefs-embedding.service';
import { BriefGenerationOptions } from '../../domain/value-objects/brief-generation-options';
import { OpenAiProvider } from '../../infrastructure/ai/openai.provider';
import { SupabaseBriefsRepository } from '../../infrastructure/persistence/supabase-briefs.repository';
import { BriefsFileWriter } from '../../infrastructure/storage/briefs-file-writer.service';
import { BriefsPresenter } from '../../presentation/briefs.presenter';
import { GenerateBriefsDto } from '../dto/generate-briefs.dto';

@Injectable()
export class GenerateBriefsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly promptFactory: BriefsPromptFactory,
    private readonly parser: BriefsParser,
    private readonly embeddingService: BriefsEmbeddingService,
    private readonly openAiProvider: OpenAiProvider,
    private readonly briefsRepository: SupabaseBriefsRepository,
    private readonly fileWriter: BriefsFileWriter,
  ) {}

  async execute(dto: GenerateBriefsDto) {
    const options: BriefGenerationOptions = {
      level: dto.level,
      domain: dto.domain,
      techFocus: dto.tech_focus,
      stack: dto.stack,
      duration: dto.duration,
      count: dto.count,
      targetModel: this.configService.get<string>('openai.model'),
    };

    const { systemPrompt, userPrompt } = this.promptFactory.createPrompts(options);
    const openAiResponse = await this.openAiProvider.generate(systemPrompt, userPrompt);
    const briefs = this.parser.parse(openAiResponse);

    const persistedBriefs = await Promise.all(
      briefs.map(async (brief) => {
        const embedding = await this.embeddingService.generateEmbedding(brief);
        return this.briefsRepository.insertBriefWithStories(brief, embedding);
      }),
    );

    const filePath = await this.fileWriter.write(openAiResponse);

    return BriefsPresenter.toResponse(persistedBriefs, filePath);
  }
}
