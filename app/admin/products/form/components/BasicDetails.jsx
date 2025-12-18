"use client";

import { useBrands } from "@/lib/firestore/brands/read";
import { useCategories } from "@/lib/firestore/categories/read";
import { useCollections } from "@/lib/firestore/collections/read";

export default function BasicDetails({ data, handleData }) {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: collections } = useCollections();

  return (
    <section className="flex-1 flex flex-col gap-3 bg-white rounded-xl p-4 border">
      <h1 className="font-semibold">Basic Details</h1>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-title">
          Product Name <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="text"
          placeholder="Enter Title"
          id="product-title"
          name="product-title"
          value={data?.title ?? ""}
          onChange={(e) => {
            handleData("title", e.target.value);
            // Auto-generate slug if not set
            if (!data?.slug) {
              handleData("slug", e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
            }
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-slug">
          Slug (URL) <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="text"
          placeholder="product-url-slug"
          id="product-slug"
          name="product-slug"
          value={data?.slug ?? ""}
          onChange={(e) => {
            handleData("slug", e.target.value);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-gray-500 text-xs"
          htmlFor="product-short-decription"
        >
          Short Description <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="text"
          placeholder="Enter Short Description"
          id="product-short-decription"
          name="product-short-decription"
          value={data?.shortDescription ?? ""}
          onChange={(e) => {
            handleData("shortDescription", e.target.value);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-brand">
          Brand <span className="text-red-500">*</span>{" "}
        </label>
        <select
          type="text"
          id="product-brand"
          name="product-brand"
          value={data?.brandId ?? ""}
          onChange={(e) => {
            handleData("brandId", e.target.value);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        >
          <option value="">Select Brand</option>
          {brands?.map((item) => {
            return (
              <option value={item?.id} key={item?.id}>
                {item?.name}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-category">
          Category <span className="text-red-500">*</span>{" "}
        </label>
        <select
          id="product-category"
          name="product-category"
          value={data?.categoryId ?? ""}
          onChange={(e) => {
            handleData("categoryId", e.target.value);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        >
          <option value="">Sélectionner une catégorie</option>
          {(() => {
            // Helper to build sorted flat tree
            if (!categories) return null;

            const roots = categories.filter(c => !c.parentId);
            const childrenMap = {};
            categories.forEach(c => {
              if (c.parentId) {
                if (!childrenMap[c.parentId]) childrenMap[c.parentId] = [];
                childrenMap[c.parentId].push(c);
              }
            });

            // Sort roots
            roots.sort((a, b) => (a.rank || 0) - (b.rank || 0));

            const options = [];
            roots.forEach(root => {
              // Add Root
              options.push(
                <option key={root.id} value={root.id} className="font-bold bg-gray-50">
                  {root.name.toUpperCase()}
                </option>
              );
              // Add Children
              if (childrenMap[root.id]) {
                childrenMap[root.id].sort((a, b) => (a.rank || 0) - (b.rank || 0)); // Sort children if needed
                childrenMap[root.id].forEach(child => {
                  options.push(
                    <option key={child.id} value={child.id}>
                      &nbsp;&nbsp;&nbsp;&nbsp;↳ {child.name}
                    </option>
                  );
                });
              }
            });
            return options;
          })()}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-collection">
          Collection (Optional)
        </label>
        <select
          type="text"
          id="product-collection"
          name="product-collection"
          value={data?.collectionId ?? ""}
          onChange={(e) => {
            handleData("collectionId", e.target.value);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
        >
          <option value="">Select Collection</option>
          {collections?.map((item) => {
            return (
              <option value={item?.id} key={item?.id}>
                {item?.title}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-stock">
          Stock <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="number"
          placeholder="Enter Stock"
          id="product-stock"
          name="product-stock"
          value={data?.stock ?? ""}
          onChange={(e) => {
            handleData("stock", e.target.valueAsNumber);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs" htmlFor="product-price">
          Price <span className="text-red-500">*</span>{" "}
        </label>
        <input
          type="number"
          placeholder="Enter Price"
          id="product-price"
          name="product-price"
          value={data?.price ?? ""}
          onChange={(e) => {
            handleData("price", e.target.valueAsNumber);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs">
          Tailles disponibles (Variantes)
        </label>
        <div className="flex flex-wrap gap-3 mt-1">
          {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => (
            <label key={size} className="flex items-center gap-2 cursor-pointer border px-3 py-1 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={data?.sizes?.includes(size) ?? false}
                onChange={(e) => {
                  const currentSizes = data?.sizes ?? [];
                  if (e.target.checked) {
                    handleData("sizes", [...currentSizes, size]);
                  } else {
                    handleData("sizes", currentSizes.filter((s) => s !== size));
                  }
                }}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">{size}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-gray-500 text-xs"
          htmlFor="product-is-featured-product"
        >
          Is Featured Product <span className="text-red-500">*</span>{" "}
        </label>
        <select
          type="number"
          placeholder="Enter Sale Price"
          id="product-is-featured-product"
          name="product-is-featured-product"
          value={data?.isFeatured ? "yes" : "no"}
          onChange={(e) => {
            handleData("isFeatured", e.target.value === "yes" ? true : false);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        >
          <option value={"no"}>No</option>
          <option value={"yes"}>Yes</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-gray-500 text-xs"
          htmlFor="product-show-in-hero"
        >
          Afficher dans le Hero <span className="text-red-500">*</span>{" "}
        </label>
        <select
          id="product-show-in-hero"
          name="product-show-in-hero"
          value={data?.showInHero ? "yes" : "no"}
          onChange={(e) => {
            handleData("showInHero", e.target.value === "yes" ? true : false);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none"
          required
        >
          <option value={"no"}>Non</option>
          <option value={"yes"}>Oui</option>
        </select>
      </div>
    </section>
  );
}
