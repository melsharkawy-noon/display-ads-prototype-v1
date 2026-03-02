"use client";

import { useState, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { RadioCard } from "@/components/ui/RadioCard";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { brands, categories, sellers, fulfillmentOptions, products } from "@/lib/mock-data";
import { 
  Search, 
  ExternalLink, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  Filter,
  CheckSquare,
  Square,
  AlertCircle
} from "lucide-react";

interface StepLandingPageProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepLandingPage({ onBack, onNext }: StepLandingPageProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();
  const isInternal = draft.campaignType === "internal";
  
  const [brandSearch, setBrandSearch] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Collapsible sections state - Category open by default, others closed
  const [sectionsExpanded, setSectionsExpanded] = useState({
    categories: true,
    fulfillment: false,
    brands: false,
    sellers: false,
  });

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  // Check if any filters are applied
  const hasFilters = 
    draft.builderConfig.categories.length > 0 ||
    draft.builderConfig.subcategories.length > 0 ||
    draft.builderConfig.fulfillment.length > 0 ||
    draft.builderConfig.brands.length > 0 ||
    draft.builderConfig.sellers.length > 0;

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    if (!hasFilters) return [];
    
    let result = [...products];
    
    // Filter by category or subcategory
    if (draft.builderConfig.categories.length > 0 || draft.builderConfig.subcategories.length > 0) {
      result = result.filter(p => {
        const matchesCategory = draft.builderConfig.categories.includes(p.category);
        const matchesSubcategory = p.subcategory && draft.builderConfig.subcategories.includes(p.subcategory);
        return matchesCategory || matchesSubcategory;
      });
    }
    
    // Filter by fulfillment
    if (draft.builderConfig.fulfillment.length > 0) {
      result = result.filter(p => draft.builderConfig.fulfillment.includes(p.fulfillment));
    }
    
    // Filter by brand
    if (draft.builderConfig.brands.length > 0) {
      result = result.filter(p => p.brand && draft.builderConfig.brands.includes(p.brand));
    }
    
    // Filter by seller
    if (draft.builderConfig.sellers.length > 0) {
      result = result.filter(p => draft.builderConfig.sellers.includes(p.seller));
    }
    
    return result;
  }, [draft.builderConfig, hasFilters]);

  const selectedProducts = products.filter(p => draft.builderConfig.products.includes(p.id));

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );
  
  const filteredSellers = sellers.filter((s) =>
    s.name.toLowerCase().includes(sellerSearch.toLowerCase())
  );

  // Check if all filtered products are selected
  const allFilteredSelected = filteredProducts.length > 0 && 
    filteredProducts.every(p => draft.builderConfig.products.includes(p.id));

  const toggleCategory = (categoryId: string) => {
    const current = draft.builderConfig.categories;
    const newCategories = current.includes(categoryId)
      ? current.filter(c => c !== categoryId)
      : [...current, categoryId];
    updateDraft({
      builderConfig: { ...draft.builderConfig, categories: newCategories },
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    const current = draft.builderConfig.subcategories;
    const newSubcategories = current.includes(subcategoryId)
      ? current.filter(c => c !== subcategoryId)
      : [...current, subcategoryId];
    updateDraft({
      builderConfig: { ...draft.builderConfig, subcategories: newSubcategories },
    });
  };

  const toggleFulfillment = (fulfillmentId: string) => {
    const current = draft.builderConfig.fulfillment;
    const newFulfillment = current.includes(fulfillmentId)
      ? current.filter(f => f !== fulfillmentId)
      : [...current, fulfillmentId];
    updateDraft({
      builderConfig: { ...draft.builderConfig, fulfillment: newFulfillment },
    });
  };

  const toggleBrand = (brandId: string) => {
    const current = draft.builderConfig.brands;
    const newBrands = current.includes(brandId)
      ? current.filter(b => b !== brandId)
      : [...current, brandId];
    updateDraft({
      builderConfig: { ...draft.builderConfig, brands: newBrands },
    });
  };

  const toggleSeller = (sellerId: string) => {
    const current = draft.builderConfig.sellers;
    const newSellers = current.includes(sellerId)
      ? current.filter(s => s !== sellerId)
      : [...current, sellerId];
    updateDraft({
      builderConfig: { ...draft.builderConfig, sellers: newSellers },
    });
  };

  const addProduct = (productId: string) => {
    if (!draft.builderConfig.products.includes(productId)) {
      updateDraft({
        builderConfig: {
          ...draft.builderConfig,
          products: [...draft.builderConfig.products, productId],
        },
      });
    }
  };

  const removeProduct = (productId: string) => {
    updateDraft({
      builderConfig: {
        ...draft.builderConfig,
        products: draft.builderConfig.products.filter(p => p !== productId),
      },
    });
  };

  const selectAllProducts = () => {
    const allProductIds = filteredProducts.map(p => p.id);
    const currentProducts = draft.builderConfig.products;
    // Merge without duplicates
    const newProducts = [...new Set([...currentProducts, ...allProductIds])];
    updateDraft({
      builderConfig: {
        ...draft.builderConfig,
        products: newProducts,
      },
    });
  };

  const deselectAllProducts = () => {
    const filteredIds = new Set(filteredProducts.map(p => p.id));
    const newProducts = draft.builderConfig.products.filter(id => !filteredIds.has(id));
    updateDraft({
      builderConfig: {
        ...draft.builderConfig,
        products: newProducts,
      },
    });
  };

  const validateUrl = (url: string) => {
    updateDraft({ landingPageUrl: url });
    if (url.length > 0) {
      setTimeout(() => {
        setUrlValid(url.startsWith("http"));
      }, 500);
    } else {
      setUrlValid(null);
    }
  };

  const generatedUrl = draft.landingPageMode === "builder" && (draft.builderConfig.categories.length > 0 || draft.builderConfig.products.length > 0)
    ? `https://www.noon.com/${draft.country.toLowerCase()}-en/search/?${draft.builderConfig.categories.length > 0 ? `category=${draft.builderConfig.categories.join(",")}` : ""}${draft.builderConfig.brands.length > 0 ? `&brand=${draft.builderConfig.brands.join(",")}` : ""}${draft.builderConfig.products.length > 0 ? `&products=${draft.builderConfig.products.length}` : ""}`
    : "";

  const isValid = draft.landingPageMode === "builder"
    ? draft.builderConfig.categories.length > 0 || draft.builderConfig.products.length > 0
    : draft.landingPageUrl.length > 0;

  const handleNext = () => {
    markStepComplete(4);
    onNext();
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  // Count active filters
  const activeFilterCount = 
    draft.builderConfig.categories.length +
    draft.builderConfig.subcategories.length +
    draft.builderConfig.fulfillment.length +
    draft.builderConfig.brands.length +
    draft.builderConfig.sellers.length;

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Choose where your ad sends users after a click"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={!isValid}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Landing Page <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {isInternal
                ? "Choose a direct URL or build an internal landing page"
                : "Enter the external destination URL"}
            </p>

            {!isInternal ? (
              // Third-party: External URL only
              <div className="space-y-4">
                <Alert variant="info">
                  Third-party campaigns must use external URLs only.
                </Alert>
                <Input
                  label="External URL"
                  placeholder="https://www.advertiser-website.com/campaign"
                  value={draft.landingPageUrl}
                  onChange={(e) => validateUrl(e.target.value)}
                  required
                />
                {urlValid === true && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    URL is valid and reachable
                  </div>
                )}
              </div>
            ) : (
              // Internal: URL or Builder
              <div className="space-y-4">
                <RadioCard
                  selected={draft.landingPageMode === "direct_url"}
                  onClick={() => updateDraft({ landingPageMode: "direct_url" })}
                  title="Insert a Direct URL"
                  description="Use any valid internal or external URL"
                >
                  {draft.landingPageMode === "direct_url" && (
                    <div className="mt-4">
                      <Input
                        placeholder="https://www.noon.com/uae-en/promo"
                        value={draft.landingPageUrl}
                        onChange={(e) => validateUrl(e.target.value)}
                      />
                      {urlValid === true && (
                        <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                          <CheckCircle className="w-4 h-4" />
                          URL is valid
                        </div>
                      )}
                    </div>
                  )}
                </RadioCard>

                <RadioCard
                  selected={draft.landingPageMode === "builder"}
                  onClick={() => updateDraft({ landingPageMode: "builder" })}
                  title="Build an Internal Landing Page"
                  description="Generate a marketplace page using filters and products"
                >
                  {draft.landingPageMode === "builder" && (
                    <div className="mt-4">
                      {/* Builder UI - Two Column Layout */}
                      <div className="grid grid-cols-12 gap-6">
                        {/* Left Column - Filters */}
                        <div className="col-span-4 space-y-3 border-r pr-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Filter className="w-4 h-4" />
                              Filters
                            </div>
                            {activeFilterCount > 0 && (
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                {activeFilterCount} active
                              </span>
                            )}
                          </div>

                          {/* Category Section - Open by default */}
                          <div className="border rounded-lg">
                            <button
                              onClick={() => toggleSection("categories")}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Category</span>
                                {(draft.builderConfig.categories.length > 0 || draft.builderConfig.subcategories.length > 0) && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {draft.builderConfig.categories.length + draft.builderConfig.subcategories.length}
                                  </span>
                                )}
                              </div>
                              {sectionsExpanded.categories ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            {sectionsExpanded.categories && (
                              <div className="px-3 pb-3 max-h-48 overflow-auto">
                                {categories.map((category) => (
                                  <div key={category.id}>
                                    <div className="flex items-center gap-2 py-1.5">
                                      {category.subcategories && category.subcategories.length > 0 && (
                                        <button
                                          onClick={() => toggleCategoryExpand(category.id)}
                                          className="p-0.5 hover:bg-gray-100 rounded"
                                        >
                                          {expandedCategories.includes(category.id) ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                          )}
                                        </button>
                                      )}
                                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                          type="checkbox"
                                          checked={draft.builderConfig.categories.includes(category.id)}
                                          onChange={() => toggleCategory(category.id)}
                                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">{category.name}</span>
                                      </label>
                                    </div>
                                    {/* Subcategories */}
                                    {expandedCategories.includes(category.id) && category.subcategories && (
                                      <div className="ml-8 space-y-1 pb-1">
                                        {category.subcategories.map((sub) => (
                                          <label key={sub.id} className="flex items-center gap-2 cursor-pointer py-1">
                                            <input
                                              type="checkbox"
                                              checked={draft.builderConfig.subcategories.includes(sub.id)}
                                              onChange={() => toggleSubcategory(sub.id)}
                                              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-600">{sub.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Fulfilled by Section - Closed by default */}
                          <div className="border rounded-lg">
                            <button
                              onClick={() => toggleSection("fulfillment")}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Fulfilled by</span>
                                {draft.builderConfig.fulfillment.length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                    {draft.builderConfig.fulfillment.length}
                                  </span>
                                )}
                              </div>
                              {sectionsExpanded.fulfillment ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            {sectionsExpanded.fulfillment && (
                              <div className="px-3 pb-3 space-y-2">
                                {fulfillmentOptions.map((option) => (
                                  <label key={option.id} className="flex items-center gap-2 cursor-pointer py-1">
                                    <input
                                      type="checkbox"
                                      checked={draft.builderConfig.fulfillment.includes(option.id)}
                                      onChange={() => toggleFulfillment(option.id)}
                                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    {option.id === "express" ? (
                                      <span className="px-2 py-0.5 bg-yellow-400 text-black text-xs font-semibold rounded">
                                        express
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                        supermall
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Brand Section - Closed by default */}
                          <div className="border rounded-lg">
                            <button
                              onClick={() => toggleSection("brands")}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Brand</span>
                                {draft.builderConfig.brands.length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                    {draft.builderConfig.brands.length}
                                  </span>
                                )}
                              </div>
                              {sectionsExpanded.brands ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            {sectionsExpanded.brands && (
                              <div className="px-3 pb-3">
                                <div className="relative mb-2">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search brands..."
                                    value={brandSearch}
                                    onChange={(e) => setBrandSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                                <div className="max-h-40 overflow-auto space-y-1">
                                  {filteredBrands.map((brand) => (
                                    <label key={brand.id} className="flex items-center gap-2 cursor-pointer py-1">
                                      <input
                                        type="checkbox"
                                        checked={draft.builderConfig.brands.includes(brand.id)}
                                        onChange={() => toggleBrand(brand.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-gray-700">{brand.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Seller Section - Closed by default */}
                          <div className="border rounded-lg">
                            <button
                              onClick={() => toggleSection("sellers")}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">Seller</span>
                                {draft.builderConfig.sellers.length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                    {draft.builderConfig.sellers.length}
                                  </span>
                                )}
                              </div>
                              {sectionsExpanded.sellers ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            {sectionsExpanded.sellers && (
                              <div className="px-3 pb-3">
                                <div className="relative mb-2">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search sellers..."
                                    value={sellerSearch}
                                    onChange={(e) => setSellerSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                                <div className="max-h-40 overflow-auto space-y-1">
                                  {filteredSellers.map((seller) => (
                                    <label key={seller.id} className="flex items-center gap-2 cursor-pointer py-1">
                                      <input
                                        type="checkbox"
                                        checked={draft.builderConfig.sellers.includes(seller.id)}
                                        onChange={() => toggleSeller(seller.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                      />
                                      <span className="text-sm text-gray-700">{seller.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Column - Product List */}
                        <div className="col-span-5">
                          {!hasFilters ? (
                            // No filters applied - show prompt
                            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Filter className="w-8 h-8 text-gray-400" />
                              </div>
                              <h4 className="text-base font-medium text-gray-900 mb-2">
                                Start by applying filters
                              </h4>
                              <p className="text-sm text-gray-500 text-center max-w-xs">
                                Select at least one category, brand, fulfillment type, or seller to see matching products
                              </p>
                              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Use the filters panel on the left
                              </div>
                            </div>
                          ) : (
                            // Filters applied - show products
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Available Products ({filteredProducts.length})
                                </span>
                                {filteredProducts.length > 0 && (
                                  <button
                                    onClick={allFilteredSelected ? deselectAllProducts : selectAllProducts}
                                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                  >
                                    {allFilteredSelected ? (
                                      <>
                                        <CheckSquare className="w-4 h-4" />
                                        Deselect All
                                      </>
                                    ) : (
                                      <>
                                        <Square className="w-4 h-4" />
                                        Select All
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              
                              {filteredProducts.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center">
                                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                  <p className="text-sm text-gray-500">
                                    No products match your current filters
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Try adjusting your filter criteria
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                                  {filteredProducts.map((product) => {
                                    const isSelected = draft.builderConfig.products.includes(product.id);
                                    return (
                                      <div
                                        key={product.id}
                                        className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                                          isSelected 
                                            ? "border-primary-300 bg-primary-50" 
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                      >
                                        {/* Product Image */}
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                          {product.image ? (
                                            <img 
                                              src={product.image} 
                                              alt={product.name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                              }}
                                            />
                                          ) : null}
                                          <Package className={`w-6 h-6 text-gray-400 ${product.image ? 'hidden' : ''}`} />
                                        </div>
                                        
                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                            {product.name}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            {product.fulfillment === "express" ? (
                                              <span className="px-1.5 py-0.5 bg-yellow-400 text-black text-[10px] font-semibold rounded">
                                                express
                                              </span>
                                            ) : (
                                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded">
                                                supermall
                                              </span>
                                            )}
                                            <span className="text-sm font-semibold text-gray-900">
                                              {formatPrice(product.price, product.currency)}
                                            </span>
                                            {product.originalPrice && (
                                              <span className="text-xs text-gray-400 line-through">
                                                {formatPrice(product.originalPrice, product.currency)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Add/Remove Button */}
                                        {isSelected ? (
                                          <button
                                            onClick={() => removeProduct(product.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="w-5 h-5" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => addProduct(product.id)}
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                          >
                                            <Plus className="w-5 h-5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Right Column - Selected Products */}
                        <div className="col-span-3">
                          <div className="sticky top-0">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-5 bg-primary-500 rounded-full" />
                              <span className="text-sm font-semibold text-gray-900">
                                {selectedProducts.length.toString().padStart(2, "0")} Products Selected
                              </span>
                            </div>
                            
                            {selectedProducts.length > 0 ? (
                              <div className="space-y-2 max-h-[360px] overflow-auto">
                                {selectedProducts.map((product) => (
                                  <div
                                    key={product.id}
                                    className="flex items-center gap-2 p-2 bg-primary-50 border border-primary-200 rounded-lg"
                                  >
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      {product.image ? (
                                        <img 
                                          src={product.image} 
                                          alt={product.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                          }}
                                        />
                                      ) : null}
                                      <Package className={`w-4 h-4 text-gray-400 ${product.image ? 'hidden' : ''}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 line-clamp-2">
                                        {product.name}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {product.fulfillment === "express" && (
                                          <span className="px-1 py-0.5 bg-yellow-400 text-black text-[8px] font-semibold rounded">
                                            express
                                          </span>
                                        )}
                                        <span className="text-xs font-semibold text-gray-900">
                                          {formatPrice(product.price, product.currency)}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeProduct(product.id)}
                                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
                                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                  No products selected
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {hasFilters ? "Add products from the list" : "Apply filters first"}
                                </p>
                              </div>
                            )}

                            {/* Selected Filters Summary */}
                            {hasFilters && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                  Active Filters
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {draft.builderConfig.categories.map((catId) => {
                                    const cat = categories.find(c => c.id === catId);
                                    return (
                                      <span key={catId} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        {cat?.name}
                                      </span>
                                    );
                                  })}
                                  {draft.builderConfig.subcategories.map((subId) => {
                                    for (const cat of categories) {
                                      const sub = cat.subcategories?.find(s => s.id === subId);
                                      if (sub) {
                                        return (
                                          <span key={subId} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                                            {sub.name}
                                          </span>
                                        );
                                      }
                                    }
                                    return null;
                                  })}
                                  {draft.builderConfig.fulfillment.map((fId) => {
                                    const f = fulfillmentOptions.find(f => f.id === fId);
                                    return (
                                      <span key={fId} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                        {f?.name}
                                      </span>
                                    );
                                  })}
                                  {draft.builderConfig.brands.map((brandId) => {
                                    const brand = brands.find(b => b.id === brandId);
                                    return (
                                      <span key={brandId} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                        {brand?.name}
                                      </span>
                                    );
                                  })}
                                  {draft.builderConfig.sellers.map((sellerId) => {
                                    const seller = sellers.find(s => s.id === sellerId);
                                    return (
                                      <span key={sellerId} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                        {seller?.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generated URL Preview */}
                      {generatedUrl && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-2">Generated URL Preview</div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs text-gray-600 bg-white px-3 py-2 rounded border truncate">
                              {generatedUrl}
                            </code>
                            <button className="p-2 hover:bg-gray-200 rounded-lg">
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </RadioCard>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WizardLayout>
  );
}
