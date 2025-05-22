import { ActionProvider, EvmWalletProvider, Network, CreateAction, WalletProvider } from "@coinbase/agentkit";
import { z } from "zod";
import deployedContracts from "~~/contracts/deployedContracts";
import { Hex } from "viem";
import { encodeFunctionData } from "viem";
class ContractInteractor extends ActionProvider<WalletProvider> {
    private chainId: keyof typeof deployedContracts;

    private static readonly SCHEMA = z.object({
        contractName: z.string(),
        functionName: z.string().describe("The name of the function to call"),
        functionArgs: z.array(z.string()).describe("The arguments to pass to the function"),
        value: z.string().optional().describe("The value to send with the transaction, in wei"),
    });

    private static readonly BASE_RESULT = z.object({
        contractName: z.string(),
        functionName: z.string(),
        error: z.string().optional(),
    });

    private static readonly READ_RESULT = ContractInteractor.BASE_RESULT.extend({
        result: z.unknown(),
    });

    private static readonly WRITE_RESULT = ContractInteractor.BASE_RESULT.extend({
        hash: z.string().optional(),
    });

    constructor(chainId: keyof typeof deployedContracts) {
        super("contract-interactor", []);
        this.chainId = chainId;
    }

    private createBaseResponse(args: z.infer<typeof ContractInteractor.SCHEMA>) {
        return {
            contractName: args.contractName,
            functionName: args.functionName,
        };
    }

    private createErrorResponse(args: z.infer<typeof ContractInteractor.SCHEMA>, error: string) {
        return {
            ...this.createBaseResponse(args),
            error,
        };
    }

    private validateContract(args: z.infer<typeof ContractInteractor.SCHEMA>) {
        if (!Object.keys(deployedContracts[this.chainId]).includes(args.contractName)) {
            return this.createErrorResponse(
                args,
                `Invalid contract name. Available: ${Object.keys(deployedContracts[this.chainId]).join(", ")}`
            );
        }
        const contract = deployedContracts[this.chainId][args.contractName as keyof typeof deployedContracts[keyof typeof deployedContracts]];
        if (!contract) {
            return this.createErrorResponse(args, "Contract not found");
        }
        return contract;
    }

    @CreateAction({
        name: "read-contract",
        description: "Call a read-only function on a contract",
        schema: ContractInteractor.SCHEMA,
    })
    async readContract(walletProvider: EvmWalletProvider, args: z.infer<typeof ContractInteractor.SCHEMA>): Promise<string> {
        try {
            const contract = this.validateContract(args);
            if ('error' in contract) return contract.error;

            const result = await walletProvider.readContract({
                address: contract.address,
                abi: contract.abi,
                functionName: args.functionName,
                args: args.functionArgs,
            });

            return `Result of ${args.functionName} on ${args.contractName}: ${result}`;
        } catch (error) {
            return `Error: ${String(error)}`;
        }
    }

    @CreateAction({
        name: "write-contract",
        description: "Call a write function on a contract",
        schema: ContractInteractor.SCHEMA,
    })
    async writeContract(walletProvider: EvmWalletProvider, args: z.infer<typeof ContractInteractor.SCHEMA>) {
        try {
            const contract = this.validateContract(args);
            if ('error' in contract) return contract;

            const hash = await walletProvider.sendTransaction({
                to: contract.address as Hex,
                data: encodeFunctionData({
                    abi: contract.abi,
                    functionName: args.functionName as keyof typeof contract.abi.entries,
                    args: [args.functionArgs],
                }),
                value: args.value ? BigInt(args.value) : undefined,
            });

            return { ...this.createBaseResponse(args), hash };
        } catch (error) {
            return this.createErrorResponse(args, String(error));
        }
    }

    // eslint-disable-next-line
    supportsNetwork = (network: Network) => network.chainId === String(this.chainId);
}

export const contractInteractor = (chainId: keyof typeof deployedContracts) => new ContractInteractor(chainId);