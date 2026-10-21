import { baseApi } from "@/store/baseApi";
import type {
  AdminProductsQuery,
  ApiProduct,
  ApiVendor,
  CreateProductInput,
  PaginatedResponse,
  ProductImageResponse,
  UpdateProductInput,
  UploadUrlResponse,
} from "./productTypes";

/**
 * Admin product endpoints injected into the shared baseApi (frontend-rules #10).
 * Server state owner is RTK Query cache with proper invalidation tags.
 */
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProducts: builder.query<
      PaginatedResponse<ApiProduct>,
      AdminProductsQuery
    >({
      query: ({
        page = 1,
        pageSize = 20,
        search,
        sort,
        status,
        categoryId,
        vendorId,
      }) => ({
        url: "/admin/products",
        params: {
          page,
          pageSize,
          // Only send optional params when set, so empty strings aren't passed
          ...(search ? { search } : {}),
          ...(sort ? { sort } : {}),
          ...(status ? { status } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(vendorId ? { vendorId } : {}),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: "Product" as const,
                id: p.id,
              })),
              { type: "ProductList" as const, id: "LIST" },
            ]
          : [{ type: "ProductList" as const, id: "LIST" }],
    }),

    getAdminProduct: builder.query<ApiProduct, string>({
      query: (id) => ({ url: `/admin/products/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),

    createAdminProduct: builder.mutation<ApiProduct, CreateProductInput>({
      query: (body) => ({
        url: "/admin/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ProductList", id: "LIST" }],
    }),

    updateAdminProduct: builder.mutation<
      ApiProduct,
      { id: string; data: UpdateProductInput }
    >({
      query: ({ id, data }) => ({
        url: `/admin/products/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "ProductList", id: "LIST" },
      ],
    }),

    publishAdminProduct: builder.mutation<ApiProduct, string>({
      query: (id) => ({
        url: `/admin/products/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "ProductList", id: "LIST" },
      ],
    }),

    unpublishAdminProduct: builder.mutation<ApiProduct, string>({
      query: (id) => ({
        url: `/admin/products/${id}/unpublish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "ProductList", id: "LIST" },
      ],
    }),

    requestImageUploadUrl: builder.mutation<
      UploadUrlResponse,
      { productId: string; filename: string; contentType: string }
    >({
      query: ({ productId, ...body }) => ({
        url: `/admin/products/${productId}/images/upload-url`,
        method: "POST",
        body,
      }),
    }),

    addProductImage: builder.mutation<
      ProductImageResponse,
      {
        productId: string;
        objectKey: string;
        sortOrder?: number;
        altText?: string;
      }
    >({
      query: ({ productId, ...body }) => ({
        url: `/admin/products/${productId}/images`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: productId },
      ],
    }),

    removeProductImage: builder.mutation<
      void,
      { productId: string; imageId: string }
    >({
      query: ({ productId, imageId }) => ({
        url: `/admin/products/${productId}/images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "Product", id: productId },
      ],
    }),

    getAdminVendors: builder.query<{ items: ApiVendor[] }, void>({
      query: () => "/admin/vendors",
      providesTags: [{ type: "Vendor", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  usePublishAdminProductMutation,
  useUnpublishAdminProductMutation,
  useRequestImageUploadUrlMutation,
  useAddProductImageMutation,
  useRemoveProductImageMutation,
  useGetAdminVendorsQuery,
} = productsApi;
