"use client";

import { memo, useState, useEffect, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  categories,
  brands,
  products,
} from "@/lib/mock-data";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Filter,
  Package,
  ExternalLink,
  Search,
} from "lucide-react";

interface LandingPageSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
}

const productsPerPage = 8;

const LandingPageSection = memo(function LandingPageSection({ sectionRef }: LandingPageSectionProps) {
  const { draft, updateDraft } = useCampaign();

  // Landing page builder state
  const [sectionsExpanded, setSectionsExpanded] = useState({
    categories: true,
    brands: false,
  });

  // Product pagination & search state
  const [productPage, setProductPage] = useState(1);
  const [selectedProductPage, setSelectedProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");

  // Landing page builder helpers
  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredProducts = useMemo(() => {
    // Show all products by default; narrow when filters are applied
    let result = [...products];
    
    if (draft.builderConfig.categories.length > 0 || draft.builderConfig.subcategories.length > 0) {
      result = result.filter(p => {
        const matchesCategory = draft.builderConfig.categories.includes(p.category);
        const matchesSubcategory = p.subcategory && draft.builderConfig.subcategories.includes(p.subcategory);
        return matchesCategory || matchesSubcategory;
      });
    }
    
    if (draft.builderConfig.fulfillment.length > 0) {
      result = result.filter(p => draft.builderConfig.fulfillment.includes(p.fulfillment));
    }
    
    if (draft.builderConfig.brands.length > 0) {
      result = result.filter(p => p.brand && draft.builderConfig.brands.includes(p.brand));
    }
    
    if (draft.builderConfig.sellers.length > 0) {
      result = result.filter(p => draft.builderConfig.sellers.includes(p.seller));
    }

    // Apply text search
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [draft.builderConfig, productSearch]);

  // Reset product page when filters or search change
  useEffect(() => {
    setProductPage(1);
  }, [draft.builderConfig.categories, draft.builderConfig.subcategories, draft.builderConfig.brands, draft.builderConfig.sellers, draft.builderConfig.fulfillment, productSearch]);
  
  // Reset selected product page when products change
  useEffect(() => {
    const maxPage = Math.ceil(draft.builderConfig.products.length / productsPerPage);
    if (selectedProductPage > maxPage && maxPage > 0) {
      setSelectedProductPage(maxPage);
    }
  }, [draft.builderConfig.products.length, selectedProductPage]);

  // ── Seller Flow ──────────────────────────────────────────────────────
  if (draft.entryType === "seller") {
    return (
      <section 
        ref={sectionRef}
        id="landing" 
        className="scroll-mt-36"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Landing Page</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Select products to feature in your campaign or provide a direct URL
            </p>

            {/* Seller flow: Product selection as primary option */}
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => updateDraft({ landingPageMode: "builder" })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    draft.landingPageMode === "builder" 
                      ? "bg-primary-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  Product Selection
                </button>
                <button
                  onClick={() => updateDraft({ landingPageMode: "direct_url" })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    draft.landingPageMode === "direct_url" 
                      ? "bg-primary-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  Direct URL
                </button>
              </div>

              {draft.landingPageMode === "direct_url" ? (
                <Input
                  label="Landing Page URL"
                  placeholder="https://www.noon.com/uae-en/your-product-page"
                  value={draft.landingPageUrl}
                  onChange={(e) => updateDraft({ landingPageUrl: e.target.value })}
                />
              ) : (
                /* Product Selection for Seller */
                <div className="space-y-4 overflow-hidden">
                  {/* Generated URL Preview */}
                  {draft.builderConfig.products.length > 0 && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg overflow-hidden w-full max-w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-primary-700">Generated Landing Page URL</span>
                      </div>
                      <div className="flex items-center gap-2 w-full overflow-hidden">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <code className="text-sm text-primary-700 bg-white px-3 py-1.5 rounded border border-primary-200 block truncate w-full">
                            {`https://www.noon.com/${draft.country?.toLowerCase() || "ae"}-en/collection?products=${draft.builderConfig.products.join(",")}`}
                          </code>
                        </div>
                        <button
                          onClick={() => {
                            const url = `https://www.noon.com/${draft.country?.toLowerCase() || "ae"}-en/collection?products=${draft.builderConfig.products.join(",")}`;
                            navigator.clipboard.writeText(url);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 rounded transition-colors flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-12 gap-4 overflow-hidden w-full">
                    {/* Left: Filters */}
                    <div className="col-span-3 space-y-2 border-r pr-4 max-h-96 overflow-y-auto min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <Filter className="w-4 h-4" />
                        Filters
                      </div>
                    
                    {/* Category */}
                    <div className="border rounded-lg">
                      <button
                        onClick={() => toggleSection("categories")}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium text-gray-900">Category</span>
                        {sectionsExpanded.categories ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {sectionsExpanded.categories && (
                        <div className="px-2.5 pb-2.5 max-h-32 overflow-auto">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.builderConfig.categories.includes(cat.id)}
                                onChange={() => {
                                  const current = draft.builderConfig.categories;
                                  const newCats = current.includes(cat.id)
                                    ? current.filter(c => c !== cat.id)
                                    : [...current, cat.id];
                                  updateDraft({ builderConfig: { ...draft.builderConfig, categories: newCats } });
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-700">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Brands */}
                    <div className="border rounded-lg">
                      <button
                        onClick={() => toggleSection("brands")}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium text-gray-900">Brand</span>
                        {sectionsExpanded.brands ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {sectionsExpanded.brands && (
                        <div className="px-2.5 pb-2.5 max-h-32 overflow-auto">
                          {brands.map(brand => (
                            <label key={brand.id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.builderConfig.brands.includes(brand.id)}
                                onChange={() => {
                                  const current = draft.builderConfig.brands;
                                  const newBrands = current.includes(brand.id)
                                    ? current.filter(b => b !== brand.id)
                                    : [...current, brand.id];
                                  updateDraft({ builderConfig: { ...draft.builderConfig, brands: newBrands } });
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-700">{brand.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Product List */}
                  <div className="col-span-5 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Products</span>
                      <button
                        onClick={() => {
                          const allIds = filteredProducts.slice((productPage - 1) * productsPerPage, productPage * productsPerPage).map(p => p.id);
                          const newProducts = [...new Set([...draft.builderConfig.products, ...allIds])];
                          updateDraft({ builderConfig: { ...draft.builderConfig, products: newProducts } });
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Select All on Page
                      </button>
                    </div>
                    {/* Product Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search by name, SKU, or brand..."
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
                      />
                      {productSearch && (
                        <button
                          onClick={() => setProductSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No products found</p>
                        <p className="text-xs mt-1">Try a different search term or adjust filters</p>
                      </div>
                    ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredProducts
                        .slice((productPage - 1) * productsPerPage, productPage * productsPerPage)
                        .map(product => {
                          const isSelected = draft.builderConfig.products.includes(product.id);
                          return (
                            <div
                              key={product.id}
                              className={cn(
                                "flex items-center gap-3 p-2 border rounded-lg transition-all",
                                isSelected ? "border-primary-500 bg-primary-50" : "hover:border-gray-300"
                              )}
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                <div className="flex items-center gap-2">
                                  {product.fulfillment && (
                                    <span className={cn(
                                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                      product.fulfillment === "express" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                                    )}>
                                      {product.fulfillment === "express" ? "express" : "supermall"}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-600">{product.price}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const current = draft.builderConfig.products;
                                  const newProducts = isSelected
                                    ? current.filter(id => id !== product.id)
                                    : [...current, product.id];
                                  updateDraft({ builderConfig: { ...draft.builderConfig, products: newProducts } });
                                }}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                                  isSelected 
                                    ? "bg-red-100 text-red-600 hover:bg-red-200" 
                                    : "bg-primary-100 text-primary-600 hover:bg-primary-200"
                                )}
                              >
                                {isSelected ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    )}
                    {filteredProducts.length > productsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                        <button
                          onClick={() => setProductPage(Math.max(1, productPage - 1))}
                          disabled={productPage === 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500">
                          Page {productPage} of {Math.ceil(filteredProducts.length / productsPerPage)}
                        </span>
                        <button
                          onClick={() => setProductPage(Math.min(Math.ceil(filteredProducts.length / productsPerPage), productPage + 1))}
                          disabled={productPage >= Math.ceil(filteredProducts.length / productsPerPage)}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Selected Products */}
                  <div className="col-span-4 bg-primary-50 rounded-lg p-3 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {String(draft.builderConfig.products.length).padStart(2, '0')} Products Selected
                      </span>
                      {draft.builderConfig.products.length > 0 && (
                        <button
                          onClick={() => updateDraft({ builderConfig: { ...draft.builderConfig, products: [] } })}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {draft.builderConfig.products.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No products selected</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {draft.builderConfig.products
                            .slice((selectedProductPage - 1) * productsPerPage, selectedProductPage * productsPerPage)
                            .map(productId => {
                              const product = products.find(p => p.id === productId);
                              if (!product) return null;
                              return (
                                <div key={product.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                                  <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {product.image ? (
                                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-4 h-4 text-gray-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                                    <div className="flex items-center gap-2">
                                      {product.fulfillment && (
                                        <span className={cn(
                                          "text-[9px] px-1 py-0.5 rounded font-medium",
                                          product.fulfillment === "express" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                                        )}>
                                          {product.fulfillment === "express" ? "express" : "supermall"}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-gray-500">{product.price}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newProducts = draft.builderConfig.products.filter(id => id !== product.id);
                                      updateDraft({ builderConfig: { ...draft.builderConfig, products: newProducts } });
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center flex-shrink-0 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                        {draft.builderConfig.products.length > productsPerPage && (
                          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-primary-200">
                            <button
                              onClick={() => setSelectedProductPage(Math.max(1, selectedProductPage - 1))}
                              disabled={selectedProductPage === 1}
                              className="p-1 rounded hover:bg-primary-100 disabled:opacity-30"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-gray-500">
                              {selectedProductPage}/{Math.ceil(draft.builderConfig.products.length / productsPerPage)}
                            </span>
                            <button
                              onClick={() => setSelectedProductPage(Math.min(Math.ceil(draft.builderConfig.products.length / productsPerPage), selectedProductPage + 1))}
                              disabled={selectedProductPage >= Math.ceil(draft.builderConfig.products.length / productsPerPage)}
                              className="p-1 rounded hover:bg-primary-100 disabled:opacity-30"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // ── Managed Flow ─────────────────────────────────────────────────────
  // Non-endemic: external URL only. Endemic: identical to self-serve flow.
  return (
    <section 
      ref={sectionRef}
      id="landing" 
      className="scroll-mt-36"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Landing Page</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {draft.campaignType === "third_party"
              ? "Enter the external destination URL for non-endemic advertising"
              : "Select products to feature in your campaign or provide a direct URL"}
          </p>

          {draft.campaignType === "third_party" ? (
            <div>
              <Input
                label="External URL"
                placeholder="https://www.advertiser-website.com/campaign?utm_source=noon&utm_medium=display&campaign_id=12345"
                value={draft.landingPageUrl}
                onChange={(e) => updateDraft({ landingPageUrl: e.target.value })}
                required
              />
            </div>
          ) : (
            /* Endemic: same as self-serve */
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => updateDraft({ landingPageMode: "builder" })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    draft.landingPageMode === "builder" 
                      ? "bg-primary-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  Product Selection
                </button>
                <button
                  onClick={() => updateDraft({ landingPageMode: "direct_url" })}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    draft.landingPageMode === "direct_url" 
                      ? "bg-primary-500 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  Direct URL
                </button>
              </div>

              {draft.landingPageMode === "direct_url" ? (
                <Input
                  label="Landing Page URL"
                  placeholder="https://www.noon.com/uae-en/your-product-page"
                  value={draft.landingPageUrl}
                  onChange={(e) => updateDraft({ landingPageUrl: e.target.value })}
                />
              ) : (
                /* Product Selection - identical to self-serve */
                <div className="space-y-4 overflow-hidden">
                  {/* Generated URL Preview */}
                  {draft.builderConfig.products.length > 0 && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg overflow-hidden w-full max-w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-primary-700">Generated Landing Page URL</span>
                      </div>
                      <div className="flex items-center gap-2 w-full overflow-hidden">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <code className="text-sm text-primary-700 bg-white px-3 py-1.5 rounded border border-primary-200 block truncate w-full">
                            {`https://www.noon.com/${draft.country?.toLowerCase() || "ae"}-en/collection?products=${draft.builderConfig.products.join(",")}`}
                          </code>
                        </div>
                        <button
                          onClick={() => {
                            const url = `https://www.noon.com/${draft.country?.toLowerCase() || "ae"}-en/collection?products=${draft.builderConfig.products.join(",")}`;
                            navigator.clipboard.writeText(url);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 rounded transition-colors flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-12 gap-4 overflow-hidden w-full">
                    {/* Left: Filters */}
                    <div className="col-span-3 space-y-2 border-r pr-4 max-h-96 overflow-y-auto min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <Filter className="w-4 h-4" />
                        Filters
                      </div>
                    
                    {/* Category */}
                    <div className="border rounded-lg">
                      <button
                        onClick={() => toggleSection("categories")}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium text-gray-900">Category</span>
                        {sectionsExpanded.categories ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {sectionsExpanded.categories && (
                        <div className="px-2.5 pb-2.5 max-h-32 overflow-auto">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.builderConfig.categories.includes(cat.id)}
                                onChange={() => {
                                  const current = draft.builderConfig.categories;
                                  const newCats = current.includes(cat.id)
                                    ? current.filter(c => c !== cat.id)
                                    : [...current, cat.id];
                                  updateDraft({ builderConfig: { ...draft.builderConfig, categories: newCats } });
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-700">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Brands */}
                    <div className="border rounded-lg">
                      <button
                        onClick={() => toggleSection("brands")}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium text-gray-900">Brand</span>
                        {sectionsExpanded.brands ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {sectionsExpanded.brands && (
                        <div className="px-2.5 pb-2.5 max-h-32 overflow-auto">
                          {brands.map(brand => (
                            <label key={brand.id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.builderConfig.brands.includes(brand.id)}
                                onChange={() => {
                                  const current = draft.builderConfig.brands;
                                  const newBrands = current.includes(brand.id)
                                    ? current.filter(b => b !== brand.id)
                                    : [...current, brand.id];
                                  updateDraft({ builderConfig: { ...draft.builderConfig, brands: newBrands } });
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-700">{brand.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Product List */}
                  <div className="col-span-5 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Products</span>
                      <button
                        onClick={() => {
                          const allIds = filteredProducts.slice((productPage - 1) * productsPerPage, productPage * productsPerPage).map(p => p.id);
                          const newProducts = [...new Set([...draft.builderConfig.products, ...allIds])];
                          updateDraft({ builderConfig: { ...draft.builderConfig, products: newProducts } });
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Select All on Page
                      </button>
                    </div>
                    {/* Product Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search by name, SKU, or brand..."
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
                      />
                      {productSearch && (
                        <button
                          onClick={() => setProductSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No products found</p>
                        <p className="text-xs mt-1">Try a different search term or adjust filters</p>
                      </div>
                    ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredProducts
                        .slice((productPage - 1) * productsPerPage, productPage * productsPerPage)
                        .map(product => {
                          const isSelected = draft.builderConfig.products.includes(product.id);
                          return (
                            <div
                              key={product.id}
                              className={cn(
                                "flex items-center gap-3 p-2 border rounded-lg transition-all",
                                isSelected ? "border-primary-500 bg-primary-50" : "hover:border-gray-300"
                              )}
                            >
                              <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                <div className="flex items-center gap-2">
                                  {product.fulfillment && (
                                    <span className={cn(
                                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                      product.fulfillment === "express" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                                    )}>
                                      {product.fulfillment === "express" ? "express" : "supermall"}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-600">{product.price}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const current = draft.builderConfig.products;
                                  const newProducts = isSelected
                                    ? current.filter(id => id !== product.id)
                                    : [...current, product.id];
                                  updateDraft({ builderConfig: { ...draft.builderConfig, products: newProducts } });
                                }}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                                  isSelected 
                                    ? "bg-red-100 text-red-600 hover:bg-red-200" 
                                    : "bg-primary-100 text-primary-600 hover:bg-primary-200"
                                )}
                              >
                                {isSelected ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    )}
                    {filteredProducts.length > productsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                        <button
                          onClick={() => setProductPage(Math.max(1, productPage - 1))}
                          disabled={productPage === 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500">
                          Page {productPage} of {Math.ceil(filteredProducts.length / productsPerPage)}
                        </span>
                        <button
                          onClick={() => setProductPage(Math.min(Math.ceil(filteredProducts.length / productsPerPage), productPage + 1))}
                          disabled={productPage >= Math.ceil(filteredProducts.length / productsPerPage)}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Selected Products */}
                  <div className="col-span-4 bg-primary-50 rounded-lg p-3 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {String(draft.builderConfig.products.length).padStart(2, '0')} Products Selected
                      </span>
                      {draft.builderConfig.products.length > 0 && (
                        <button
                          onClick={() => updateDraft({ builderConfig: { ...draft.builderConfig, products: [] } })}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {draft.builderConfig.products.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No products selected</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {draft.builderConfig.products
                            .slice((selectedProductPage - 1) * productsPerPage, selectedProductPage * productsPerPage)
                            .map(productId => {
                              const product = products.find(p => p.id === productId);
                              if (!product) return null;
                              return (
                                <div key={product.id} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                                  <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {product.image ? (
                                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-4 h-4 text-gray-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                                    <div className="flex items-center gap-2">
                                      {product.fulfillment && (
                                        <span className={cn(
                                          "text-[9px] px-1 py-0.5 rounded font-medium",
                                          product.fulfillment === "express" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                                        )}>
                                          {product.fulfillment === "express" ? "express" : "supermall"}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-gray-500">{product.price}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newProducts = draft.builderConfig.products.filter(id => id !== product.id);
                                      updateDraft({ builderConfig: { ...draft.builderConfig, products: newProducts } });
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center flex-shrink-0 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                        {draft.builderConfig.products.length > productsPerPage && (
                          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-primary-200">
                            <button
                              onClick={() => setSelectedProductPage(Math.max(1, selectedProductPage - 1))}
                              disabled={selectedProductPage === 1}
                              className="p-1 rounded hover:bg-primary-100 disabled:opacity-30"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <span className="text-[10px] text-gray-500">
                              {selectedProductPage}/{Math.ceil(draft.builderConfig.products.length / productsPerPage)}
                            </span>
                            <button
                              onClick={() => setSelectedProductPage(Math.min(Math.ceil(draft.builderConfig.products.length / productsPerPage), selectedProductPage + 1))}
                              disabled={selectedProductPage >= Math.ceil(draft.builderConfig.products.length / productsPerPage)}
                              className="p-1 rounded hover:bg-primary-100 disabled:opacity-30"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
});

export default LandingPageSection;
