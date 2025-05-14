export interface AzureResource {
  resourceType: string;
  sku: string;
  capacity: string;
  armRegionName: string;
}

export interface ResourcePricing extends AzureResource {
  pricing: {
    noInfo: boolean;
    retailPrice: number;
    unitPrice: number;
    currencyCode: string;
    unitOfMeasure: string;
  };
}

export interface CostEstimate {
  resources: ResourcePricing[];
  totalCost: number;
  currency: string;
  monthlyCost: number;
}