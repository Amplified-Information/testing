import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Header from "@/components/Layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Edit2, Save, Trash2, Image as ImageIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageFile {
  id: string;
  filename: string;
  url: string;
  alt_text: string | null;
  keywords: string[] | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

const ImageManagement = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    alt_text: "",
    keywords: ""
  });
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<ImageFile | null>(null);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  // Fetch existing images
  const fetchImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("image_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Lookup image by ID
  const lookupImageById = useCallback(async () => {
    if (!searchId.trim()) {
      setSearchResult(null);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("image_files")
        .select("*")
        .eq("id", searchId.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setSearchResult(null);
          toast({
            title: "Not found",
            description: "No image found with that ID",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setSearchResult(data);
        toast({
          title: "Found",
          description: "Image found successfully",
        });
      }
    } catch (error) {
      console.error("Error looking up image:", error);
      toast({
        title: "Error",
        description: "Failed to lookup image",
        variant: "destructive",
      });
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  }, [searchId, toast]);

  const clearSearch = () => {
    setSearchId("");
    setSearchResult(null);
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle file upload
  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        // Check if file is an image
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        // Save metadata to database
        const { error: dbError } = await supabase
          .from("image_files")
          .insert({
            filename: file.name,
            url: urlData.publicUrl,
            alt_text: "",
            keywords: [],
            uploaded_by: null // Will be set to user ID when auth is implemented
          });

        if (dbError) throw dbError;

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      }

      // Refresh images list
      await fetchImages();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image(s)",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [toast, fetchImages]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadFiles,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
    },
    multiple: true,
    disabled: uploading
  });

  // Start editing an image
  const startEditing = (image: ImageFile) => {
    setEditingId(image.id);
    setEditForm({
      alt_text: image.alt_text || "",
      keywords: image.keywords?.join(", ") || ""
    });
  };

  // Save edited image
  const saveEdit = async (id: string) => {
    try {
      const keywordsArray = editForm.keywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const { error } = await supabase
        .from("image_files")
        .update({
          alt_text: editForm.alt_text,
          keywords: keywordsArray,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      setEditingId(null);
      setEditForm({ alt_text: "", keywords: "" });
      await fetchImages();

      toast({
        title: "Success",
        description: "Image updated successfully",
      });
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Update failed",
        description: "Failed to update image",
        variant: "destructive",
      });
    }
  };

  // Delete image
  const deleteImage = async (image: ImageFile) => {
    if (!confirm(`Are you sure you want to delete ${image.filename}?`)) return;

    try {
      // Extract file path from URL
      const url = new URL(image.url);
      const filePath = url.pathname.split("/storage/v1/object/public/images/")[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("image_files")
        .delete()
        .eq("id", image.id);

      if (dbError) throw dbError;

      await fetchImages();

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Image Management</h1>
            <p className="text-muted-foreground text-lg">
              Upload and manage images with keywords for easy searching
            </p>
          </div>

          {/* Image ID Lookup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Lookup by Image ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter image ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupImageById()}
                  className="flex-1"
                />
                <Button 
                  onClick={lookupImageById} 
                  disabled={searching || !searchId.trim()}
                >
                  {searching ? "Searching..." : "Search"}
                </Button>
                {(searchId || searchResult) && (
                  <Button 
                    variant="outline" 
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Search Result */}
              {searchResult && (
                <Card className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 aspect-square overflow-hidden">
                      <img
                        src={searchResult.url}
                        alt={searchResult.alt_text || searchResult.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="flex-1 p-4 space-y-3">
                      <div>
                        <h3 className="font-medium text-lg">{searchResult.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {searchResult.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(searchResult.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Alt Text:</span>{" "}
                          {searchResult.alt_text || "No description"}
                        </p>
                      </div>

                      {searchResult.keywords && searchResult.keywords.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {searchResult.keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(searchResult)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteImage(searchResult)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                  uploading && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} />
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg">Drop the images here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">
                      Drag & drop images here, or click to select files
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports PNG, JPG, JPEG, GIF, WebP, and SVG files
                    </p>
                  </div>
                )}
                {uploading && (
                  <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt_text || image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-medium truncate" title={image.filename}>
                      {image.filename}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate" title={image.id}>
                      ID: {image.id}
                    </p>
                  </div>

                  {editingId === image.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`alt-${image.id}`}>Alt Text</Label>
                        <Input
                          id={`alt-${image.id}`}
                          value={editForm.alt_text}
                          onChange={(e) => 
                            setEditForm(prev => ({ ...prev, alt_text: e.target.value }))
                          }
                          placeholder="Describe this image..."
                        />
                      </div>
                      <div>
                        <Label htmlFor={`keywords-${image.id}`}>Keywords</Label>
                        <Textarea
                          id={`keywords-${image.id}`}
                          value={editForm.keywords}
                          onChange={(e) => 
                            setEditForm(prev => ({ ...prev, keywords: e.target.value }))
                          }
                          placeholder="keyword1, keyword2, keyword3..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(image.id)}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Alt:</span>{" "}
                          {image.alt_text || "No description"}
                        </p>
                      </div>
                      
                      {image.keywords && image.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {image.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(image)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteImage(image)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {images.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No images uploaded yet. Drag and drop some images to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageManagement;