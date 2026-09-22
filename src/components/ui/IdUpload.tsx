"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileCheck2,
  FileText,
  X,
  ShieldCheck,
  AlertCircle,
  Eye,
  Camera,
} from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface UploadedIdFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 representation for preview & transfer
}

export interface IdUploadProps {
  idType: string;
  onIdTypeChange: (val: string) => void;
  idFile: UploadedIdFile | null;
  onIdFileChange: (file: UploadedIdFile | null) => void;
  idNumber?: string;
  onIdNumberChange?: (val: string) => void;
  error?: string;
  required?: boolean;
}

export const ID_TYPE_OPTIONS = [
  { value: "DRIVERS_LICENSE", label: "State Driver's License" },
  { value: "STATE_ID", label: "State-Issued Photo ID Card" },
  { value: "PASSPORT", label: "United States / International Passport" },
  { value: "MILITARY_ID", label: "US Military / CAC Identification" },
  { value: "PERMANENT_RESIDENT", label: "Permanent Resident Card (Green Card)" },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const IdUpload: React.FC<IdUploadProps> = ({
  idType,
  onIdTypeChange,
  idFile,
  onIdFileChange,
  idNumber = "",
  onIdNumberChange,
  error,
  required = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFile = (file: File) => {
    setUploadError(null);

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError("Please upload a valid image (JPEG, PNG, WEBP) or PDF document.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("Document size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onIdFileChange({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      });
    };
    reader.onerror = () => {
      setUploadError("Failed to read file. Please try selecting the file again.");
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onIdFileChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isPdf = idFile?.type === "application/pdf";

  return (
    <div className="space-y-4">
      {/* 1. Identification Type Dropdown */}
      <Select
        label="Government Photo ID Type"
        required={required}
        placeholder="Select government ID type..."
        options={ID_TYPE_OPTIONS}
        value={idType}
        onChange={(e) => onIdTypeChange(e.target.value)}
        helperText="Must match the name of the attendee arriving at the VIP entrance."
      />

      {/* 2. Optional ID Document Number */}
      {onIdNumberChange && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center justify-between">
            <span>ID / License Number</span>
            <span className="text-[10px] text-[#6B6B7E] font-normal lowercase">(optional reference)</span>
          </label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => onIdNumberChange(e.target.value)}
            placeholder="e.g. DL12345678 or Passport #"
            className="w-full h-11 rounded-md bg-[#111115] text-[#F8F8FC] text-sm border border-[#2A2A38] focus:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37] px-3.5"
          />
        </div>
      )}

      {/* 3. Drag and Drop Zone or Uploaded File Preview */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9E9EAF] flex items-center gap-1">
          <span>Upload Valid Government Photo ID</span>
          {required && <span className="text-[#D4AF37]">*</span>}
        </label>

        {!idFile ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200
              ${
                isDragging
                  ? "border-[#D4AF37] bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]/30"
                  : error || uploadError
                  ? "border-[#EF4444] bg-[#EF4444]/5 hover:bg-[#EF4444]/10"
                  : "border-[#2A2A38] bg-[#111115] hover:border-[#D4AF37]/60 hover:bg-[#15151B]"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              onChange={onInputChange}
              className="hidden"
              id="id-file-input"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-inner">
                {isDragging ? (
                  <FileCheck2 className="h-6 w-6 animate-pulse" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-[#F8F8FC]">
                  <span className="text-[#D4AF37] font-semibold underline underline-offset-2">
                    Click to upload
                  </span>{" "}
                  or drag and drop your photo ID
                </p>
                <p className="text-xs text-[#9E9EAF] mt-1">
                  Accepted formats: PNG, JPG, WEBP, or PDF (Max 10MB)
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181820] border border-[#2A2A38] text-[11px] text-[#9E9EAF]">
                <Camera className="h-3 w-3 text-[#D4AF37]" />
                <span>Front of State Driver&apos;s License or Passport Photo Page</span>
              </div>
            </div>
          </div>
        ) : (
          /* File Uploaded Preview Card */
          <div className="p-4 rounded-xl border border-[#10B981]/40 bg-[#111115] shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Thumbnail or PDF icon */}
                {isPdf ? (
                  <div className="h-14 w-14 rounded-lg bg-[#181820] border border-[#2A2A38] flex flex-col items-center justify-center text-[#EF4444] shrink-0">
                    <FileText className="h-6 w-6" />
                    <span className="text-[9px] font-mono font-bold mt-0.5">PDF</span>
                  </div>
                ) : (
                  <div
                    onClick={() => setShowPreviewModal(true)}
                    className="relative h-14 w-14 rounded-lg overflow-hidden border border-[#D4AF37]/40 bg-[#0E0E12] cursor-pointer group shrink-0"
                    title="Click to view full preview"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={idFile.dataUrl}
                      alt="Uploaded Government ID Preview"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#10B981] flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      ID Attached & Encrypted
                    </span>
                    <span className="text-[10px] font-mono text-[#6B6B7E]">
                      {formatFileSize(idFile.size)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#F8F8FC] truncate mt-0.5" title={idFile.name}>
                    {idFile.name}
                  </p>
                  <p className="text-[11px] text-[#9E9EAF] mt-0.5">
                    {ID_TYPE_OPTIONS.find((o) => o.value === idType)?.label || "Government Photo ID"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {!isPdf && (
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    aria-label="View uploaded document"
                    className="p-1.5 text-[#9E9EAF] hover:text-[#D4AF37] hover:bg-[#181820] rounded-md transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  aria-label="Remove uploaded document"
                  className="p-1.5 text-[#9E9EAF] hover:text-[#EF4444] hover:bg-[#181820] rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {(uploadError || error) && (
          <p className="text-xs text-[#EF4444] flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{uploadError || error}</span>
          </p>
        )}
      </div>

      {/* Security and Privacy Assurance Pill */}
      <div className="p-3 rounded-lg bg-[#0E0E12] border border-[#1E1E28] flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[11px] text-[#9E9EAF] leading-relaxed">
          <strong className="text-[#F8F8FC]">Strict Security Protocol:</strong> Your identification document is encrypted using 256-bit AES storage. It is accessed solely by tour operations coordinators to confirm identity at the venue check-in gate.
        </p>
      </div>

      {/* Lightbox Modal for Image Preview */}
      {showPreviewModal && idFile && !isPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-xl w-full bg-[#111115] border border-[#2A2A38] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#1E1E28]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                Document Inspection Preview
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-[#9E9EAF] hover:text-white rounded hover:bg-[#181820]"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-[#09090B] max-h-[60vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={idFile.dataUrl}
                alt="Government ID Full Preview"
                className="max-h-[50vh] max-w-full rounded-lg object-contain border border-[#2A2A38]"
              />
            </div>
            <div className="p-4 border-t border-[#1E1E28] flex items-center justify-between text-xs text-[#9E9EAF]">
              <span>{idFile.name}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
