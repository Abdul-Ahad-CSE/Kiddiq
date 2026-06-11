"use client";

import { useState, useEffect, useRef } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export default function MultiImageUpload({
  value = [],
  onChange,
}: MultiImageUploadProps) {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "kiddiq_images";
  const [error, setError] = useState<string | null>(null);

  // Fix stale closure issue using a ref updated inside a useEffect
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleSuccess = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string } })?.info;
    if (info?.secure_url) {
      onChange([...valueRef.current, info.secure_url]);
    }
    setError(null);
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
    setError(null);
  };

  return (
    <div className="space-y-4 w-full">
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-sans font-medium flex items-center gap-2">
          <span className="shrink-0 text-base">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm group"
          >
            <Image
              src={url}
              alt="Product image thumbnail"
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            {/* Delete button overlay (touch target optimized >= 44x44px) */}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 w-11 flex items-center justify-center transition-all shadow-md z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Delete image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        {/* Upload Trigger Dropzone (Only show if total images < 5) */}
        {value.length < 5 && (
          <CldUploadWidget
            uploadPreset={uploadPreset}
            onSuccess={handleSuccess}
            onError={() => setError("Image upload failed. Please try again.")}
            options={{
              maxFiles: 5 - value.length,
              resourceType: "image",
              clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            }}
          >
            {({ open }) => {
              return (
                <button
                  type="button"
                  onClick={() => open()}
                  className="w-full aspect-square border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-50/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-700 font-sans">
                      Add Image
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      ({value.length}/5)
                    </p>
                  </div>
                </button>
              );
            }}
          </CldUploadWidget>
        )}
      </div>

      {value.length === 0 && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 text-slate-400 text-xs font-sans">
          <ImageIcon className="w-5 h-5" />
          <span>At least one product image is required. Upload up to 5 images.</span>
        </div>
      )}
    </div>
  );
}
