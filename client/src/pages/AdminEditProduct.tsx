import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertProductSchema, type InsertProduct, type Product } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildProductSeoTitle, getProductSeoHint, getProductSeoQuestion } from "@/lib/product-seo";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Upload, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminEditProductProps {
  productId: number;
  onBack: () => void;
}

export default function AdminEditProduct({ productId, onBack }: AdminEditProductProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [seoDetails, setSeoDetails] = useState("");
  const [specEntries, setSpecEntries] = useState<{ key: string; value: string }[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [rawCategory, setRawCategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [rawSubcategory, setRawSubcategory] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [rawBrand, setRawBrand] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  
  const containerClasses = "space-y-6 max-w-2xl mx-auto w-full pb-24 md:pb-0";

  const handleAdditionalImagesUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const currentImages = form.getValues("additionalImages") || [];
      form.setValue("additionalImages", [...currentImages, ...data.urls]);
      toast({ title: "Images uploaded" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload images.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      metaTitle: "",
      description: "",
      metaDescription: "",
      price: 0,
      category: "",
      brand: "",
      imageUrl: "",
      stockStatus: "in_stock",
      isFeatured: false,
      additionalImages: [],
      specs: {},
      variations: { storage: [], colors: [] },
    },
  });

  const storageFields = useFieldArray({ control: form.control, name: "variations.storage" as any });
  const colorFields = useFieldArray({ control: form.control, name: "variations.colors" as any });

  useEffect(() => {
    if (product) {
      const savedKeywords = (product.searchKeywords as string[] | null) || [];
      form.reset({
        name: product.name,
        metaTitle: product.metaTitle || "",
        description: product.description,
        metaDescription: product.metaDescription,
        price: product.price,
        category: product.category,
        brand: product.brand,
        imageUrl: product.imageUrl,
        stockStatus: product.stockStatus as any,
        isFeatured: product.isFeatured || false,
        additionalImages: product.additionalImages || [],
        searchKeywords: savedKeywords,
        specs: product.specs || {},
        variations: (product.variations as any) || { storage: [], colors: [] },
      });
      setKeywords(savedKeywords);

      const knownCategories = [
        "Smartphones", "Phones Accessories", "Laptops", "Laptop Accessories",
        "Tablets", "Gaming", "Gaming Accessories", "Smartwatches",
        "Audio", "Cameras", "Camera Accessories"
      ];
      if (knownCategories.includes(product.category)) {
        setRawCategory(product.category);
      } else {
        setRawCategory("Other");
        setCustomCategory(product.category);
      }

      if (product.category === "Gaming") {
        const knownSubs = ["Gaming Consoles", "Gaming Headsets", "Gaming Mouse", "Gaming Keyboards", "Gaming Accessories", "PlayStation & Consoles"];
        if (knownSubs.includes(product.brand)) {
          setRawSubcategory(product.brand);
        } else if (product.brand) {
          setRawSubcategory("Other");
          setCustomSubcategory(product.brand);
        }
      } else {
        const allBrands = Object.values({
          "Smartphones": ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Sony", "Tecno", "Infinix"],
          "Phones Accessories": ["Apple", "Samsung", "Baseus", "Anker", "Spigen", "Belkin", "Ugreen"],
          "Laptops": ["Apple", "Dell", "HP", "Lenovo", "Asus", "Microsoft", "Acer", "Huawei"],
          "Laptop Accessories": ["Baseus", "Anker", "Belkin", "Logitech", "HP", "Dell", "Lenovo", "Apple", "Ugreen"],
          "Tablets": ["Apple", "Samsung", "Lenovo", "Microsoft", "Huawei"],
          "Gaming Accessories": ["Razer", "SteelSeries", "Logitech", "HyperX", "Corsair", "Asus", "Kingston"],
          "Smartwatches": ["Apple", "Samsung", "Garmin", "Fitbit", "Huawei", "Xiaomi"],
          "Audio": ["Sony", "Bose", "JBL", "Samsung", "Apple", "Razer", "SteelSeries", "Jabra"],
          "Cameras": ["Sony", "Canon", "Nikon", "Fujifilm", "GoPro", "DJI"],
          "Camera Accessories": ["Sony", "Canon", "Nikon", "Manfrotto", "Peak Design", "GoPro", "DJI", "Joby"],
        } as Record<string, string[]>).flat();
        if (!product.brand || allBrands.includes(product.brand)) {
          setRawBrand(product.brand || "");
        } else {
          setRawBrand("Other");
          setCustomBrand(product.brand);
        }
      }

      if (product.specs) {
        const entries = Object.entries(product.specs as Record<string, string>).map(([key, value]) => ({
          key,
          value,
        }));
        setSpecEntries(entries);
      }
    }
  }, [product, form]);

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim().toLowerCase().replace(/,/g, "");
    if (!trimmed) return;
    if (keywords.includes(trimmed)) return;
    const next = [...keywords, trimmed];
    setKeywords(next);
    form.setValue("searchKeywords" as any, next);
  };

  const removeKeyword = (kw: string) => {
    const next = keywords.filter((k) => k !== kw);
    setKeywords(next);
    form.setValue("searchKeywords" as any, next);
  };

  const addSpec = () => {
    setSpecEntries([...specEntries, { key: "", value: "" }]);
  };

  const removeSpec = (index: number) => {
    setSpecEntries(specEntries.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...specEntries];
    newSpecs[index][field] = value;
    setSpecEntries(newSpecs);
  };

  const updateMutation = useMutation({
    mutationFn: async (values: InsertProduct) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}`, values);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      toast({
        title: "Product updated successfully",
        description: "The product has been successfully updated.",
      });
      onBack();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    },
  });

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum size is 5MB",
      });
      return null;
    }

    const formData = new FormData();
    formData.append("images", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload error response:", errorText);
        throw new Error("Upload failed");
      }

      const data = await res.json();
      const imageUrl = data.url || (data.urls && data.urls[0]);
      if (imageUrl) {
        form.setValue("imageUrl", imageUrl, { shouldValidate: true });
        return imageUrl;
      }
      throw new Error("No URL returned from server");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleColorImageUpload = async (index: number, file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum size is 5MB" });
      return;
    }
    const formData = new FormData();
    formData.append("images", file);
    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const imageUrl = data.url || data.urls?.[0];
      if (!imageUrl) throw new Error("No image URL returned");
      form.setValue(`variations.colors.${index}.imageUrl` as any, imageUrl, { shouldDirty: true });
      toast({ title: "Color image uploaded", description: "This photo is now linked to the selected color." });
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Could not upload this color photo." });
    } finally {
      setIsUploading(false);
    }
  };

  const CATEGORIES = [
    "Smartphones",
    "Phones Accessories",
    "Laptops",
    "Laptop Accessories",
    "Tablets",
    "Gaming",
    "Gaming Accessories",
    "Smartwatches",
    "Audio",
    "Cameras",
    "Camera Accessories",
    "Other"
  ];

  const GAMING_SUBCATEGORIES = [
    "Gaming Consoles",
    "Gaming Headsets",
    "Gaming Mouse",
    "Gaming Keyboards",
    "Gaming Accessories",
    "PlayStation & Consoles",
    "Other"
  ];

  const BRANDS_BY_CATEGORY: Record<string, string[]> = {
    "Smartphones": ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Sony", "Tecno", "Infinix", "Other"],
    "Phones Accessories": ["Apple", "Samsung", "Baseus", "Anker", "Spigen", "Belkin", "Ugreen", "Other"],
    "Laptops": ["Apple", "Dell", "HP", "Lenovo", "Asus", "Microsoft", "Acer", "Huawei", "Other"],
    "Laptop Accessories": ["Baseus", "Anker", "Belkin", "Logitech", "HP", "Dell", "Lenovo", "Apple", "Ugreen", "Other"],
    "Tablets": ["Apple", "Samsung", "Lenovo", "Microsoft", "Huawei", "Other"],
    "Gaming": ["Razer", "SteelSeries", "Glorious", "Dell", "RIG", "Lexar", "SanDisk", "Asus", "Valve", "Microsoft", "Other"],
    "Gaming Accessories": ["Razer", "SteelSeries", "Logitech", "HyperX", "Corsair", "Asus", "Kingston", "Other"],
    "Smartwatches": ["Apple", "Samsung", "Garmin", "Fitbit", "Huawei", "Xiaomi", "Other"],
    "Audio": ["Sony", "Bose", "JBL", "Samsung", "Apple", "Razer", "SteelSeries", "Jabra", "Other"],
    "Cameras": ["Sony", "Canon", "Nikon", "Fujifilm", "GoPro", "DJI", "Other"],
    "Camera Accessories": ["Sony", "Canon", "Nikon", "Manfrotto", "Peak Design", "GoPro", "DJI", "Joby", "Other"]
  };

  const LAPTOP_OPTIONS = {
    batteryHealth: ["100%", "90%+", "80%+"],
    charger: ["Included", "Not Included"],
    color: ["Aluminum", "Black", "Carbon Fiber", "Gold", "Gray", "Matte Black"],
    condition: ["Premium", "Excellent", "Good", "Acceptable"],
    cpu: ["Apple M1 / M2 / M3", "Intel i3 / i5 / i7 / i9", "AMD Ryzen"],
    ram: ["8GB", "16GB", "32GB", "64GB"],
    screenSize: ["12\"", "13\"", "14\"", "15\"", "16\""],
    storage: ["128GB", "256GB", "512GB", "1TB", "2TB"],
    touchBar: ["Touch Bar", "No Touch Bar"]
  };

  const onSubmit = async (data: InsertProduct) => {
    const imageUrl = data.imageUrl;

    if (!imageUrl || imageUrl.startsWith("data:")) {
      toast({
        variant: "destructive",
        title: "Image required",
        description: "Please upload the product image first.",
      });
      return;
    }

    // Convert spec entries to object
    const specs: Record<string, string> = {};
    specEntries.forEach(entry => {
      if (entry.key.trim()) {
        specs[entry.key.trim()] = entry.value.trim();
      }
    });

    // Merge with laptop specs if any
    const laptopSpecs = data.specs as Record<string, string> || {};
    Object.assign(specs, laptopSpecs);

    // Update form state with final imageUrl to ensure validation passes
    form.setValue("imageUrl", imageUrl, { shouldValidate: true });

    updateMutation.mutate({ ...data, imageUrl, specs });
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover-elevate flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight break-words">Edit Product</h2>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => {
                const category = form.watch("category");
                const suggestion = buildProductSeoTitle(form.watch("name"), form.watch("brand"), category, seoDetails);
                return (
                  <FormItem>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <FormLabel>SEO title for Google</FormLabel>
                      <Button type="button" size="sm" variant="outline" disabled={!suggestion} onClick={() => field.onChange(suggestion)}>
                        Use suggested title
                      </Button>
                    </div>
                    <FormControl>
                      <Input {...field} value={field.value || ""} maxLength={120} placeholder="Suggested from product details" />
                    </FormControl>
                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                      <label htmlFor="seo-key-details" className="text-xs font-medium">{getProductSeoQuestion(category)}</label>
                      <Input id="seo-key-details" value={seoDetails} onChange={(event) => setSeoDetails(event.target.value)} maxLength={60} placeholder="Add a short, accurate detail (optional)" />
                      <p className="text-xs text-muted-foreground">{getProductSeoHint(category)} The suggestion adds “in Rwanda | IFIX”; review it before saving.</p>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (RWF)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      setRawCategory(value);
                      setRawBrand("");
                      setRawSubcategory("");
                      form.setValue("brand", "");
                      setCustomCategory("");
                      setCustomBrand("");
                      if (value !== "Other") field.onChange(value);
                      else field.onChange("");
                    }} 
                    value={rawCategory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rawCategory === "Other" && (
              <FormItem>
                <FormLabel>Please specify category</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Type category name..." 
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      form.setValue("category", e.target.value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}

            {form.watch("category") === "Gaming" && (
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        setRawSubcategory(value);
                        setCustomSubcategory("");
                        if (value !== "Other") field.onChange(value);
                        else field.onChange("");
                      }} 
                      value={rawSubcategory}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GAMING_SUBCATEGORIES.map(sub => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("category") === "Gaming" && rawSubcategory === "Other" && (
              <FormItem>
                <FormLabel>Please specify subcategory</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Type subcategory name..." 
                    value={customSubcategory}
                    onChange={(e) => {
                      setCustomSubcategory(e.target.value);
                      form.setValue("brand", e.target.value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => {
                const cat = form.watch("category");
                if (cat === "Gaming") return <></>;
                return (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        setRawBrand(value);
                        setCustomBrand("");
                        if (value !== "Other") field.onChange(value);
                        else field.onChange("");
                      }} 
                      value={rawBrand}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRANDS_BY_CATEGORY[cat]?.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {rawBrand === "Other" && form.watch("category") !== "Gaming" && (
              <FormItem>
                <FormLabel>Please specify brand</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Type brand name..." 
                    value={customBrand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      form.setValue("brand", e.target.value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>📝 SEO Meta Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief SEO description (50-160 characters recommended)..." 
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-2">Characters: {field.value?.length || 0}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">🔍 Search Keywords &amp; Tags</label>
              <div
                className="flex flex-wrap gap-1.5 p-2.5 min-h-10 rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring transition-all cursor-text"
                onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
              >
                {keywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="text-primary/50 hover:text-primary transition-colors leading-none ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addKeyword(keywordInput);
                      setKeywordInput("");
                    } else if (e.key === "Backspace" && !keywordInput && keywords.length) {
                      removeKeyword(keywords[keywords.length - 1]);
                    }
                  }}
                  onBlur={() => { if (keywordInput.trim()) { addKeyword(keywordInput); setKeywordInput(""); } }}
                  placeholder={keywords.length === 0 ? "Type a keyword, press Enter or comma to add..." : "Add more..."}
                  className="flex-1 min-w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Boosts Google search ranking. Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">,</kbd> after each keyword. {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} added.
              </p>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>📄 Main Product Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed product description..." 
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Product Image</FormLabel>
              <div className="flex flex-col gap-4">
                {form.watch("imageUrl") && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <img 
                      src={form.watch("imageUrl")} 
                      alt="Preview" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          form.setValue("imageUrl", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload-edit"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-dashed"
                    onClick={async () => {
                      const input = document.getElementById("image-upload-edit") as HTMLInputElement;
                      input?.click();

                      // Handle file selection and immediate upload
                      input.onchange = async (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleImageUpload(file);
                        }
                      };
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {form.watch("imageUrl") ? "Change Image" : "Upload Product Image"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP, HEIC</p>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <FormLabel>Additional Images</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(form.watch("additionalImages") || []).map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border">
                    <img src={url} alt={`Additional ${idx}`} className="object-cover w-full h-full" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const current = form.getValues("additionalImages") || [];
                        form.setValue("additionalImages", current.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-col items-center justify-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleAdditionalImagesUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                    id="additional-images-upload-edit"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full aspect-square border-dashed"
                    onClick={() => document.getElementById("additional-images-upload-edit")?.click()}
                    disabled={isUploading}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP, HEIC</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <FormField
                control={form.control}
                name="stockStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem value="pre_order">Pre-Order</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Featured Product</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Technical Specifications</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addSpec} className="hover-elevate">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Spec
                </Button>
              </div>
              <div className="space-y-3">
                {specEntries.map((spec, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      placeholder="e.g. Chip"
                      value={spec.key}
                      onChange={(e) => updateSpec(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="e.g. A19 Pro"
                      value={spec.value}
                      onChange={(e) => updateSpec(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpec(index)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {specEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No specifications added yet.</p>
                )}
              </div>
            </div>

            {form.watch("category") === "Smartphones" && (
              <div className="space-y-6 pt-4 border-t">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">Storage Variations</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => (storageFields as any).append({ option: "", priceOffset: 0, stock: 0 })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Storage
                    </Button>
                  </div>
                  {storageFields.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <FormLabel className="text-xs">Capacity (e.g. 128GB)</FormLabel>
                        <Input {...form.register(`variations.storage.${index}.option` as any)} placeholder="128GB" />
                      </div>
                      <div className="w-24 space-y-2">
                        <FormLabel className="text-xs">Price +</FormLabel>
                        <Input type="number" {...form.register(`variations.storage.${index}.priceOffset` as any, { valueAsNumber: true })} />
                      </div>
                      <div className="w-20 space-y-2">
                        <FormLabel className="text-xs">Stock</FormLabel>
                        <Input type="number" {...form.register(`variations.storage.${index}.stock` as any, { valueAsNumber: true })} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => storageFields.remove(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">Color Variations</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={() => (colorFields as any).append({ name: "", value: "#000000", stock: 0 })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Color
                    </Button>
                  </div>
                  {colorFields.fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_64px_80px_minmax(180px,1.2fr)_40px] gap-3 items-end rounded-lg border p-3">
                      <div className="flex-1 space-y-2">
                        <FormLabel className="text-xs">Color Name</FormLabel>
                        <Input {...form.register(`variations.colors.${index}.name` as any)} placeholder="Space Black" />
                      </div>
                      <div className="w-16 space-y-2">
                        <FormLabel className="text-xs">Hex</FormLabel>
                        <Input type="color" {...form.register(`variations.colors.${index}.value` as any)} className="h-10 p-1" />
                      </div>
                      <div className="w-20 space-y-2">
                        <FormLabel className="text-xs">Stock</FormLabel>
                        <Input type="number" {...form.register(`variations.colors.${index}.stock` as any, { valueAsNumber: true })} />
                      </div>
                      <div className="space-y-2">
                        <FormLabel className="text-xs">Photo for this color</FormLabel>
                        <div className="flex items-center gap-2">
                          {form.watch(`variations.colors.${index}.imageUrl` as any) && (
                            <img src={form.watch(`variations.colors.${index}.imageUrl` as any)} alt={`${form.watch(`variations.colors.${index}.name` as any) || "Color"} preview`} className="h-10 w-10 rounded border object-contain bg-white" />
                          )}
                          <Input type="file" accept="image/*,.heic,.heif" disabled={isUploading} aria-label="Upload photo for this color" onChange={(e) => { void handleColorImageUpload(index, e.target.files?.[0]); e.currentTarget.value = ""; }} className="text-xs" />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => colorFields.remove(index)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.watch("category") === "Laptops" && (
              <div className="space-y-4 pt-4 border-t">
                <FormLabel className="text-base">Laptop Specifications</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(LAPTOP_OPTIONS).map(([key, options]) => {
                    const savedSpecs = (product?.specs as Record<string, string>) || {};
                    const savedValue = savedSpecs[key] || "";
                    return (
                      <div key={key} className="space-y-2">
                        <FormLabel className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</FormLabel>
                        <Select
                          defaultValue={savedValue}
                          onValueChange={(value) => {
                            const currentSpecs = form.getValues("specs") as Record<string, string> || {};
                            form.setValue("specs", { ...currentSpecs, [key]: value });
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${key}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {options.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 transition-all hover-elevate active-elevate-2"
              disabled={updateMutation.isPending || isUploading}
            >
              {updateMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
