import { Vendor } from '../../../database/entities/vendor.entity.js';

// Maps Vendor onto the shape documented in
// Phase-1-API-Specification-v0.1 section 10.1's example response.
// country.code there corresponds to the entity's iso2Code column — the
// entity keeps the more precise iso2Code name (there's also iso3Code) to
// match the Phase 1 Data Model doc; this mapper is where that translates
// into the API's `code` field, same pattern as
// product-image-response.dto.ts's s3ObjectKey -> objectKey mapping.
export class VendorCountryResponseDto {
  id!: string;
  code!: string;
  name!: string;
}

export class VendorResponseDto {
  id!: string;
  companyName!: string;
  displayName!: string | null;
  status!: string;
  country!: VendorCountryResponseDto | null;
}

export function toVendorResponseDto(vendor: Vendor): VendorResponseDto {
  return {
    id: vendor.id,
    companyName: vendor.companyName,
    displayName: vendor.displayName,
    status: vendor.status,
    country: vendor.country
      ? {
          id: vendor.country.id,
          code: vendor.country.iso2Code,
          name: vendor.country.name,
        }
      : null,
  };
}
