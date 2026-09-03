import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signData, signMerchantNo, verifySignature, webhookPayloadForSignature } from "./vqpay-sign";

describe("vqpay-sign", () => {
  it("signData matches official deposit request fixture from documentation", () => {
    const secretKey = "YICOBBV0HDYGJQYY4A02KVVUUULOCPQM";
    const data = {
      amount: "100.00",
      country: "BRL",
      currency: "BRL",
      notification_url: "http://xxx.xxx.xxx/notify/test",
      order_id: "TEST16763328",
      payment_method_flow: "REDIRECT",
      payment_method_id: "PIX",
      success_redirect_url: "http://xxx.xxx.xxx/success",
      timestamp: 1676332913556,
      payer: {
        name: "should not sign",
        document: "00000000000",
      },
    };

    const signature = signData(data, secretKey);
    assert.equal(signature, "75A3F7B635A639F02B478AED9BCFE3F7");
  });

  it("signData ignores null, undefined and empty string fields", () => {
    const secretKey = "TESTKEY";
    const withEmpty = signData(
      { amount: "10.00", currency: "BRL", extend: "", order_id: "A1", timestamp: 1 },
      secretKey
    );
    const withoutEmpty = signData(
      { amount: "10.00", currency: "BRL", order_id: "A1", timestamp: 1 },
      secretKey
    );
    assert.equal(withEmpty, withoutEmpty);
  });

  it("signData sorts fields in ASCII order", () => {
    const secretKey = "K";
    const signature = signData(
      { z_field: "2", a_field: "1", m_field: "3" },
      secretKey
    );
    assert.equal(signature, signData({ a_field: "1", m_field: "3", z_field: "2" }, secretKey));
  });

  it("signMerchantNo signs only merchant_no for balance endpoint", () => {
    const signature = signMerchantNo("M123456", "PAYOUT_SECRET");
    const expectedRaw = "merchant_no=M123456&key=PAYOUT_SECRET";
    const crypto = require("node:crypto") as typeof import("node:crypto");
    const expected = crypto.createHash("md5").update(expectedRaw).digest("hex").toUpperCase();
    assert.equal(signature, expected);
  });

  it("verifySignature accepts valid webhook-style payload", () => {
    const secretKey = "WEBHOOK_SECRET";
    const payload = {
      amount: "101.82",
      currency: "BRL",
      order_id: "TEST1676152468957",
      payment_id: "P_101100045_1624527347380260864",
      status: "SUCCESS",
      status_code: 100,
      status_detail: "Payment is success",
      timestamp: 1676675149139,
    };
    const signature = signData(payload, secretKey);
    const withSig = { ...payload, signature };
    const forVerify = webhookPayloadForSignature(withSig);
    assert.ok(forVerify);
    assert.equal(verifySignature(forVerify, secretKey, signature), true);
    assert.equal(verifySignature(forVerify, secretKey, "INVALID"), false);
  });
});
