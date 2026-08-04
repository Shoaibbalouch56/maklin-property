-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "property_id" TEXT,
    "permalink" TEXT,
    "status" TEXT,
    "list_price" DOUBLE PRECISION,
    "list_price_max" JSONB,
    "list_price_min" JSONB,
    "list_date" TIMESTAMP(3),
    "price_reduced_amount" JSONB,
    "application_url" JSONB,
    "has_specials" JSONB,
    "matterport" JSONB,
    "search_promotions" JSONB,
    "units" JSONB,
    "virtual_tours" JSONB,
    "advertisers" JSONB,
    "branding" JSONB,
    "description" JSONB,
    "details" JSONB,
    "flags" JSONB,
    "lead_attributes" JSONB,
    "location" JSONB,
    "other_listings" JSONB,
    "pet_policy" JSONB,
    "photos" JSONB,
    "primary_photo" JSONB,
    "products" JSONB,
    "source" JSONB,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_listing_id_key" ON "properties"("listing_id");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_is_featured_idx" ON "properties"("is_featured");

-- CreateIndex
CREATE INDEX "properties_list_price_idx" ON "properties"("list_price");
