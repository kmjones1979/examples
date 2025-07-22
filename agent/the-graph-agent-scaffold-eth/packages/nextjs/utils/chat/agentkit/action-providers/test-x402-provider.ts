import {
  X402Config,
  X402PaymentHandler,
  getDefaultX402Config,
  parsePaymentInstructions,
  retryWithPayment,
} from "../x402";
import { ActionProvider, WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";

const testX402Schema = z.object({
  shouldRequirePayment: z.boolean().default(true),
  amount: z.string().default("0.01"),
});

export class TestX402Provider extends ActionProvider<WalletProvider> {
  name = "test-x402";
  actionProviders = [];
  supportsNetwork = () => true;
  private x402Config: X402Config;

  constructor(x402Config?: Partial<X402Config>) {
    super("test-x402", []);
    this.x402Config = {
      ...getDefaultX402Config(),
      ...x402Config,
      skipValidation: true, // Enable skipValidation for testing
    };
  }

  getActions(walletProvider: WalletProvider) {
    return [
      {
        name: "testX402Payment",
        description: "Test x402 payment integration by simulating a payment-required scenario",
        schema: testX402Schema as any,
        invoke: async ({ shouldRequirePayment, amount }: any) => {
          try {
            console.log("🧪 Testing x402 payment integration...");

            if (!shouldRequirePayment) {
              return JSON.stringify({
                success: true,
                message: "No payment required for this test",
                x402Enabled: this.x402Config.enabled,
              });
            }

            // Simulate a function that requires payment
            const testFunction = async (args: any) => {
              console.log("🔍 Simulating function that requires payment...");

              // Simulate a 402 Payment Required error
              const error = new Error("Payment Required");
              (error as any).status = 402;
              (error as any).response = {
                headers: {
                  "x-payment-method": "exact",
                  "x-payment-token": this.x402Config.usdcContract,
                  "x-payment-amount": amount,
                  "x-payment-recipient": this.x402Config.walletAddress,
                  "x-payment-nonce": Math.floor(Date.now() / 1000).toString(),
                  "x-payment-deadline": (Math.floor(Date.now() / 1000) + 3600).toString(),
                },
                data: {
                  error: "Payment Required",
                  instructions: {
                    method: "exact",
                    token: this.x402Config.usdcContract,
                    amount: amount,
                    recipient: this.x402Config.walletAddress,
                    nonce: Math.floor(Date.now() / 1000).toString(),
                    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
                  },
                },
              };

              throw error;
            };

            // Test the payment flow
            try {
              await testFunction({ test: true });
            } catch (error: any) {
              if (error.status === 402 || error.message?.includes("Payment Required")) {
                console.log("🤖 Agent handling x402 payment for test function");

                if (!this.x402Config.enabled) {
                  throw new Error("Payment required but x402 is not enabled");
                }

                try {
                  const paymentInstructions = parsePaymentInstructions(error);
                  const paymentHandler = new X402PaymentHandler(this.x402Config, walletProvider);
                  const paymentPayload = await paymentHandler.handlePaymentRequired(paymentInstructions);

                  // Simulate successful payment and retry
                  const result = await retryWithPayment(testFunction, { test: true }, paymentPayload);

                  return JSON.stringify({
                    success: true,
                    message: "x402 payment processed successfully",
                    paymentPayload,
                    result: "Payment successful, function executed",
                    x402Config: {
                      enabled: this.x402Config.enabled,
                      network: this.x402Config.network,
                      walletAddress: this.x402Config.walletAddress,
                    },
                  });
                } catch (paymentError) {
                  console.error("❌ Agent failed to process x402 payment:", paymentError);
                  return JSON.stringify({
                    success: false,
                    error: `Payment failed: ${paymentError instanceof Error ? paymentError.message : "Unknown error"}`,
                    x402Config: {
                      enabled: this.x402Config.enabled,
                      network: this.x402Config.network,
                      walletAddress: this.x402Config.walletAddress,
                    },
                  });
                }
              }
              throw error;
            }
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error occurred",
            });
          }
        },
      },
      {
        name: "testX402WithEndpoint",
        description: "Test x402 payment with a real endpoint that always returns 402",
        schema: z.object({}) as any,
        invoke: async () => {
          try {
            console.log("🧪 Testing x402 payment with real endpoint...");

            // Function that calls the test endpoint
            const testEndpointFunction = async () => {
              const response = await fetch("http://localhost:3000/api/test-x402", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              });

              if (response.status === 402) {
                const error = new Error("Payment Required");
                (error as any).status = 402;
                (error as any).response = response;
                throw error;
              }

              return await response.json();
            };

            // Test the payment flow
            try {
              await testEndpointFunction();
            } catch (error: any) {
              if (error.status === 402) {
                console.log("🤖 Agent handling x402 payment for endpoint test");

                if (!this.x402Config.enabled) {
                  throw new Error("Payment required but x402 is not enabled");
                }

                try {
                  const paymentInstructions = parsePaymentInstructions(error);
                  const paymentHandler = new X402PaymentHandler(this.x402Config, walletProvider);
                  const paymentPayload = await paymentHandler.handlePaymentRequired(paymentInstructions);

                  // Retry with payment
                  const result = await retryWithPayment(testEndpointFunction, {}, paymentPayload);

                  return JSON.stringify({
                    success: true,
                    message: "x402 payment processed successfully for endpoint test",
                    paymentPayload,
                    result,
                    x402Config: {
                      enabled: this.x402Config.enabled,
                      network: this.x402Config.network,
                      walletAddress: this.x402Config.walletAddress,
                    },
                  });
                } catch (paymentError) {
                  console.error("❌ Agent failed to process x402 payment:", paymentError);
                  return JSON.stringify({
                    success: false,
                    error: `Payment failed: ${paymentError instanceof Error ? paymentError.message : "Unknown error"}`,
                    x402Config: {
                      enabled: this.x402Config.enabled,
                      network: this.x402Config.network,
                      walletAddress: this.x402Config.walletAddress,
                    },
                  });
                }
              }
              throw error;
            }
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error occurred",
            });
          }
        },
      },
    ];
  }
}

export const testX402Provider = (x402Config?: Partial<X402Config>) => new TestX402Provider(x402Config);
