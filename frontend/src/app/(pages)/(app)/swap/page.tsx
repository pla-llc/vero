"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, RefreshCw, Zap, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Token {
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: number;
  address?: string;
}

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpactPct: string;
}

const PRESET_SWAPS = [
  { from: "SOL", to: "USDC", label: "SOL → USDC" },
  { from: "USDC", to: "SOL", label: "USDC → SOL" },
  { from: "SOL", to: "BONK", label: "SOL → BONK" },
  { from: "SOL", to: "FARTCOIN", label: "SOL → FARTCOIN" },
];

export default function SwapPage() {
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [customTokens, setCustomTokens] = useState<Record<string, Token>>({});
  const [fromToken, setFromToken] = useState("SOL");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [customTokenInput, setCustomTokenInput] = useState("");
  const [loadingCustomToken, setLoadingCustomToken] = useState(false);

  // Handle URL parameters for quick actions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    const toParam = urlParams.get('to');
    
    if (fromParam) setFromToken(fromParam);
    if (toParam) setToToken(toParam);
  }, []);

  // Fetch available tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/wallet/tokens", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setTokens(data.metadata);
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchTokens();
  }, []);

  // Fetch token balances efficiently
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const allTokens = { ...tokens, ...customTokens };
        const tokenList = Object.keys(allTokens).slice(0, 5); // Limit to avoid rate limits
        
        const response = await fetch("http://localhost:3001/api/wallet/balances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tokens: tokenList })
        });

        if (response.ok) {
          const data = await response.json();
          setBalances(data.balances);
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
        // Fallback to individual requests for priority tokens
        const priorityTokens = ["SOL", "USDC", "BONK"];
        for (const token of priorityTokens) {
          try {
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
            const response = await fetch(`http://localhost:3001/api/wallet/balance/${token}`, {
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              setBalances(prev => ({ ...prev, [token]: data.balance }));
            }
          } catch (tokenError) {
            console.error(`Error fetching ${token} balance:`, tokenError);
          }
        }
      }
    };

    if (Object.keys(tokens).length > 0) {
      fetchBalances();
    }
  }, [tokens, customTokens]);

  // Get quote when amount or tokens change
  useEffect(() => {
    const getQuote = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setQuote(null);
        return;
      }

      setLoading(true);
      try {
        const allTokens = { ...tokens, ...customTokens };
        const fromTokenData = allTokens[fromToken];
        const toTokenData = allTokens[toToken];

        const response = await fetch("http://localhost:3001/api/wallet/swap/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            inputToken: fromToken === "SOL" ? "SOL" : (fromTokenData?.address || fromToken),
            outputToken: toToken === "SOL" ? "SOL" : (toTokenData?.address || toToken),
            amount: Math.floor(parseFloat(amount) * Math.pow(10, fromTokenData?.decimals || 9)),
            slippage: 50
          })
        });

        if (response.ok) {
          const data = await response.json();
          setQuote(data);
        } else {
          setQuote(null);
        }
      } catch (error) {
        console.error("Error getting quote:", error);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(getQuote, 800);
    return () => clearTimeout(debounceTimer);
  }, [amount, fromToken, toToken, tokens, customTokens]);

  const addCustomToken = async () => {
    if (!customTokenInput.trim()) return;

    setLoadingCustomToken(true);
    try {
      const response = await fetch(`http://localhost:3001/api/wallet/token/${customTokenInput}`, {
        credentials: "include",
      });

      if (response.ok) {
        const tokenData = await response.json();
        const customToken = {
          ...tokenData,
          address: customTokenInput
        };
        
        setCustomTokens(prev => ({
          ...prev,
          [tokenData.symbol]: customToken
        }));
        
        setCustomTokenInput("");
        toast.success(`Added ${tokenData.symbol} (${tokenData.name})`);
      } else {
        toast.error("Token not found or invalid address");
      }
    } catch (error) {
      console.error("Error adding custom token:", error);
      toast.error("Failed to add custom token");
    } finally {
      setLoadingCustomToken(false);
    }
  };

  const executeSwap = async () => {
    if (!quote || !amount) return;

    setSwapping(true);
    try {
      const allTokens = { ...tokens, ...customTokens };
      const fromTokenData = allTokens[fromToken];
      const toTokenData = allTokens[toToken];

      const response = await fetch("http://localhost:3001/api/wallet/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          inputToken: fromToken === "SOL" ? "SOL" : (fromTokenData?.address || fromToken),
          outputToken: toToken === "SOL" ? "SOL" : (toTokenData?.address || toToken),
          amount: Math.floor(parseFloat(amount) * Math.pow(10, fromTokenData?.decimals || 9)),
          slippage: 50
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`Swap successful! Tx: ${result.signature.slice(0, 8)}...`);
          setAmount("");
          setQuote(null);
          // Refresh balances after successful swap
          setTimeout(() => window.location.reload(), 2000);
        } else {
          toast.error("Swap failed");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Swap failed");
      }
    } catch (error) {
      console.error("Error executing swap:", error);
      toast.error("Swap failed");
    } finally {
      setSwapping(false);
    }
  };

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const setPresetSwap = (preset: typeof PRESET_SWAPS[0]) => {
    setFromToken(preset.from);
    setToToken(preset.to);
  };

  const setMaxAmount = () => {
    const balance = balances[fromToken];
    if (balance) {
      setAmount(balance.toString());
    }
  };

  const allTokens = { ...tokens, ...customTokens };

  return (
    <section className="relative py-32">
      <div className="container">
        <div className="text-center mb-12">
          <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-semibold lg:mb-7 lg:text-7xl">
            Token Swap
          </h1>
          <p className="text-muted-foreground mx-auto max-w-3xl lg:text-xl">
            Swap tokens instantly using Jupiter's best routes on Solana
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          {/* Custom Token Input */}
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium">Add Custom Token</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste token address (CA)"
                value={customTokenInput}
                onChange={(e) => setCustomTokenInput(e.target.value)}
                className="flex-1 bg-muted border rounded px-3 py-2 text-sm"
              />
              <Button
                onClick={addCustomToken}
                disabled={loadingCustomToken || !customTokenInput.trim()}
                size="sm"
              >
                {loadingCustomToken ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Preset Swaps */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Quick Swaps</h3>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SWAPS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetSwap(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Swap Interface */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">From</label>
                <span className="text-xs text-muted-foreground">
                  Balance: {balances[fromToken]?.toFixed(6) || "0"} {fromToken}
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-muted border rounded px-3 py-2 text-sm min-w-[120px]"
                >
                  {Object.entries(allTokens).map(([symbol, token]) => (
                    <option key={symbol} value={symbol}>
                      {symbol} - {token.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-muted border rounded px-3 py-2 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setMaxAmount}
                  className="text-xs"
                >
                  MAX
                </Button>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={swapTokens}
                className="rounded-full p-2"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">To</label>
                <span className="text-xs text-muted-foreground">
                  Balance: {balances[toToken]?.toFixed(6) || "0"} {toToken}
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-muted border rounded px-3 py-2 text-sm min-w-[120px]"
                >
                  {Object.entries(allTokens).map(([symbol, token]) => (
                    <option key={symbol} value={symbol}>
                      {symbol} - {token.name}
                    </option>
                  ))}
                </select>
                <div className="flex-1 bg-muted border rounded px-3 py-2 text-sm text-muted-foreground">
                  {quote ? 
                    (parseFloat(quote.outputAmount) / Math.pow(10, allTokens[toToken]?.decimals || 6)).toFixed(6)
                    : "0.0"
                  }
                </div>
              </div>
            </div>

            {/* Quote Info */}
            {quote && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-xs">
                  <span>Price Impact</span>
                  <Badge variant={parseFloat(quote.priceImpactPct) > 1 ? "destructive" : "secondary"}>
                    {parseFloat(quote.priceImpactPct).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={executeSwap}
              disabled={!quote || swapping || !amount || parseFloat(amount) <= 0}
              className="w-full"
              size="lg"
            >
              {swapping ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Swap Tokens
                </>
              )}
            </Button>
          </div>

          {/* Custom Tokens Display */}
          {Object.keys(customTokens).length > 0 && (
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-2">Custom Tokens</h3>
              <div className="space-y-1">
                {Object.entries(customTokens).map(([symbol, token]) => (
                  <div key={symbol} className="flex justify-between text-xs">
                    <span>{symbol} - {token.name}</span>
                    <span className="text-muted-foreground">
                      {token.address?.slice(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
