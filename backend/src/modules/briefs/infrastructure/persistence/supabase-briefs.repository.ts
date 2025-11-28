import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ProjectBrief } from '../../domain/schema/brief.schema';

export interface InsertBriefResult {
  brief: Record<string, unknown>;
  userStoriesInserted: number;
}

@Injectable()
export class SupabaseBriefsRepository {
  private readonly logger = new Logger(SupabaseBriefsRepository.name);
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const projectUrl = this.configService.get<string>('supabase.projectUrl');
    const anonKey = this.configService.get<string>('supabase.anonKey');

    if (!projectUrl || !anonKey) {
      throw new InternalServerErrorException(
        'Supabase credentials are required. Set SUPABASE_PROJECT_URL and SUPABASE_ANON_KEY.',
      );
    }

    this.client = createClient(projectUrl, anonKey);
  }

  async insertBriefWithStories(brief: ProjectBrief, embedding: number[]): Promise<InsertBriefResult> {
    const briefRow = {
      level: brief.level,
      domain: brief.domain,
      tech_focus: brief.tech_focus,
      stack: brief.stack,
      duration: brief.duration,
      brief: brief.brief,
      business_problem: brief.business_problem,
      target_users: brief.target_users,
      goals: brief.goals,
      deliverables: brief.deliverables,
      assessment_criteria: brief.assessment_criteria,
      company_size: brief.company_size,
      complexity: brief.complexity,
      embedding,
    };

    const { data, error } = await this.client.from('briefs').insert(briefRow).select().single();

    if (error || !data) {
      this.logger.error(`Failed to insert brief: ${error?.message}`);
      throw new InternalServerErrorException('Failed to insert brief into Supabase.');
    }

    const briefId = data.id as string;

    const userStoryRows = brief.user_stories.map((story, index) => ({
      brief_id: briefId,
      story_order: index + 1,
      title: story.title,
      description: story.description,
      acceptance_criteria: story.acceptance_criteria,
      priority: story.priority,
      complexity: story.complexity,
    }));

    const { error: userStoriesError } = await this.client.from('brief_user_stories').insert(userStoryRows);

    if (userStoriesError) {
      this.logger.error(`Failed to insert brief user stories: ${userStoriesError.message}`);
      throw new InternalServerErrorException('Failed to insert brief user stories into Supabase.');
    }

    this.logger.debug(`Inserted brief ${briefId} with ${userStoryRows.length} user stories.`);

    return {
      brief: data as Record<string, unknown>,
      userStoriesInserted: userStoryRows.length,
    };
  }
}
