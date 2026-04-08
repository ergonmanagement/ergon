import type {
  CompanyMarketingContext,
  MarketingAsset,
  MarketingGenerateParams,
} from "../types";

export type MarketingPipelineState = {
  params: MarketingGenerateParams;
  company: CompanyMarketingContext;
  prompt: string;
  rawContent: string;
  asset: MarketingAsset | null;
};

export function initialPipelineState(
  params: MarketingGenerateParams,
): MarketingPipelineState {
  return {
    params,
    company: { name: null, service_type: null },
    prompt: "",
    rawContent: "",
    asset: null,
  };
}
