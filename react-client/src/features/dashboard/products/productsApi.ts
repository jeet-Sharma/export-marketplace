import { baseApi } from "@/store/baseApi";
import type {
  AdminProductsQuery,
  ApiProduct,
  PaginatedResponse,
} from "./productTypes";

/**
 * Admin product endpoints injected into the shared baseApi (frontend-rules
 * #10). GET /admin/products is a read → query. The list is the server state
 * owner; we don't copy it into a slice (#15). Cache tags let future
 * create/update/publish mutations invalidate the list (#14).
 */
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminProducts: builder.query<
      PaginatedResponse<ApiProduct>,
      AdminProductsQuery
    >({
      query: ({ page = 1, pageSize = 20, search, sort, status }) => ({
        url: "/admin/products",
        params: {
          page,
          pageSize,
          // Only send optional params when set, so we don't send empty
          // strings the backend's ValidationPipe would reject.
          ...(search ? { search } : {}),
          ...(sort ? { sort } : {}),
          ...(status ? { status } : {}),
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
  }),
});

export const { useGetAdminProductsQuery, useGetAdminProductQuery } =
  productsApi;
