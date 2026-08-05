import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormSubmission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionStatusDto } from './dto/update-submission-status.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubmissionDto) {
    const formType = dto.formType;
    const fullName = dto.fullName.trim();
    const email = dto.email.trim().toLowerCase();
    const message = dto.message.trim();
    const phone = dto.phone?.trim() || null;

    if (formType === 'inquiry' && !dto.propertyType?.trim()) {
      throw new BadRequestException('propertyType is required for inquiries');
    }

    if (formType === 'contact' && !dto.subject?.trim()) {
      throw new BadRequestException('subject is required for contact forms');
    }

    const subject =
      dto.subject?.trim() ||
      (formType === 'inquiry' ? 'Property Inquiry' : 'Website Contact');

    const submission = await this.prisma.formSubmission.create({
      data: {
        formType,
        status: 'new',
        fullName,
        email,
        phone,
        subject,
        message,
        propertyType: this.cleanOptional(dto.propertyType),
        preferredLocation: this.cleanOptional(dto.location),
        estimatedBudget: this.cleanOptional(dto.budget),
        preferredTimeline: this.cleanOptional(dto.timeline),
      },
    });

    return {
      message: 'Submission received successfully',
      submission: this.toPublic(submission),
    };
  }

  async findAll(filters?: { formType?: string; status?: string }) {
    const where: {
      formType?: string;
      status?: string;
    } = {};

    if (filters?.formType && filters.formType !== 'all') {
      where.formType = filters.formType;
    }

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    const submissions = await this.prisma.formSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: submissions.length,
      submissions: submissions.map((item) => this.toPublic(item)),
    };
  }

  async updateStatus(id: string, dto: UpdateSubmissionStatusDto) {
    await this.ensureExists(id);

    const submission = await this.prisma.formSubmission.update({
      where: { id },
      data: { status: dto.status },
    });

    return {
      submission: this.toPublic(submission),
    };
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.formSubmission.delete({ where: { id } });
    return { message: 'Submission deleted successfully', id };
  }

  private async ensureExists(id: string) {
    const existing = await this.prisma.formSubmission.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Submission ${id} not found`);
    }
  }

  private cleanOptional(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private toPublic(submission: FormSubmission) {
    return {
      id: submission.id,
      form_type: submission.formType,
      status: submission.status,
      full_name: submission.fullName,
      email: submission.email,
      phone: submission.phone,
      subject: submission.subject,
      message: submission.message,
      property_type: submission.propertyType,
      preferred_location: submission.preferredLocation,
      estimated_budget: submission.estimatedBudget,
      preferred_timeline: submission.preferredTimeline,
      created_at: submission.createdAt.toISOString(),
      updated_at: submission.updatedAt.toISOString(),
    };
  }
}
