"use client";

import { CSSProperties, ReactNode, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  Package,
  Heart,
  Star,
  X,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Minus,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AgentLauncher } from "@/components/public-site/agent-launcher";
import { ElevenLabsEmbed } from "@/components/public-site/elevenlabs-embed";
import type { PublishedSite, PublicOffering } from "@/components/public-site/types";
import { CartProvider, useCart } from "@/components/public-site/cart-context";
import { WishlistProvider, useWishlist } from "@/components/public-site/wishlist-context";
import { PaymentMethodPicker, MpesaPaymentModal, type PaymentMethod } from "@/components/public-site/mpesa-payment";

function safeHttpUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function contrastColor(color: string) {
  const hex = color.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(hex)) return "#ffffff";
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 150 ? "#151713" : "#ffffff";
}

function fontFamilies(font: PublishedSite["site"]["config"]["theme"]["font"]) {
  if (font === "editorial") {
    return {
      body: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
      heading: '"Bodoni 72", Didot, "Times New Roman", serif',
    };
  }
  if (font === "friendly") {
    return {
      body: 'ui-rounded, "Avenir Next", Avenir, "Segoe UI", sans-serif',
      heading: 'ui-rounded, "Avenir Next", Avenir, "Segoe UI", sans-serif',
    };
  }
  return {
    body: '"Avenir Next", Avenir, "Helvetica Neue", sans-serif',
    heading: '"Avenir Next", Avenir, "Helvetica Neue", sans-serif',
  };
}

