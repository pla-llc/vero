import { 
  Keypair, 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Transaction, 
  SystemProgram,
  sendAndConfirmTransaction 
} from "@solana/web3.js";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import prisma from "./prisma";

// Use mainnet for all environments
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// Master wallet for funding new users
const getMasterWallet = (): Keypair | null => {
  const masterPrivateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
  if (!masterPrivateKey) {
    console.warn("MASTER_WALLET_PRIVATE_KEY not found - auto-funding disabled");
    return null;
  }
  
  try {
    const privateKeyBuffer = Buffer.from(masterPrivateKey, "base64");
    return Keypair.fromSecretKey(privateKeyBuffer);
  } catch (error) {
    console.error("Invalid master wallet private key:", error);
    return null;
  }
};

export interface WalletData {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
}

export class WalletService {
  /**
   * Generates a new Solana wallet with mnemonic phrase
   */
  static generateWallet(): WalletData {
    // Generate a 12-word mnemonic phrase
    const mnemonic = bip39.generateMnemonic();
    
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Derive the keypair using the standard Solana derivation path
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString("hex")).key;
    
    // Create the keypair from the derived seed
    const keypair = Keypair.fromSeed(derivedSeed);
    
    return {
      publicKey: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString("base64"),
      mnemonic: mnemonic,
    };
  }

  /**
   * Automatically funds a new wallet with SOL from master wallet
   */
  static async autoFundWallet(publicKeyString: string, amountSOL: number = 0.001): Promise<boolean> {
    const masterWallet = getMasterWallet();
    if (!masterWallet) {
      console.warn("Master wallet not configured - skipping auto-funding");
      return false;
    }

    try {
      const recipientPublicKey = new PublicKey(publicKeyString);
      const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

      // Create transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: masterWallet.publicKey,
          toPubkey: recipientPublicKey,
          lamports: lamports,
        })
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [masterWallet],
        {
          commitment: "confirmed",
          maxRetries: 3,
        }
      );

      console.log(`✅ Auto-funded wallet ${publicKeyString} with ${amountSOL} SOL. Signature: ${signature}`);
      return true;
    } catch (error) {
      console.error("Auto-funding failed:", error);
      return false;
    }
  }

  /**
   * Creates wallet and automatically funds it
   */
  static async createAndFundWallet(userId: string): Promise<WalletData & { funded: boolean }> {
    const walletData = this.generateWallet();
    
    // Store in database
    await prisma.wallet.create({
      data: {
        publicKey: walletData.publicKey,
        privateKey: walletData.privateKey,
        mnemonic: walletData.mnemonic,
        isActivated: false, // Will be set to true after funding
        userId: userId,
      },
    });
    
    // Attempt to auto-fund the wallet
    const funded = await this.autoFundWallet(walletData.publicKey);
    
    if (funded) {
      // Mark wallet as activated since it now has SOL
      await prisma.wallet.update({
        where: { userId },
        data: { isActivated: true }
      });
    }
    
    return { ...walletData, funded };
  }

  /**
   * Gets the SOL balance for a wallet address
   */
  static async getBalance(publicKeyString: string): Promise<number> {
    try {
      const publicKey = new PublicKey(publicKeyString);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
    } catch (error) {
      console.error("Error getting balance:", error);
      return 0;
    }
  }

  /**
   * Gets wallet balance for a user
   */
  static async getUserWalletBalance(userId: string): Promise<number> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    if (!wallet) {
      throw new Error("Wallet not found for user");
    }
    return await this.getBalance(wallet.publicKey);
  }

  /**
   * Retrieves wallet data for a user
   */
  static async getWalletForUser(userId: string) {
    return await prisma.wallet.findUnique({
      where: { userId },
    });
  }
}
