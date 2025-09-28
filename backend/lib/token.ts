import MiscPlugin from "@solana-agent-kit/plugin-misc";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import {
	createVercelAITools,
	KeypairWallet,
	SolanaAgentKit,
} from "solana-agent-kit";

console.log(process.env.MASTER_WALLET_PRIVATE_KEY);
const keyPair = Keypair.fromSecretKey(
	bs58.decode(process.env.MASTER_WALLET_PRIVATE_KEY!)
);
const wallet = new KeypairWallet(
	keyPair,
	process.env.SOLANA_RPC_URL! || "https://api.mainnet-beta.solana.com"
);

const agent = new SolanaAgentKit(
	wallet,
	process.env.SOLANA_RPC_URL! || "https://api.mainnet-beta.solana.com",
	{
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
	}
).use(MiscPlugin as any);

const tools = createVercelAITools(agent, agent.actions);

export default { agent, tools };
