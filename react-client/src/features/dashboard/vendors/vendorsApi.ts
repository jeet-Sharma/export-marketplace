import { baseApi } from "@/store/baseApi";

/**
 * Mirrors VendorResponseDto on the backend (GET /admin/vendors, section
 * 10.1) — only the fields that endpoint actually serializes.
 */
export type ApiVendor = {
  id: string;
  companyName: string;
  displayName: string | null;
  status: "ACTIVE" | "INACTIVE";
  country: { id: string; code: string; name: string } | null;
};

/**
 * Admin vendor endpoints injected into the shared baseApi (frontend-rules
 * #10), same pattern as productsApi.ts. Used to populate the "Select
 * verified supplier" dropdown on the Add product modal — vendorId is a
 * required field on CreateProductDto, so this is a real, necessary lookup,
 * not decorative.
 */
export const vendorsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminVendors: builder.query<{ items: ApiVendor[] }, void>({
      query: () => ({ url: "/admin/vendors" }),
      providesTags: [{ type: "Vendor" as const, id: "LIST" }],
    }),
  }),
});

export const { useGetAdminVendorsQuery } = vendorsApi;
