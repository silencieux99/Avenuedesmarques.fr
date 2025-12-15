"use client";

export default function SeoDetails({ data, handleData }) {
    return (
        <section className="flex flex-col gap-3 bg-white border p-4 rounded-xl">
            <h1 className="font-semibold">SEO Settings (Optional)</h1>
            <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs" htmlFor="seo-meta-title">
                    Meta Title
                </label>
                <input
                    type="text"
                    placeholder="Enter Meta Title"
                    id="seo-meta-title"
                    name="seo-meta-title"
                    value={data?.metaTitle ?? ""}
                    onChange={(e) => {
                        handleData("metaTitle", e.target.value);
                    }}
                    className="border px-4 py-2 rounded-lg w-full outline-none"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label
                    className="text-gray-500 text-xs"
                    htmlFor="seo-meta-description"
                >
                    Meta Description
                </label>
                <textarea
                    rows={4}
                    placeholder="Enter Meta Description"
                    id="seo-meta-description"
                    name="seo-meta-description"
                    value={data?.metaDescription ?? ""}
                    onChange={(e) => {
                        handleData("metaDescription", e.target.value);
                    }}
                    className="border px-4 py-2 rounded-lg w-full outline-none resize-none"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs" htmlFor="seo-keywords">
                    Keywords (Comma separated)
                </label>
                <input
                    type="text"
                    placeholder="dress, summer, women fashion..."
                    id="seo-keywords"
                    name="seo-keywords"
                    value={data?.keywords ?? ""}
                    onChange={(e) => {
                        handleData("keywords", e.target.value);
                    }}
                    className="border px-4 py-2 rounded-lg w-full outline-none"
                />
            </div>
        </section>
    );
}
