"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { MessagesSquare, Smartphone, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScreenHeader, LoadingPanel } from "@/components/dashboard/screen-kit";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { api } from "../../../convex/_generated/api";

type Platform = "whatsapp" | "instagram" | "facebook";

interface ChannelConfig {
  id: Platform;
  name: string;
  description: string;
  icon: typeof MessagesSquare;
  fields: { name: string; label: string; placeholder: string; type?: string }[];
}

const CHANNELS: ChannelConfig[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Connect your WhatsApp Business account to handle customer inquiries directly.",
    icon: Smartphone, // Using Smartphone as fallback for WhatsApp if icon doesn't exist
    fields: [
      { name: "phoneNumberId", label: "Phone Number ID", placeholder: "e.g. 1029384756" },
      { name: "accessToken", label: "System User Access Token", placeholder: "EAAP...", type: "password" },
      { name: "webhookVerifyToken", label: "Webhook Verify Token", placeholder: "Your custom verify token" }
    ]
  },
  {
    id: "instagram",
    name: "Instagram Direct",
    description: "Reply to Instagram DMs and story replies automatically.",
    icon: MessageCircle,
    fields: [
      { name: "pageId", label: "Instagram Account ID", placeholder: "e.g. 17841400000000000" },
      { name: "accessToken", label: "Page Access Token", placeholder: "EAAP...", type: "password" }
    ]
  },
  {
    id: "facebook",
    name: "Facebook Messenger",
    description: "Connect your Facebook Page to manage Messenger conversations.",
    icon: Share2,
    fields: [
      { name: "pageId", label: "Facebook Page ID", placeholder: "e.g. 100000000000000" },
      { name: "accessToken", label: "Page Access Token", placeholder: "EAAP...", type: "password" }
    ]
  }
];

export function ChannelsScreen() {
  const { organization } = useWorkspace();
  const integrations = useQuery(api.channels.getIntegrations, organization ? {} : "skip");
  const saveIntegration = useMutation(api.channels.saveIntegration);

  const [saving, setSaving] = useState<Platform | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (platform: Platform, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [`${platform}_${field}`]: value,
    }));
  };

  const getFieldValue = (platform: Platform, field: string, settingsStr?: string) => {
    // If user has typed something, use it
    if (formData[`${platform}_${field}`] !== undefined) {
      return formData[`${platform}_${field}`];
    }
    // Otherwise parse from saved settings
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        return settings[field] || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  };

  const handleSave = async (platform: Platform, fields: ChannelConfig["fields"]) => {
    setSaving(platform);
    
    try {
      const integration = integrations?.find(i => i.platform === platform);
      const currentSettings = integration?.settings ? JSON.parse(integration.settings) : {};
      
      const newSettings = { ...currentSettings };
      let hasAllFields = true;
      let hasAnyField = false;
      
      fields.forEach(f => {
        const val = getFieldValue(platform, f.name, integration?.settings);
        if (!val) hasAllFields = false;
        if (val) hasAnyField = true;
        newSettings[f.name] = val;
      });

      if (!hasAllFields && hasAnyField) {
        toast.error("Please fill all fields to connect, or clear all to disconnect.");
        setSaving(null);
        return;
      }

      if (!hasAnyField) {
         await saveIntegration({
           platform,
           status: "disconnected",
           settings: JSON.stringify({}),
         });
         toast.success(`${CHANNELS.find(c => c.id === platform)?.name} disconnected`);
         setSaving(null);
         return;
      }

      await saveIntegration({
        platform,
        status: "connected",
        settings: JSON.stringify(newSettings),
      });

      toast.success(`${CHANNELS.find(c => c.id === platform)?.name} settings saved and connected!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save integration settings");
    } finally {
      setSaving(null);
    }
  };

  if (integrations === undefined) {
    return (
      <div className="mx-auto max-w-5xl">
        <ScreenHeader
          eyebrow="Integrations"
          title="Channels"
          description="Connect your AI agent to external messaging platforms."
        />
        <LoadingPanel rows={3} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader
        eyebrow="Integrations"
        title="Channels"
        description="Connect your AI agent to external messaging platforms."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CHANNELS.map((channel) => {
          const integration = integrations?.find((i) => i.platform === channel.id);
          const isConnected = integration?.status === "connected";

          return (
            <Card key={channel.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <channel.icon className="size-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </div>
                  )}
                </div>
                <CardDescription className="pt-2">
                  {channel.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {channel.fields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={`${channel.id}-${field.name}`} className="text-xs">
                      {field.label}
                    </Label>
                    <Input
                      id={`${channel.id}-${field.name}`}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={getFieldValue(channel.id, field.name, integration?.settings)}
                      onChange={(e) => handleInputChange(channel.id, field.name, e.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/50 mt-auto">
                <Button 
                  className="w-full" 
                  disabled={saving === channel.id}
                  onClick={() => handleSave(channel.id, channel.fields)}
                >
                  {saving === channel.id ? "Saving..." : "Save Connection"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
