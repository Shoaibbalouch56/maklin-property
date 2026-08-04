import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

type UploadedFiles = {
  mainImage?: Express.Multer.File[];
  galleryImages?: Express.Multer.File[];
  images?: Express.Multer.File[];
};

@Injectable()
export class PropertiesService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'properties');

  constructor(private readonly prisma: PrismaService) {
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  async findAll(query?: {
    status?: string;
    featured?: string;
    search?: string;
  }) {
    const where: Prisma.PropertyWhereInput = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.featured === 'true') {
      where.isFeatured = true;
    }

    if (query?.search) {
      const term = query.search.trim();
      where.OR = [
        { permalink: { contains: term, mode: 'insensitive' } },
        { listingId: { contains: term, mode: 'insensitive' } },
        { propertyId: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    const properties = await this.prisma.property.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      count: properties.length,
      properties: properties.map((property) => this.toPublic(property)),
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        OR: [{ id }, { listingId: id }, { propertyId: id }, { permalink: id }],
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    return this.toPublic(property);
  }

  async create(dto: CreatePropertyDto, files?: UploadedFiles) {
    const data = this.mapDtoToPrisma(dto);
    const imageUrls = this.persistUploadedFiles(files);

    if (imageUrls.length > 0) {
      data.uploadedImages = imageUrls;
      data.photos = imageUrls.map((href) => ({ href }));
      data.primaryPhoto = { href: imageUrls[0] };
    }

    if (!data.listingId) {
      data.listingId = `MK-${Date.now()}`;
    }

    if (!data.propertyId) {
      data.propertyId = randomUUID().replace(/-/g, '').slice(0, 12);
    }

    if (!data.permalink && data.location) {
      data.permalink = this.buildPermalink(data);
    }

    if (!data.listDate) {
      data.listDate = new Date();
    }

    const property = await this.prisma.property.create({ data });
    return this.toPublic(property);
  }

  async update(id: string, dto: UpdatePropertyDto, files?: UploadedFiles) {
    const existing = await this.prisma.property.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    const data = this.mapDtoToPrisma(dto, true);
    const imageUrls = this.persistUploadedFiles(files);

    if (imageUrls.length > 0) {
      const merged = [...(existing.uploadedImages ?? []), ...imageUrls];
      data.uploadedImages = merged;

      const existingPhotos = Array.isArray(existing.photos)
        ? (existing.photos as Array<{ href: string }>)
        : [];
      const newPhotos = imageUrls.map((href) => ({ href }));
      data.photos = [...existingPhotos, ...newPhotos];

      if (!existing.primaryPhoto && imageUrls[0]) {
        data.primaryPhoto = { href: imageUrls[0] };
      }
    }

    const property = await this.prisma.property.update({
      where: { id },
      data,
    });

    return this.toPublic(property);
  }

  async remove(id: string) {
    const existing = await this.prisma.property.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    for (const imagePath of existing.uploadedImages ?? []) {
      this.tryDeleteLocalFile(imagePath);
    }

    await this.prisma.property.delete({ where: { id } });
    return { message: 'Property deleted successfully', id };
  }

  async getStats() {
    const [total, featured, forRent, forSale, draft, active] =
      await Promise.all([
        this.prisma.property.count(),
        this.prisma.property.count({ where: { isFeatured: true } }),
        this.prisma.property.count({ where: { status: 'for_rent' } }),
        this.prisma.property.count({ where: { status: 'for_sale' } }),
        this.prisma.property.count({ where: { status: 'draft' } }),
        this.prisma.property.count({ where: { status: 'active' } }),
      ]);

    return { total, featured, forRent, forSale, draft, active };
  }

  /**
   * Maps realtor JSON + simplified admin form fields into Prisma create/update input.
   */
  private mapDtoToPrisma(
    dto: CreatePropertyDto | UpdatePropertyDto,
    isUpdate = false,
  ): Prisma.PropertyCreateInput {
    const description = this.buildDescription(dto);
    const location = this.buildLocation(dto);

    const data: Prisma.PropertyCreateInput = {};

    if (dto.listingId !== undefined) data.listingId = dto.listingId;
    if (dto.propertyId !== undefined) data.propertyId = dto.propertyId;
    if (dto.permalink !== undefined) data.permalink = dto.permalink;
    if (dto.status !== undefined) data.status = dto.status;
    else if (!isUpdate && dto.title) data.status = 'active';

    if (dto.listPrice !== undefined) data.listPrice = dto.listPrice;
    else if (dto.price !== undefined) data.listPrice = dto.price;

    if (dto.listPriceMax !== undefined) {
      data.listPriceMax = dto.listPriceMax as Prisma.InputJsonValue;
    }
    if (dto.listPriceMin !== undefined) {
      data.listPriceMin = dto.listPriceMin as Prisma.InputJsonValue;
    }
    if (dto.listDate !== undefined) {
      data.listDate = dto.listDate ? new Date(dto.listDate) : null;
    }
    if (dto.priceReducedAmount !== undefined) {
      data.priceReducedAmount =
        dto.priceReducedAmount as Prisma.InputJsonValue;
    }
    if (dto.applicationUrl !== undefined) {
      data.applicationUrl = dto.applicationUrl as Prisma.InputJsonValue;
    }
    if (dto.hasSpecials !== undefined) {
      data.hasSpecials = dto.hasSpecials as Prisma.InputJsonValue;
    }
    if (dto.matterport !== undefined) {
      data.matterport = dto.matterport as Prisma.InputJsonValue;
    }
    if (dto.searchPromotions !== undefined) {
      data.searchPromotions = dto.searchPromotions as Prisma.InputJsonValue;
    }
    if (dto.units !== undefined) {
      data.units = dto.units as Prisma.InputJsonValue;
    }
    if (dto.virtualTours !== undefined) {
      data.virtualTours = dto.virtualTours as Prisma.InputJsonValue;
    }
    if (dto.advertisers !== undefined) {
      data.advertisers = dto.advertisers as Prisma.InputJsonValue;
    }
    if (dto.branding !== undefined) {
      data.branding = dto.branding as Prisma.InputJsonValue;
    }
    if (description !== undefined) {
      data.description = description as Prisma.InputJsonValue;
    }
    if (dto.details !== undefined) {
      data.details = dto.details as Prisma.InputJsonValue;
    } else if (dto.descriptionText) {
      data.details = [
        {
          category: 'Overview',
          parent_category: 'Listing',
          text: [dto.descriptionText],
        },
      ];
    }
    if (dto.flags !== undefined) {
      data.flags = dto.flags as Prisma.InputJsonValue;
    }
    if (dto.leadAttributes !== undefined) {
      data.leadAttributes = dto.leadAttributes as Prisma.InputJsonValue;
    }
    if (location !== undefined) {
      data.location = location as Prisma.InputJsonValue;
    }
    if (dto.otherListings !== undefined) {
      data.otherListings = dto.otherListings as Prisma.InputJsonValue;
    }
    if (dto.petPolicy !== undefined) {
      data.petPolicy = dto.petPolicy as Prisma.InputJsonValue;
    }
    if (dto.photos !== undefined) {
      data.photos = dto.photos as Prisma.InputJsonValue;
    }
    if (dto.primaryPhoto !== undefined) {
      data.primaryPhoto = dto.primaryPhoto as Prisma.InputJsonValue;
    }
    if (dto.products !== undefined) {
      data.products = dto.products as Prisma.InputJsonValue;
    }
    if (dto.source !== undefined) {
      data.source = dto.source as Prisma.InputJsonValue;
    }
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.notes !== undefined) data.notes = dto.notes;
    else if (dto.descriptionText !== undefined) data.notes = dto.descriptionText;

    return data;
  }

  private buildDescription(
    dto: CreatePropertyDto | UpdatePropertyDto,
  ): Record<string, unknown> | undefined {
    if (dto.description && typeof dto.description === 'object') {
      const base = { ...dto.description };
      if (dto.title) base.name = dto.title;
      if (dto.bedrooms !== undefined) base.beds = dto.bedrooms;
      if (dto.bathrooms !== undefined) base.baths_consolidated = String(dto.bathrooms);
      if (dto.area !== undefined) base.sqft = dto.area;
      if (dto.propertyType) base.type = dto.propertyType;
      if (dto.yearBuilt !== undefined) base.year_built = dto.yearBuilt;
      return base;
    }

    const hasFormFields =
      dto.title ||
      dto.bedrooms !== undefined ||
      dto.bathrooms !== undefined ||
      dto.area !== undefined ||
      dto.propertyType ||
      dto.yearBuilt !== undefined;

    if (!hasFormFields) {
      return undefined;
    }

    return {
      name: dto.title ?? [],
      beds: dto.bedrooms ?? null,
      baths_consolidated: dto.bathrooms != null ? String(dto.bathrooms) : [],
      baths_max: [],
      baths_min: [],
      beds_max: [],
      beds_min: [],
      garage: [],
      garage_max: [],
      garage_min: [],
      sqft: dto.area ?? null,
      sqft_max: [],
      sqft_min: [],
      sub_type: [],
      type: dto.propertyType ?? null,
      year_built: dto.yearBuilt ?? null,
    };
  }

  private buildLocation(
    dto: CreatePropertyDto | UpdatePropertyDto,
  ): Record<string, unknown> | undefined {
    if (dto.location && typeof dto.location === 'object') {
      return dto.location;
    }

    const hasAddress =
      dto.address || dto.city || dto.state || dto.postalCode || dto.lat || dto.lon;

    if (!hasAddress) {
      return undefined;
    }

    return {
      address: {
        city: dto.city ?? null,
        coordinate:
          dto.lat != null && dto.lon != null
            ? { lat: dto.lat, lon: dto.lon }
            : null,
        country: dto.country ?? 'USA',
        line: dto.address ?? null,
        postal_code: dto.postalCode ?? null,
        state_code: dto.state ?? null,
      },
      county: null,
    };
  }

  private buildPermalink(data: Prisma.PropertyCreateInput): string {
    const location = data.location as
      | { address?: { line?: string; city?: string; state_code?: string; postal_code?: string } }
      | undefined;
    const address = location?.address;
    const parts = [
      address?.line,
      address?.city,
      address?.state_code,
      address?.postal_code,
      data.propertyId,
    ]
      .filter(Boolean)
      .map((part) =>
        String(part)
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, ''),
      );

    return parts.join('_') || `property-${Date.now()}`;
  }

  private persistUploadedFiles(files?: UploadedFiles): string[] {
    if (!files) {
      return [];
    }

    const allFiles = [
      ...(files.mainImage ?? []),
      ...(files.galleryImages ?? []),
      ...(files.images ?? []),
    ];

    const urls: string[] = [];

    for (const file of allFiles) {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${Date.now()}-${randomUUID()}${ext}`;
      const dest = path.join(this.uploadsDir, filename);
      fs.writeFileSync(dest, file.buffer);
      urls.push(`/uploads/properties/${filename}`);
    }

    return urls;
  }

  private tryDeleteLocalFile(publicPath: string) {
    if (!publicPath.startsWith('/uploads/properties/')) {
      return;
    }

    const absolute = path.join(process.cwd(), publicPath.replace(/^\//, ''));
    if (fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  }

  private toPublic(property: {
    id: string;
    listingId: string | null;
    propertyId: string | null;
    permalink: string | null;
    status: string | null;
    listPrice: number | null;
    listPriceMax: Prisma.JsonValue;
    listPriceMin: Prisma.JsonValue;
    listDate: Date | null;
    priceReducedAmount: Prisma.JsonValue;
    applicationUrl: Prisma.JsonValue;
    hasSpecials: Prisma.JsonValue;
    matterport: Prisma.JsonValue;
    searchPromotions: Prisma.JsonValue;
    units: Prisma.JsonValue;
    virtualTours: Prisma.JsonValue;
    advertisers: Prisma.JsonValue;
    branding: Prisma.JsonValue;
    description: Prisma.JsonValue;
    details: Prisma.JsonValue;
    flags: Prisma.JsonValue;
    leadAttributes: Prisma.JsonValue;
    location: Prisma.JsonValue;
    otherListings: Prisma.JsonValue;
    petPolicy: Prisma.JsonValue;
    photos: Prisma.JsonValue;
    primaryPhoto: Prisma.JsonValue;
    products: Prisma.JsonValue;
    source: Prisma.JsonValue;
    isFeatured: boolean;
    uploadedImages: string[];
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: property.id,
      listing_id: property.listingId,
      property_id: property.propertyId,
      permalink: property.permalink,
      status: property.status,
      list_price: property.listPrice,
      list_price_max: property.listPriceMax ?? [],
      list_price_min: property.listPriceMin ?? [],
      list_date: property.listDate,
      price_reduced_amount: property.priceReducedAmount ?? [],
      application_url: property.applicationUrl ?? [],
      has_specials: property.hasSpecials ?? [],
      matterport: property.matterport ?? [],
      search_promotions: property.searchPromotions ?? [],
      units: property.units ?? [],
      virtual_tours: property.virtualTours ?? [],
      advertisers: property.advertisers ?? [],
      branding: property.branding ?? [],
      description: property.description ?? {},
      details: property.details ?? [],
      flags: property.flags ?? {},
      lead_attributes: property.leadAttributes ?? {},
      location: property.location ?? {},
      other_listings: property.otherListings ?? {},
      pet_policy: property.petPolicy ?? {},
      photos: property.photos ?? [],
      primary_photo: property.primaryPhoto ?? {},
      products: property.products ?? {},
      source: property.source ?? {},
      is_featured: property.isFeatured,
      uploaded_images: property.uploadedImages,
      notes: property.notes,
      created_at: property.createdAt,
      updated_at: property.updatedAt,
    };
  }

  assertHasContent(dto: CreatePropertyDto) {
    const hasCore =
      dto.listPrice != null ||
      dto.price != null ||
      dto.title ||
      dto.location ||
      dto.description ||
      dto.listingId;

    if (!hasCore) {
      throw new BadRequestException(
        'Provide at least title/price or a realtor-shaped payload',
      );
    }
  }
}
