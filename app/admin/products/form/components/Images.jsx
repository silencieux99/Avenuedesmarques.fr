export default function Images({
  data,
  setFeatureImage,
  featureImage,
  imageList,
  setImageList,
  handleData,
}) {

  const handleDeleteExisting = (indexToRemove) => {
    if (!handleData || !data?.imageList) return;
    const updatedList = [...data.imageList];
    updatedList.splice(indexToRemove, 1);
    handleData('imageList', updatedList);
  };

  return (
    <section className="flex flex-col gap-3 bg-white border p-4 rounded-xl">
      <h1 className="font-semibold">Images</h1>

      {/* Feature Image */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs">Image Principale (Feature) <span className="text-red-500">*</span></label>

        {featureImage ? (
          <div className="relative w-fit group">
            <img className="h-32 object-cover rounded-lg border" src={URL.createObjectURL(featureImage)} alt="" />
            <button
              type="button"
              onClick={() => setFeatureImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        ) : data?.featureImageURL ? (
          <div className="relative w-fit group">
            <img className="h-32 object-cover rounded-lg border" src={data?.featureImageURL} alt="" />
            {/* NOTE: We can't strictly 'delete' feature image URL without uploading a new one or setting it to empty, but user can replace it. */}
          </div>
        ) : null}

        <input
          type="file"
          accept="image/*"
          id="product-feature-image"
          onChange={(e) => {
            if (e.target.files.length > 0) setFeatureImage(e.target.files[0]);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none text-sm mt-2"
        />
      </div>

      {/* Gallery Images */}
      <div className="flex flex-col gap-1 mt-4">
        <label className="text-gray-500 text-xs">Galerie d'images</label>

        <div className="flex flex-wrap gap-3 mb-2">
          {/* Existing Images */}
          {data?.imageList?.map((item, index) => (
            <div key={`existing-${index}`} className="relative group">
              <img className="w-24 h-24 object-cover rounded-lg border" src={item} alt="" />
              <button
                type="button"
                onClick={() => handleDeleteExisting(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Supprimer cette image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ))}

          {/* New Pending Images */}
          {imageList?.map((item, index) => (
            <div key={`new-${index}`} className="relative group">
              <img className="w-24 h-24 object-cover rounded-lg border opacity-80" src={URL.createObjectURL(item)} alt="" />
              <button
                type="button"
                onClick={() => {
                  const newList = [...imageList];
                  newList.splice(index, 1);
                  setImageList(newList);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                title="Annuler cet ajout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const newFiles = Array.from(e.target.files);
            setImageList(prev => [...prev, ...newFiles]);
          }}
          className="border px-4 py-2 rounded-lg w-full outline-none text-sm"
        />
        <p className="text-xs text-gray-400">Ajoutez des images ici. Elles s'ajouteront à la liste existante.</p>
      </div>
    </section>
  );
}
