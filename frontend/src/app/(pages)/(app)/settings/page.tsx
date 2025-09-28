"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Shield, 
  Bell, 
  Smartphone, 
  Globe, 
  Moon, 
  Sun, 
  Monitor,
  Save,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("system");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [walletInfo, setWalletInfo] = useState<any>(null);

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/wallet/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setWalletInfo(data);
        }
      } catch (error) {
        console.error("Error fetching wallet info:", error);
      }
    };

    fetchWalletInfo();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and wallet preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your wallet security and backup information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg border">
                  <code className="text-sm font-mono break-all">
                    {walletInfo?.publicKey || "Loading..."}
                  </code>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(walletInfo?.publicKey || "", "Wallet address")}
                  disabled={!walletInfo}
                >
                  Copy
                </Button>
              </div>
            </div>



          </CardContent>
        </Card>

        {/* App Preferences */}
        <div className="space-y-6">
          {/* Wallet Status */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Network</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Mainnet
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant="default">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Created</span>
                <span className="text-sm text-muted-foreground">
                  {walletInfo ? new Date(walletInfo.createdAt).toLocaleDateString() : "Loading..."}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
