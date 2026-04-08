/**
 * Linear marketing pipeline — same behavior as LangGraph graph (for tests + fallback).
 */

import type { MarketingAsset, MarketingGenerateParams } from "../types";
import { initialPipelineState, type MarketingPipelineState } from "./state";
import {
  stepAssemblePrompt,
  stepGenerateCopy,
  stepLoadCompanyContext,
  stepPersist,
  stepPostProcess,
  stepValidateRequest,
} from "./steps";

export async function runMarketingPipeline(
  params: MarketingGenerateParams,
): Promise<MarketingAsset> {
  let state: MarketingPipelineState = initialPipelineState(params);

  state = await stepLoadCompanyContext(state);
  stepValidateRequest(state);
  state = stepAssemblePrompt(state);
  state = await stepGenerateCopy(state);
  state = stepPostProcess(state);
  state = await stepPersist(state);

  if (!state.asset) {
    throw new Error("Failed to persist marketing asset");
  }

  return state.asset;
}
