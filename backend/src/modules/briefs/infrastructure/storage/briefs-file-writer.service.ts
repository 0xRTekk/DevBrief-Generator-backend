import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class BriefsFileWriter {
  private readonly logger = new Logger(BriefsFileWriter.name);

  constructor(private readonly configService: ConfigService) {}

  async write(data: unknown): Promise<string> {
    const outputDir = this.configService.get<string>('storage.outputDir');
    if (!outputDir) {
      throw new Error('Missing output directory configuration.');
    }

    await mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `briefs-${timestamp}.json`;
    const filePath = join(outputDir, filename);

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    this.logger.debug(`Briefs written to ${filePath}`);
    return filePath;
  }
}
