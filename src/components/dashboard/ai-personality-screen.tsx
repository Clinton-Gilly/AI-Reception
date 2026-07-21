"use client";

import { useQuery, useMutation } from "convex/react";
import { Brain, Languages, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScreenHeader, LoadingPanel } from "@/components/dashboard/screen-kit";
import { dashboardApi } from "@/components/dashboard/data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function AiPersonalityScreen() {
  const { organization } = useWorkspace();
  const settings = useQuery(
    dashboardApi.ecommerceSettings.getSettings,
    organization ? { organizationId: organization._id } : "skip"
  );
  const updateSettings = useMutation(dashboardApi.ecommerceSettings.updateSettings);

  if (!settings || !organization) {
    return (
      <>
        <ScreenHeader
          eyebrow="Experience configuration"
          title="AI Personality"
          description="Configure how your AI receptionist interacts with customers."
        />
        <LoadingPanel rows={4} />
      </>
    );
  }

  const handleUpdate = (updates: Partial<typeof settings>) => {
    if (!organization) return;
    void updateSettings({
      organizationId: organization._id,
      bargainingStyle: settings.bargainingStyle,
      maxDiscountPercentage: settings.maxDiscountPercentage,
      languageEnglish: settings.languageEnglish,
      languageKiswahili: settings.languageKiswahili,
      languageSheng: settings.languageSheng,
      ...updates,
    });
  };

  return (
    <>
      <ScreenHeader
        eyebrow="Experience configuration"
        title="AI Personality"
        description="Configure how your AI receptionist negotiates and the languages it speaks."
      />

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="border-b border-black/8 pb-4">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-primary" />
              <CardTitle className="font-heading text-xl tracking-tight">
                Bargaining Style
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Should the AI allow customers to negotiate prices?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <RadioGroup
              value={settings.bargainingStyle}
              onValueChange={(value) => handleUpdate({ bargainingStyle: value as any })}
              className="grid gap-4"
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-black/5">
                <RadioGroupItem value="strict" id="strict" className="mt-1" />
                <Label htmlFor="strict" className="cursor-pointer space-y-1 font-normal">
                  <span className="block font-medium">Strict (Fixed Price)</span>
                  <span className="block text-xs text-muted-foreground">
                    The AI will not offer any discounts and will stick to the listed price.
                  </span>
                </Label>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-black/5">
                <RadioGroupItem value="lenient" id="lenient" className="mt-1" />
                <Label htmlFor="lenient" className="cursor-pointer space-y-1 font-normal">
                  <span className="block font-medium">Lenient (Negotiable)</span>
                  <span className="block text-xs text-muted-foreground">
                    The AI can offer discounts up to a maximum percentage to close the sale.
                  </span>
                </Label>
              </div>
            </RadioGroup>

            {settings.bargainingStyle === "lenient" && (
              <div className="space-y-3 rounded-lg bg-black/5 p-4">
                <Label className="text-sm font-medium">Maximum Discount Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="w-24 bg-white"
                    value={settings.maxDiscountPercentage}
                    onChange={(e) => handleUpdate({ maxDiscountPercentage: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  The AI will start high and can negotiate down to this maximum discount.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="border-b border-black/8 pb-4">
            <div className="flex items-center gap-2">
              <Languages className="size-4 text-primary" />
              <CardTitle className="font-heading text-xl tracking-tight">
                Language & Slang
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Enable local languages and slang for the AI to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label className="font-medium">English</Label>
                <p className="text-xs text-muted-foreground">
                  Standard business English (always enabled).
                </p>
              </div>
              <Switch checked={settings.languageEnglish} disabled />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label className="font-medium">Kiswahili</Label>
                <p className="text-xs text-muted-foreground">
                  Allow the AI to speak and understand standard Kiswahili.
                </p>
              </div>
              <Switch
                checked={settings.languageKiswahili}
                onCheckedChange={(checked) => handleUpdate({ languageKiswahili: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label className="font-medium">Sheng</Label>
                <p className="text-xs text-muted-foreground">
                  Enable Nairobi street slang (Sheng) for a more casual local feel.
                </p>
              </div>
              <Switch
                checked={settings.languageSheng}
                onCheckedChange={(checked) => handleUpdate({ languageSheng: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
