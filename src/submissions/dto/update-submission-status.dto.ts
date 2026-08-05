import { IsIn } from 'class-validator';

export class UpdateSubmissionStatusDto {
  @IsIn(['new', 'read', 'replied'])
  status!: 'new' | 'read' | 'replied';
}
