import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminSecretGuard } from '../common/guards/admin-secret.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

const uploadInterceptor = FileFieldsInterceptor(
  [
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 20 },
    { name: 'images', maxCount: 20 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  },
);

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /** Public — used by website Properties page */
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
  ) {
    return this.propertiesService.findAll({ status, featured, search });
  }

  /** Protected — admin dashboard stats (must be before :id) */
  @Get('admin/stats')
  @UseGuards(AdminSecretGuard)
  getStats() {
    return this.propertiesService.getStats();
  }

  /** Public — used by Property Details page */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  /** Protected — create property (JSON or multipart) */
  @Post()
  @UseGuards(AdminSecretGuard)
  @UseInterceptors(uploadInterceptor)
  create(
    @Body() dto: CreatePropertyDto,
    @UploadedFiles()
    files?: {
      mainImage?: Express.Multer.File[];
      galleryImages?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    this.propertiesService.assertHasContent(dto);
    return this.propertiesService.create(dto, files);
  }

  /** Protected — update property */
  @Put(':id')
  @UseGuards(AdminSecretGuard)
  @UseInterceptors(uploadInterceptor)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @UploadedFiles()
    files?: {
      mainImage?: Express.Multer.File[];
      galleryImages?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    return this.propertiesService.update(id, dto, files);
  }

  /** Protected — delete property */
  @Delete(':id')
  @UseGuards(AdminSecretGuard)
  remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
