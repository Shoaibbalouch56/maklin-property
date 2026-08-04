import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

function parseJsonField({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function toBoolean({ value }: { value: unknown }) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return value;
}

function toNumber({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

/**
 * Accepts either the full realtor JSON shape or a simplified admin form payload.
 * Multipart form fields arrive as strings and are transformed below.
 */
export class CreatePropertyDto {
  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  permalink?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  listPrice?: number;

  @IsOptional()
  @Transform(parseJsonField)
  listPriceMax?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  listPriceMin?: unknown;

  @IsOptional()
  @IsString()
  listDate?: string;

  @IsOptional()
  @Transform(parseJsonField)
  priceReducedAmount?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  applicationUrl?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  hasSpecials?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  matterport?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  searchPromotions?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  units?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  virtualTours?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  advertisers?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  branding?: unknown;

  @IsOptional()
  @Transform(parseJsonField)
  description?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  @IsArray()
  details?: unknown[];

  @IsOptional()
  @Transform(parseJsonField)
  flags?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  leadAttributes?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  location?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  otherListings?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  petPolicy?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  photos?: Array<{ href: string }>;

  @IsOptional()
  @Transform(parseJsonField)
  primaryPhoto?: { href: string };

  @IsOptional()
  @Transform(parseJsonField)
  products?: Record<string, unknown>;

  @IsOptional()
  @Transform(parseJsonField)
  source?: Record<string, unknown>;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  // --- Simplified admin form aliases (mapped in service) ---
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsString()
  bathrooms?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  area?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  yearBuilt?: number;

  @IsOptional()
  @IsString()
  descriptionText?: string;

  @IsOptional()
  @Transform(toNumber)
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Transform(toNumber)
  @Type(() => Number)
  @IsNumber()
  lon?: number;
}
