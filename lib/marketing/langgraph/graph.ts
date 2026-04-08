/**
 * Marketing LangGraph orchestration (LLD §7).
 *
 * - Runs only on the server (Supabase Edge Function).
 * - Node implementations live in ../pipeline/steps.ts (single source of truth).
 * - Linear equivalent: ../pipeline/run.ts (used by Jest without ESM LangGraph).
 */

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { initialPipelineState } from "../pipeline/state";
import type { MarketingPipelineState } from "../pipeline/state";
import {
  stepAssemblePrompt,
  stepGenerateCopy,
  stepLoadCompanyContext,
  stepPersist,
  stepPostProcess,
  stepValidateRequest,
} from "../pipeline/steps";
import type {
  MarketingAsset,
  MarketingChannel,
  MarketingGenerateParams,
} from "../types";

/** Re-export types for Edge + client imports. */
export type {
  MarketingAsset,
  MarketingChannel,
  MarketingGenerateParams,
} from "../types";

const MarketingState = Annotation.Root({
  pipeline: Annotation<MarketingPipelineState>({
    reducer: (_previous, next) => next,
  }),
});

async function nodeLoadCompanyContext(
  state: typeof MarketingState.State,
): Promise<typeof MarketingState.Update> {
  const pipeline = await stepLoadCompanyContext(state.pipeline);
  return { pipeline };
}

function nodeValidateRequest(
  state: typeof MarketingState.State,
): typeof MarketingState.Update {
  stepValidateRequest(state.pipeline);
  return {};
}

function nodeAssemblePrompt(
  state: typeof MarketingState.State,
): typeof MarketingState.Update {
  const pipeline = stepAssemblePrompt(state.pipeline);
  return { pipeline };
}

async function nodeGenerateCopy(
  state: typeof MarketingState.State,
): Promise<typeof MarketingState.Update> {
  const pipeline = await stepGenerateCopy(state.pipeline);
  return { pipeline };
}

function nodePostProcess(
  state: typeof MarketingState.State,
): typeof MarketingState.Update {
  const pipeline = stepPostProcess(state.pipeline);
  return { pipeline };
}

async function nodePersist(
  state: typeof MarketingState.State,
): Promise<typeof MarketingState.Update> {
  const pipeline = await stepPersist(state.pipeline);
  return { pipeline };
}

function buildMarketingGraph() {
  const graph = new StateGraph(MarketingState)
    .addNode("loadCompanyContext", nodeLoadCompanyContext)
    .addNode("validateRequest", nodeValidateRequest)
    .addNode("assemblePrompt", nodeAssemblePrompt)
    .addNode("generateCopy", nodeGenerateCopy)
    .addNode("postProcess", nodePostProcess)
    .addNode("persist", nodePersist)
    .addEdge(START, "loadCompanyContext")
    .addEdge("loadCompanyContext", "validateRequest")
    .addEdge("validateRequest", "assemblePrompt")
    .addEdge("assemblePrompt", "generateCopy")
    .addEdge("generateCopy", "postProcess")
    .addEdge("postProcess", "persist")
    .addEdge("persist", END);

  return graph.compile();
}

const compiledGraph = buildMarketingGraph();

/**
 * Public entry for the Edge Function: runs the LangGraph pipeline.
 */
export async function runMarketingGraph(
  params: MarketingGenerateParams,
): Promise<MarketingAsset> {
  const initial = initialPipelineState(params);

  const result = await compiledGraph.invoke({
    pipeline: initial,
  });

  const asset = result.pipeline.asset;
  if (!asset) {
    throw new Error("Failed to persist marketing asset");
  }

  return asset;
}
