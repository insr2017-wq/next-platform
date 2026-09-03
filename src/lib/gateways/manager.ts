import {
  getDefaultActiveGatewayId,
  readStoredActiveGateway,
  writeStoredActiveGateway,
} from "@/lib/gateways/settings";
import { misticPayGateway } from "@/lib/gateways/misticpay";
import { vizzionPayGateway } from "@/lib/gateways/vizzion-pay";
import type { PaymentGateway } from "@/lib/gateways/types";

class GatewayManager {
  private readonly gateways = new Map<string, PaymentGateway>();

  register(gateway: PaymentGateway): void {
    this.gateways.set(gateway.id, gateway);
  }

  listRegisteredGatewayIds(): string[] {
    return [...this.gateways.keys()];
  }

  getGatewayById(id: string): PaymentGateway | undefined {
    return this.gateways.get(id);
  }

  isRegistered(id: string): boolean {
    return this.gateways.has(id);
  }

  async getActiveGatewayId(): Promise<string> {
    const stored = await readStoredActiveGateway();
    if (stored && this.gateways.has(stored)) return stored;

    const fromEnv = getDefaultActiveGatewayId();
    if (this.gateways.has(fromEnv)) return fromEnv;

    const first = this.listRegisteredGatewayIds()[0];
    if (!first) {
      throw new Error("Nenhum gateway de pagamento registrado.");
    }
    return first;
  }

  async getActiveGateway(): Promise<PaymentGateway> {
    const id = await this.getActiveGatewayId();
    const gateway = this.gateways.get(id);
    if (!gateway) {
      throw new Error(`Gateway ativo "${id}" não está registrado.`);
    }
    return gateway;
  }

  async setActiveGateway(id: string): Promise<void> {
    if (!this.gateways.has(id)) {
      throw new Error("GATEWAY_NOT_REGISTERED");
    }
    await writeStoredActiveGateway(id);
  }
}

export const gatewayManager = new GatewayManager();
gatewayManager.register(vizzionPayGateway);
gatewayManager.register(misticPayGateway);

export function getActiveGateway(): Promise<PaymentGateway> {
  return gatewayManager.getActiveGateway();
}
