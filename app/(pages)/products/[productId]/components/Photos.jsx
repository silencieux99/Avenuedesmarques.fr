"use client";

export default function Photos({ imageList }) {
  if (imageList?.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main vertical stack for desktop */}
      <div className="hidden md:flex flex-col gap-4 w-full">
        {imageList.map((img, index) => (
          <div key={index} className="w-full">
            <img
              src={img}
              alt={`Product image ${index + 1}`}
              className="w-full h-auto object-cover"
            />
          </div>
        ))}
      </div>

      {/* Slider/Single view for mobile (simplified for now to just stack) */}
      <div className="flex md:hidden flex-col gap-4 w-full">
        {imageList.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Product image ${index + 1}`}
            className="w-full h-auto object-cover"
          />
        ))}
      </div>
    </div>
  );
}
