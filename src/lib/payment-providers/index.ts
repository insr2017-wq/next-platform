import type { CreateDepositParams, CreateDepositResult, DepositProvider, DepositProviderId } from "./types";
import { vizzionPayDepositProvider } from "./vizzionpay-provider";
import { vqPayDepositProvider } from "./vqpay-provider";

const providers: Record<DepositProviderId, DepositProvider> = {
  vizzionpay: vizzionPayDepositProvider,
  vqpay: vqPayDepositProvider,
};

export function getDepositProvider(id: DepositProviderId): DepositProvider {
  return providers[id];
}

export async function createPixDeposit(
  providerId: DepositProviderId,
  params: CreateDepositParams
): Promise<CreateDepositResult> {
  return getDepositProvider(providerId).createDeposit(params);
}

export type {
  CreateDepositParams,
  CreateDepositResult,
  DepositProvider,
  DepositProviderId,
  DepositStatus,
} from "./types";
export { parseDepositProviderId } from "./types";
