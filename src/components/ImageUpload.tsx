"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
}: ImageUploadProps) {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "kiddiq_images";

  const handleSuccess = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string } })?.info;
    if (info?.secure_url) {
      onChange(info.secure_url);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {value ? (
        // Preview State
        <div className="relative w-full aspect-video md:aspect-[2/1] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm">
          <Image
            src={value}
            alt="Uploaded image preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 w-12 flex items-center justify-center transition-all shadow-md z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Remove Image"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        // Upload Widget Dropzone State
        <CldUploadWidget
          uploadPreset={uploadPreset}
          onSuccess={handleSuccess}
          options={{
            maxFiles: 1,
            resourceType: "image",
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
          }}
        >
          {({ open }) => {
            return (
              <button
                type="button"
                onClick={() => open()}
                className="w-full min-h-[150px] border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-50/50 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 font-sans">
                    Upload image asset
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Supports PNG, JPG, JPEG, WEBP (Max 1 file)
                  </p>
                </div>
              </button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}
