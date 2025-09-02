"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { FaCrop, FaCheck, FaTimes } from "react-icons/fa";
import Modal from "./Modal";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedArea
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg");
  });
}

export default function ImageCropper({
  open,
  onClose,
  imageUrl,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [selectedRatio, setSelectedRatio] = useState(aspectRatio);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onCropAreaChange = useCallback(
    (croppedArea: any, croppedAreaPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropConfirm = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
        onCropComplete(croppedImage);
        onClose();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Instagram aspect ratio presets
  const aspectRatios = [
    { label: "Square (1:1)", value: 1 },
    { label: "Portrait (4:5)", value: 4 / 5 },
    { label: "Landscape (1.91:1)", value: 1.91 },
  ];

  return (
    <Modal open={open} onClose={onClose} title="" size="lg">
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-6 -m-6 mb-0">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaCrop className="text-2xl" />
          Crop for Instagram
        </h2>
        <p className="text-white/90 text-sm mt-2">
          Instagram requires specific aspect ratios. Choose one below:
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Aspect Ratio Selection */}
        <div className="flex gap-2 justify-center">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => setSelectedRatio(ratio.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedRatio === ratio.value
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Cropper */}
        <div className="relative h-[400px] bg-black rounded-xl overflow-hidden">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={selectedRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={setZoom}
          />
        </div>

        {/* Zoom Control */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
          >
            <span className="flex items-center gap-2">
              <FaTimes />
              Cancel
            </span>
          </button>

          <button
            onClick={handleCropConfirm}
            className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <FaCheck />
              Apply Crop
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
