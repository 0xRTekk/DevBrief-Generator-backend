import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BriefsController } from './presentation/briefs.controller';
import { GenerateBriefsService } from './application/services/generate-briefs.service';
import { BriefsPromptFactory } from './domain/services/briefs-prompt.factory';
import { BriefsParser } from './domain/services/briefs-parser.service';
import { BriefsEmbeddingService } from './domain/services/briefs-embedding.service';
import { BriefsFileWriter } from './infrastructure/storage/briefs-file-writer.service';
import { OpenAiProvider } from './infrastructure/ai/openai.provider';
import { SupabaseBriefsRepository } from './infrastructure/persistence/supabase-briefs.repository';
import { TransformersBriefsEmbeddingService } from './infrastructure/embeddings/transformers-briefs-embedding.service';

@Module({
  imports: [ConfigModule],
  controllers: [BriefsController],
  providers: [
    GenerateBriefsService,
    BriefsPromptFactory,
    BriefsParser,
    {
      provide: BriefsEmbeddingService,
      useClass: TransformersBriefsEmbeddingService,
    },
    BriefsFileWriter,
    OpenAiProvider,
    SupabaseBriefsRepository,
  ],
})
export class BriefsModule {}
