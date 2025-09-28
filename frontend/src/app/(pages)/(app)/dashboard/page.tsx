"use client";

import { useEffect, useState } from "react";
import { Wallet, Copy, ExternalLink, RefreshCw, CheckCircle, Brain, ArrowUpDown, Zap, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface WalletInfo {
  publicKey: string;
  isActivated: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenBalance {
  symbol: string;
  balance: number;
  usdValue?: number;
}

interface SavedWallet {
  id: string;
  label: string;
  address: string;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [portfolio, setPortfolio] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [sendModal, setSendModal] = useState<{
    open: boolean;
    walletId: string;
    label: string;
    address: string;
    token: "SOL" | "USDC";
  } | null>(null);
  const [sendAmount, setSendAmount] = useState("");

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

      // Fetch portfolio balances with error handling
      try {
        const balancesResponse = await fetch("http://localhost:3001/api/wallet/balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            tokens: ["SOL", "USDC", "USDT", "BONK", "WIF", "JUP", "FARTCOIN"] 
          })
        });

        if (balancesResponse.ok) {
          const data = await balancesResponse.json();
          const balances = data.balances || {};
          
          // Simple USD estimates (you'd want real price data in production)
          const priceEstimates = {
            SOL: 150,
            USDC: 1,
            USDT: 1,
            BONK: 0.00001,
            WIF: 2.5,
            JUP: 0.8,
            FARTCOIN: 0.5
          };

          const portfolioData = Object.entries(balances)
            .filter(([_, balance]) => (balance as number) > 0)
            .map(([symbol, balance]) => ({
              symbol,
              balance: balance as number,
              usdValue: (balance as number) * (priceEstimates[symbol as keyof typeof priceEstimates] || 0)
            }))
            .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));

          setPortfolio(portfolioData);
          setTotalValue(portfolioData.reduce((sum, token) => sum + (token.usdValue || 0), 0));
        } else {
          console.error("Failed to fetch balances:", balancesResponse.status);
          // Fallback: just show SOL balance
          setPortfolio([{ symbol: "SOL", balance: 0.001, usdValue: 0.15 }]);
          setTotalValue(0.15);
        }
      } catch (balanceError) {
        console.error("Error fetching portfolio balances:", balanceError);
        // Fallback: minimal portfolio view
        setPortfolio([{ symbol: "SOL", balance: 0.001, usdValue: 0.15 }]);
        setTotalValue(0.15);
      }

      // Fetch saved wallets
      try {
        const savedResponse = await fetch("http://localhost:3001/api/wallet/saved-wallets", {
          credentials: "include",
        });
        if (savedResponse.ok) {
          const data = await savedResponse.json();
          setSavedWallets(data.wallets || []);
        }
      } catch (error) {
        console.error("Error fetching saved wallets:", error);
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

  const addSavedWallet = async () => {
    if (!newWalletLabel.trim() || !newWalletAddress.trim()) {
      toast.error("Please fill in both label and address");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/wallet/saved-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          label: newWalletLabel,
          address: newWalletAddress
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSavedWallets(prev => [...prev, data.wallet]);
        setNewWalletLabel("");
        setNewWalletAddress("");
        setShowAddWallet(false);
        toast.success("Wallet address saved!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save wallet");
      }
    } catch (error) {
      console.error("Error saving wallet:", error);
      toast.error("Failed to save wallet");
    }
  };

  const openSendModal = (walletId: string, label: string, address: string, token: "SOL" | "USDC") => {
    setSendModal({ open: true, walletId, label, address, token });
    setSendAmount("");
  };

  const closeSendModal = () => {
    setSendModal(null);
    setSendAmount("");
  };

  const setMaxAmount = () => {
    if (!sendModal) return;
    
    const tokenBalance = portfolio.find(p => p.symbol === sendModal.token)?.balance || 0;
    // Keep a small amount for fees if sending SOL
    const maxAmount = sendModal.token === "SOL" ? Math.max(0, tokenBalance - 0.001) : tokenBalance;
    setSendAmount(maxAmount.toString());
  };

  const executeSend = async () => {
    if (!sendModal || !sendAmount) return;
    
    const amount = parseFloat(sendAmount);
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const tokenBalance = portfolio.find(p => p.symbol === sendModal.token)?.balance || 0;
    const maxAmount = sendModal.token === "SOL" ? tokenBalance - 0.001 : tokenBalance;
    
    if (amount > maxAmount) {
      toast.error(`Insufficient ${sendModal.token} balance`);
      return;
    }

    setSending(true);
    try {
      const response = await fetch("http://localhost:3001/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          toAddress: sendModal.address,
          amount,
          token: sendModal.token
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`Sent ${amount} ${sendModal.token} to ${sendModal.label}`);
          fetchWalletData(); // Refresh balances
          closeSendModal();
        } else {
          toast.error("Transfer failed");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Transfer failed");
      }
    } catch (error) {
      console.error(`Error sending ${sendModal.token}:`, error);
      toast.error("Transfer failed");
    } finally {
      setSending(false);
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
      <div className="container">
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
            {/* Portfolio Overview */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground">Total Portfolio Value</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl lg:text-8xl font-bold text-primary">
                    ${totalValue.toFixed(2)}
                  </span>
                  <span className="text-2xl lg:text-3xl text-muted-foreground">USD</span>
                </div>
                <p className="text-muted-foreground">
                  {portfolio.length} tokens • {portfolio.reduce((sum, token) => sum + token.balance, 0).toFixed(6)} total balance
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <Badge variant="default">
                  <CheckCircle className="mr-1 w-3 h-3" />
                  Activated & Ready
                </Badge>
                <Link href="/swap">
                  <Button size="sm">
                    <ArrowUpDown className="mr-1 w-4 h-4" />
                    Swap Tokens
                  </Button>
                </Link>
              </div>
            </div>

            {/* Token Holdings */}
            {portfolio.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-center">Your Holdings</h2>
                <div className="grid gap-3">
                  {portfolio.map((token) => (
                    <div key={token.symbol} className="flex items-center justify-between p-4 bg-muted rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {token.balance.toFixed(6)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${token.usdValue?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/swap?from=SOL&to=USDC">
                  <Button variant="outline" className="w-full">
                    SOL → USDC
                  </Button>
                </Link>
                <Link href="/swap?from=SOL&to=BONK">
                  <Button variant="outline" className="w-full">
                    SOL → BONK
                  </Button>
                </Link>
                <Link href="/swap?from=SOL&to=FARTCOIN">
                  <Button variant="outline" className="w-full">
                    SOL → FARTCOIN
                  </Button>
                </Link>
                <Link href="/swap">
                  <Button variant="outline" className="w-full">
                    <ArrowUpDown className="mr-2 w-4 h-4" />
                    Custom Swap
                  </Button>
                </Link>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">SOL Wallet Address</h2>
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

            {/* Saved Wallets */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Saved Wallets</h2>
                <Button 
                  onClick={() => setShowAddWallet(!showAddWallet)}
                  size="sm"
                  disabled={savedWallets.length >= 4}
                >
                  <Plus className="mr-1 w-4 h-4" />
                  Add Wallet
                </Button>
              </div>

              {showAddWallet && (
                <div className="p-4 bg-muted rounded-lg border space-y-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. My Personal Wallet)"
                    value={newWalletLabel}
                    onChange={(e) => setNewWalletLabel(e.target.value)}
                    className="w-full bg-background border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Solana wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    className="w-full bg-background border rounded px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button onClick={addSavedWallet} size="sm">
                      Save Wallet
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowAddWallet(false);
                        setNewWalletLabel("");
                        setNewWalletAddress("");
                      }}
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {savedWallets.length > 0 ? (
                <div className="grid gap-3">
                  {savedWallets.map((savedWallet) => {
                    const solBalance = portfolio.find(p => p.symbol === "SOL")?.balance || 0;
                    const usdcBalance = portfolio.find(p => p.symbol === "USDC")?.balance || 0;
                    const canSendSOL = solBalance > 0.001; // Keep 0.001 SOL for fees
                    const canSendUSDC = usdcBalance > 0;
                    
                    return (
                      <div key={savedWallet.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border">
                        <div>
                          <div className="font-medium">{savedWallet.label}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {savedWallet.address.slice(0, 8)}...{savedWallet.address.slice(-8)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openSendModal(savedWallet.id, savedWallet.label, savedWallet.address, "SOL")}
                            disabled={!canSendSOL}
                            size="sm"
                            variant="outline"
                          >
                            <Send className="mr-1 w-3 h-3" />
                            Send SOL
                          </Button>
                          <Button
                            onClick={() => openSendModal(savedWallet.id, savedWallet.label, savedWallet.address, "USDC")}
                            disabled={!canSendUSDC}
                            size="sm"
                            variant="outline"
                          >
                            <Send className="mr-1 w-3 h-3" />
                            Send USDC
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(savedWallet.address)}
                            size="sm"
                            variant="ghost"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No saved wallets yet</p>
                  <p className="text-xs">Add up to 4 wallet addresses for quick withdrawals</p>
                </div>
              )}
            </div>

            <div className="text-center">
               <div className="text-xs text-muted-foreground">
                 Wallet created on {new Date(wallet.createdAt).toLocaleDateString()}
               </div>
             </div>
          </div>
        )}

        {/* Send Modal */}
        {sendModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeSendModal}>
            <div className="bg-background rounded-lg border max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Send {sendModal.token}</h3>
                  <p className="text-sm text-muted-foreground">
                    To: {sendModal.label}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {sendModal.address.slice(0, 12)}...{sendModal.address.slice(-12)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Available Balance</span>
                    <span className="font-medium">
                      {(() => {
                        const tokenBalance = portfolio.find(p => p.symbol === sendModal.token)?.balance || 0;
                        const availableBalance = sendModal.token === "SOL" ? Math.max(0, tokenBalance - 0.001) : tokenBalance;
                        return `${availableBalance.toFixed(6)} ${sendModal.token}`;
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="0.000000"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="flex-1 bg-muted border rounded px-3 py-2 text-sm"
                      step="0.000001"
                      min="0"
                    />
                    <Button onClick={setMaxAmount} variant="outline" size="sm">
                      MAX
                    </Button>
                  </div>
                  
                  {sendModal.token === "SOL" && (
                    <p className="text-xs text-muted-foreground">
                      * 0.001 SOL reserved for transaction fees
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={executeSend} 
                    disabled={!sendAmount || parseFloat(sendAmount) <= 0 || sending}
                    className="flex-1"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send {sendModal.token}
                      </>
                    )}
                  </Button>
                  <Button onClick={closeSendModal} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
