"use client";

import { useEffect, useState } from "react";
import { Wallet, Copy, ExternalLink, RefreshCw, CheckCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WalletInfo {
  publicKey: string;
  isActivated: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async () => {
    try {
      // Fetch wallet info
      const walletResponse = await fetch("http://localhost:3001/api/wallet/me", {
        credentials: "include",
      });
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData);
      }

      // Fetch balance
      const balanceResponse = await fetch("http://localhost:3001/api/wallet/balance", {
        credentials: "include",
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.balance);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
    toast.success("Wallet data refreshed");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const openInExplorer = () => {
    if (wallet) {
      window.open(`https://explorer.solana.com/address/${wallet.publicKey}`, "_blank");
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="relative py-32">
      <div className="container pt-[140px]">
        <div className="text-center">
          <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-semibold lg:mb-7 lg:text-7xl">
            Your Solana Wallet
          </h1>
          <p className="text-muted-foreground mx-auto max-w-3xl lg:text-xl">
            Automatically funded and ready for
            <span className="text-primary relative top-[5px] mx-2 inline-flex font-medium md:top-[3px]">
              <Brain className="mr-1 w-5" />
              Complex
            </span>
            transactions on Solana mainnet
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button onClick={refreshData} disabled={refreshing} size="lg">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Refreshing..." : "Refresh Balance"}
            </Button>
            {wallet && (
              <Button onClick={openInExplorer} size="lg" variant="ghost">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            )}
          </div>
        </div>

        {wallet && (
          <div className="mt-16 max-w-4xl mx-auto space-y-8">
            {/* Balance Display */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground">Current Balance</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl lg:text-8xl font-bold text-primary">
                    {balance.toFixed(6)}
                  </span>
                  <span className="text-2xl lg:text-3xl text-muted-foreground">SOL</span>
                </div>
                <p className="text-muted-foreground">
                  ≈ ${(balance * 150).toFixed(2)} USD
                </p>
              </div>
              
              <div className="flex justify-center">
                <Badge variant="default">
                  <CheckCircle className="mr-1 w-3 h-3" />
                  Activated & Ready
                </Badge>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Wallet Address</h2>
              <div className="max-w-2xl mx-auto p-4 bg-muted rounded-lg border">
                <code className="text-sm font-mono break-all text-foreground">
                  {wallet.publicKey}
                </code>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => copyToClipboard(wallet.publicKey)}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </Button>
              </div>
            </div>

            {/* Auto-Funding Info */}
            <div className="text-center space-y-6 mt-16">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Auto-Funding Complete</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  🎉 Your wallet was automatically funded with <strong>0.001 SOL</strong> upon account creation!
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                  <h3 className="font-medium">Instant Funding</h3>
                  <p className="text-sm text-muted-foreground">No manual deposits required</p>
                </div>
                <div className="text-center space-y-2">
                  <Wallet className="h-12 w-12 mx-auto text-primary" />
                  <h3 className="font-medium">Ready to Use</h3>
                  <p className="text-sm text-muted-foreground">Start transacting immediately</p>
                </div>
                <div className="text-center space-y-2">
                  <Brain className="h-12 w-12 mx-auto text-primary" />
                  <h3 className="font-medium">Mainnet Live</h3>
                  <p className="text-sm text-muted-foreground">Real SOL, real network</p>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Wallet created on {new Date(wallet.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