function tenantStyle(
  theme: PublishedSite["site"]["config"]["theme"],
): CSSProperties & Record<string, string> {
  const fonts = fontFamilies(theme.font);
  const primaryForeground = contrastColor(theme.accentColor);
  const radius =
    theme.radius === "sharp"
      ? "0.3rem"
      : theme.radius === "rounded"
        ? "1.15rem"
        : "0.7rem";

  return {
    "--background": theme.backgroundColor,
    "--foreground": theme.foregroundColor,
    "--card": `color-mix(in srgb, ${theme.backgroundColor} 94%, ${theme.foregroundColor} 6%)`,
    "--card-foreground": theme.foregroundColor,
    "--popover": theme.backgroundColor,
    "--popover-foreground": theme.foregroundColor,
    "--primary": theme.accentColor,
    "--primary-foreground": primaryForeground,
    "--secondary": `color-mix(in srgb, ${theme.backgroundColor} 88%, ${theme.mutedColor} 12%)`,
    "--secondary-foreground": theme.foregroundColor,
    "--muted": `color-mix(in srgb, ${theme.backgroundColor} 84%, ${theme.mutedColor} 16%)`,
    "--muted-foreground": theme.mutedColor,
    "--accent": theme.accentColor,
    "--accent-foreground": primaryForeground,
    "--border": `color-mix(in srgb, ${theme.foregroundColor} 14%, transparent)`,
    "--input": `color-mix(in srgb, ${theme.foregroundColor} 18%, transparent)`,
    "--ring": theme.accentColor,
    "--radius": radius,
    "--font-sans": fonts.heading,
    "--font-heading": fonts.heading,
    backgroundColor: theme.backgroundColor,
    color: theme.foregroundColor,
    colorScheme: contrastColor(theme.backgroundColor) === "#ffffff" ? "dark" : "light",
    fontFamily: fonts.body,
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPrice(offering: PublicOffering, locale: string, currency: string) {
  try {
    const offeringCurrency = offering.currency || currency;
    const fractionDigits = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: offeringCurrency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: offeringCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(offering.priceMinor / 10 ** fractionDigits);
  } catch {
    return `${offering.currency || currency} ${(offering.priceMinor / 100).toFixed(2)}`;
  }
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-3xl leading-[1.05] tracking-[-0.045em] text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SectionShell({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 border-t border-border px-5 py-20 sm:px-8 lg:px-12 lg:py-28", className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

export function EcommerceSite({
  siteSlug,
  publishedSite,
  textAgentEnabled,
  voiceAgentEnabled,
}: {
  siteSlug: string;
  publishedSite: PublishedSite;
  textAgentEnabled: boolean;
  voiceAgentEnabled: boolean;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <EcommerceInner
          siteSlug={siteSlug}
          publishedSite={publishedSite}
          textAgentEnabled={textAgentEnabled}
          voiceAgentEnabled={voiceAgentEnabled}
        />
      </WishlistProvider>
    </CartProvider>
  );
}

function EcommerceInner({
  siteSlug,
  publishedSite,
  textAgentEnabled,
  voiceAgentEnabled,
}: {
  siteSlug: string;
  publishedSite: PublishedSite;
  textAgentEnabled: boolean;
  voiceAgentEnabled: boolean;
}) {
  const { organization, site, offerings, teamMembers } = publishedSite;
  const { config } = site;
  const heroImageUrl = safeHttpUrl(config.heroImageUrl);
  const logoUrl = safeHttpUrl(config.logoUrl);
  const isCompact = config.template === "compact";
  const isGallery = config.template === "gallery";

  const textAgentIsVisible = textAgentEnabled && config.agent.showWebChat;
  const voiceAgentIsVisible = voiceAgentEnabled && config.agent.showVoiceChat;
  const elevenLabsWidgetIsVisible = voiceAgentEnabled && config.agent.showElevenLabsWidget;
  const agentIsVisible = textAgentIsVisible || voiceAgentIsVisible;
  const sectionSet = new Set(config.sections);

  const { totalItems, isCartOpen, setIsCartOpen } = useCart();

  const [trackingId, setTrackingId] = useState("");
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewProductName, setReviewProductName] = useState("");
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const trackedOrders = useQuery(
    api.publicBooking.trackOrders,
    activeTrackingId ? { siteSlug, identifier: activeTrackingId } : "skip"
  );

  const heroVisualStyle: CSSProperties = heroImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, transparent 48%, color-mix(in srgb, var(--foreground) 38%, transparent)), url(${JSON.stringify(heroImageUrl)})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : {
        backgroundImage:
          "radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--primary) 50%, transparent), transparent 30%), radial-gradient(circle at 80% 74%, color-mix(in srgb, var(--foreground) 16%, transparent), transparent 38%), linear-gradient(145deg, var(--muted), color-mix(in srgb, var(--background) 80%, var(--primary) 20%))",
      };

  function productsSection() {
    if (!sectionSet.has("offerings")) return null;
    return (
      <SectionShell id="products">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Shop"
            title="Explore our products"
            description="Find the perfect items for your needs."
          />
        </div>

        {offerings.length ? (
          <div className="mt-12 space-y-16">
            {Object.entries(
              offerings.reduce((acc, offering) => {
                const category = offering.category || "Other";
                if (!acc[category]) acc[category] = [];
                acc[category].push(offering);
                return acc;
              }, {} as Record<string, typeof offerings>)
            ).map(([category, categoryOfferings]) => (
              <div key={category}>
                <h3 className="mb-6 font-heading text-2xl tracking-tight">{category}</h3>
                <div
                  className={cn(
                    "grid gap-6",
                    isGallery ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 md:grid-cols-3",
                  )}
                >
                  {categoryOfferings.map((offering) => (
                    <ProductCard
                      key={offering._id}
                      offering={offering}
                      locale={organization.locale}
                      currency={organization.currency}
                      siteSlug={siteSlug}
                      onReview={() => {
                        setReviewProductId(offering._id);
                        setReviewProductName(offering.name);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="mt-10 bg-card/60">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              New products will be published here soon.
            </CardContent>
          </Card>
        )}
      </SectionShell>
    );
  }

  function trackingSection() {
    return (
      <SectionShell id="track-order" className="bg-muted/35">
        <div className="mx-auto max-w-2xl">
          <SectionHeading
            eyebrow="Order Tracking"
            title="Track your order"
            description="Enter your Order ID or Phone Number to check the status of your purchase."
            align="center"
          />
          <Card className="mt-8 shadow-md">
            <CardContent className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); setActiveTrackingId(trackingId); }} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Order ID or Phone Number"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="bg-background"
                />
                <Button type="submit">
                  <Search className="mr-2 size-4" /> Track
                </Button>
              </form>

              {activeTrackingId && (
                <div className="mt-8 space-y-4">
                  {trackedOrders === undefined ? (
                    <p className="text-center text-sm text-muted-foreground">Searching for orders...</p>
                  ) : trackedOrders.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No orders found for "{activeTrackingId}".</p>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-semibold">Recent Orders</h4>
                      {trackedOrders.map((order) => (
                        <div key={order._id} className="flex flex-col gap-2 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">{order.offeringName}</p>
                            <p className="text-xs text-muted-foreground">Ordered on {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{formatPrice({ priceMinor: order.priceMinor } as any, organization.locale, order.currency)}</span>
                            <Badge variant={order.status === "confirmed" ? "default" : "secondary"} className="capitalize">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SectionShell>
    );
  }

  function aboutSection() {
    if (!sectionSet.has("about") || !config.about) return null;
    return (
      <SectionShell id="about">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <SectionHeading eyebrow="About" title={`The story of ${config.businessName}`} />
          <div className="lg:border-s lg:ps-12">
            <p className="whitespace-pre-line font-heading text-2xl leading-[1.45] tracking-[-0.025em] text-balance sm:text-3xl">
              {config.about}
            </p>
          </div>
        </div>
      </SectionShell>
    );
  }

  function contactSection() {
    if (!sectionSet.has("contact")) return null;
    return (
      <SectionShell id="contact">
        <div className="overflow-hidden rounded-[calc(var(--radius)*1.8)] bg-foreground text-background">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-background/55">Contact</p>
              <h2 className="mt-4 max-w-xl font-heading text-4xl leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                Need help with your order?
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                {config.contact.email ? (
                  <Button asChild variant="outline" size="lg" className="h-11 rounded-full border-background/20 bg-transparent px-5 text-background hover:bg-background/10 hover:text-background">
                    <a href={`mailto:${config.contact.email}`}>
                      <Mail data-icon="inline-start" /> Email us
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="border-t border-background/15 bg-background/5 p-7 sm:p-10 lg:border-s lg:border-t-0 lg:p-12">
              <dl className="space-y-7 text-sm">
                {config.contact.phone ? (
                  <div className="flex gap-3">
                    <Phone className="mt-0.5 size-4 shrink-0 text-background/50" aria-hidden="true" />
                    <div>
                      <dt className="text-xs text-background/45">Phone</dt>
                      <dd className="mt-1.5">
                        <a href={`tel:${config.contact.phone}`} className="underline-offset-4 hover:underline">
                          {config.contact.phone}
                        </a>
                      </dd>
                    </div>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  const sections: Record<string, () => ReactNode> = {
    offerings: productsSection,
    about: aboutSection,
    contact: contactSection,
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground" style={tenantStyle(config.theme)}>
      {config.announcement ? (
        <div className="bg-primary px-5 py-2.5 text-center text-xs font-medium tracking-wide text-primary-foreground">
          {config.announcement}
        </div>
      ) : null}

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-5">
          <a href="#top" className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
            {logoUrl ? (
              <span
                role="img"
                aria-label={`${config.businessName} logo`}
                className="size-10 shrink-0 rounded-full border bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${JSON.stringify(logoUrl)})` }}
              />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground">
                {initials(config.businessName)}
              </span>
            )}
            <span className="truncate font-heading text-lg font-semibold tracking-[-0.02em]">
              {config.businessName}
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-xs font-medium lg:flex" aria-label="Main navigation">
            {sectionSet.has("offerings") ? <a href="#products" className="text-muted-foreground transition hover:text-foreground">Products</a> : null}
            <a href="#track-order" className="text-muted-foreground transition hover:text-foreground">Track Order</a>
            {sectionSet.has("about") ? <a href="#about" className="text-muted-foreground transition hover:text-foreground">About</a> : null}
            {sectionSet.has("contact") ? <a href="#contact" className="text-muted-foreground transition hover:text-foreground">Contact</a> : null}
          </nav>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
            aria-label="Open shopping cart"
          >
            <ShoppingCart className="size-4" />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden px-5 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute -start-40 top-10 size-96 rounded-full bg-primary/10 blur-3xl" />
          <div
            className={cn(
              "relative mx-auto grid w-full max-w-7xl items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-24",
              isCompact && "lg:grid-cols-[1.3fr_0.7fr] lg:py-16",
            )}
          >
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="rounded-full bg-background/55 px-3 py-1 text-[0.68rem] uppercase tracking-[0.15em] backdrop-blur">
                  <Package className="mr-1.5 size-3" /> Shop online now
                </Badge>
              </div>
              <h1 className={cn("mt-7 max-w-4xl font-heading text-5xl leading-[0.96] tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl", isCompact && "lg:text-6xl")}>
                {config.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {config.subheadline}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {sectionSet.has("offerings") ? (
                  <Button asChild size="lg" className="h-12 rounded-full px-6">
                    <a href="#products">Shop Collection</a>
                  </Button>
                ) : null}
                {agentIsVisible ? (
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-full bg-background/40 px-6 backdrop-blur">
                    <a href="#assistant">
                      <MessageCircle data-icon="inline-start" /> Chat to Buy
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>

            {agentIsVisible ? (
              <AgentLauncher
                siteSlug={siteSlug}
                businessName={config.businessName}
                welcomeMessage={config.agent.welcomeMessage}
                textEnabled={textAgentIsVisible}
                voiceEnabled={voiceAgentIsVisible}
                offerings={offerings}
                teamMembers={teamMembers}
                timezone={organization.timezone}
                locale={organization.locale}
              />
            ) : (
              <div
                className={cn(
                  "relative isolate min-h-[30rem] overflow-hidden rounded-[calc(var(--radius)*2.2)] border shadow-[0_35px_100px_-45px_color-mix(in_srgb,var(--foreground)_45%,transparent)] sm:min-h-[36rem]",
                  isCompact && "min-h-[22rem] sm:min-h-[26rem]",
                )}
                style={heroVisualStyle}
              />
            )}
          </div>
        </section>

        {config.sections.map((section) => {
          const RenderSection = sections[section];
          return RenderSection ? <div key={section}><RenderSection /></div> : null;
        })}

        {trackingSection()}
      </main>

      <footer className="border-t border-border px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(config.businessName)}
            </span>
            <p className="font-heading text-sm font-semibold">{config.businessName}</p>
          </div>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} {config.businessName}</span>
        </div>
      </footer>

      {elevenLabsWidgetIsVisible ? (
        <ElevenLabsEmbed
          siteSlug={siteSlug}
          businessName={config.businessName}
          primaryColor={config.theme.accentColor}
          secondaryColor={config.theme.foregroundColor}
          offerings={offerings}
          teamMembers={teamMembers}
          timezone={organization.timezone}
          locale={organization.locale}
        />
      ) : null}

      {/* Cart Drawer */}
      <CartDrawerInline siteSlug={siteSlug} />

      {/* Review Modal */}
      {reviewProductId && (
        <ReviewModal
          siteSlug={siteSlug}
          offeringId={reviewProductId as any}
          offeringName={reviewProductName}
          onClose={() => setReviewProductId(null)}
        />
      )}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function ProductCard({
  offering,
  locale,
  currency,
  siteSlug,
  onReview,
}: {
  offering: PublicOffering;
  locale: string;
  currency: string;
  siteSlug: string;
  onReview: () => void;
}) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(offering._id);
  const reviews = useQuery(api.ecommerce.getReviewsForOffering, { offeringId: offering._id as any });
  const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-background transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      {/* Wishlist Button */}
      <button
        onClick={() => toggleWishlist(offering._id)}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur transition hover:bg-background"
      >
        <Heart className={cn("size-4 transition", wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
      </button>

      {/* Image */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {offering.imageUrl ? (
          <img
            src={offering.imageUrl}
            alt={offering.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h4 className="font-heading text-base font-semibold tracking-[-0.02em]">{offering.name}</h4>

        {/* Star Ratings */}
        {reviews !== undefined && reviews.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating rating={avgRating} />
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}

        {offering.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {offering.description}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary text-lg">
              {formatPrice(offering, locale, currency)}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 rounded-full"
              onClick={() => addToCart(offering)}
            >
              <ShoppingBag className="mr-1.5 size-3.5" /> Add to Cart
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs px-3"
              onClick={onReview}
            >
              Review
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

function CartDrawerInline({ siteSlug }: { siteSlug: string }) {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPriceMinor, clearCart } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const bookOffering = useMutation(api.publicBooking.create);

  if (!isCartOpen) return null;

  const processOrder = async () => {
    setIsCheckingOut(true);
    try {
      for (const item of items) {
        await bookOffering({
          siteSlug,
          offeringId: item.offering._id,
          startAt: Date.now() + 1000 * 60 * 60 * 24, // 24h from now as placeholder
          customer: {
            name,
            email: email || undefined,
            phone: phone,
          },
          idempotencyKey: `cart-${item.offering._id}-${Date.now()}-${Math.random()}`,
          source: "public_site",
        });
      }
      setCheckoutSuccess(true);
      clearCart();
    } catch (err) {
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !name || !phone) return;

    if (paymentMethod === "mpesa") {
      setShowMpesaModal(true);
    } else {
      await processOrder();
    }
  };

  const currencySymbol = items[0]?.offering.currency || "KSH";
  const total = (totalPriceMinor / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsCartOpen(false)} />
      <div className="relative z-10 w-full max-w-md bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Your Cart
            {items.length > 0 && <Badge variant="secondary">{items.reduce((s, i) => s + i.quantity, 0)} items</Badge>}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}><X className="w-5 h-5" /></Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {checkoutSuccess ? (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-2xl font-semibold mb-2">Order Placed! 🎉</h3>
              <p className="text-muted-foreground mb-6">Thank you for your purchase. We'll be in touch soon!</p>
              <Button onClick={() => { setIsCartOpen(false); setCheckoutSuccess(false); }}>Continue Shopping</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Add some items and come back!</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.offering._id} className="flex gap-4 p-4 border border-border rounded-xl bg-card">
                {item.offering.imageUrl && (
                  <img src={item.offering.imageUrl} alt={item.offering.name} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.offering.name}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{item.offering.currency} {(item.offering.priceMinor / 100).toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.offering._id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.offering._id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                    <button className="ml-auto text-red-500 text-xs font-semibold" onClick={() => removeFromCart(item.offering._id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout */}
        {!checkoutSuccess && items.length > 0 && (
          <div className="p-6 border-t border-border bg-muted/30">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-xl text-primary">{currencySymbol} {total}</span>
            </div>
            <form onSubmit={handleCheckout} className="space-y-3">
              <Input required placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} />
              <Input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
              <Input required type="tel" placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} />
              
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Payment Method</p>
                <PaymentMethodPicker selected={paymentMethod} onSelect={setPaymentMethod} />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isCheckingOut}>
                {isCheckingOut ? "Processing..." : paymentMethod === "mpesa" ? "Pay with M-Pesa" : "Place Order"}
              </Button>
            </form>
          </div>
        )}
      </div>

      {showMpesaModal && (
        <MpesaPaymentModal
          siteSlug={siteSlug}
          phone={phone}
          amount={totalPriceMinor / 100}
          onSuccess={async (paymentId) => {
             setShowMpesaModal(false);
             await processOrder();
          }}
          onCancel={() => setShowMpesaModal(false)}
        />
      )}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  siteSlug,
  offeringId,
  offeringName,
  onClose,
}: {
  siteSlug: string;
  offeringId: string;
  offeringName: string;
  onClose: () => void;
}) {
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingReviews = useQuery(api.ecommerce.getReviewsForOffering, { offeringId: offeringId as any });
  const addReview = useMutation(api.ecommerce.addReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addReview({
        siteSlug,
        offeringId: offeringId as any,
        rating,
        comment,
        reviewerName,
      });
      setSubmitted(true);
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading font-semibold">Leave a Review</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{offeringName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">Thank you! ⭐</h3>
              <p className="text-muted-foreground">Your review has been submitted.</p>
              <Button className="mt-6" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Name</label>
                  <Input required placeholder="e.g. Jane Doe" value={reviewerName} onChange={e => setReviewerName(e.target.value)} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(null)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition",
                            star <= (hoveredStar ?? rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Your Review</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell others what you think about this product..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>

              {/* Existing reviews */}
              {existingReviews && existingReviews.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">What others are saying</h3>
                  <div className="space-y-3">
                    {existingReviews.slice(0, 5).map((r) => (
                      <div key={r._id} className="p-4 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.reviewerName}</span>
                          <StarRating rating={r.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
