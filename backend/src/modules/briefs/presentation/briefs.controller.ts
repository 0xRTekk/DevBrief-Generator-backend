import { Body, Controller, Post } from '@nestjs/common';
import { GenerateBriefsDto } from '../application/dto/generate-briefs.dto';
import { GenerateBriefsService } from '../application/services/generate-briefs.service';

@Controller('briefs')
export class BriefsController {
  constructor(private readonly generateBriefsService: GenerateBriefsService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateBriefsDto) {
    return this.generateBriefsService.execute(dto);
  }
}
