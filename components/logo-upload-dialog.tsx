"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Image as ImageIcon } from "lucide-react"

interface LogoUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogoUpdated: () => void
}

export function LogoUploadDialog({ open, onOpenChange, onLogoUpdated }: LogoUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append("logo", selectedFile)

      const res = await fetch("/api/logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to upload logo")
      }

      alert("✅ Logo uploaded successfully!")
      setSelectedFile(null)
      setPreview(null)
      onLogoUpdated()
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message || "Failed to upload logo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to revert to the default logo?")) {
      return
    }

    try {
      setIsUploading(true)

      const res = await fetch("/api/logo", {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete logo")
      }

      alert("✅ Reverted to default logo!")
      onLogoUpdated()
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message || "Failed to delete logo")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Custom Logo</DialogTitle>
          <DialogDescription>
            Upload your company logo (PNG, JPG, max 5MB). Square images work best.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          {preview && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <img
                src={preview}
                alt="Logo preview"
                className="max-h-32 max-w-full object-contain"
              />
            </div>
          )}

          {/* File Input */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
              ref={fileInputRef}
            />
            <label htmlFor="logo-upload" className="cursor-pointer">
              {selectedFile ? (
                <div>
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Click to upload logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isUploading}
              className="flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Revert to Default
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
