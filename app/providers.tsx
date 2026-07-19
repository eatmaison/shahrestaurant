"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Dictionary } from "./lib/translations";
import { DEFAULT_BRAND_CONFIGS } from "./lib/data";
import type { AccountType, BrandConfig, Lang, Order, OrderFulfillment, OrderSchedule, OrderStatus, Product, Reservation, Review, SocialLink, SocialPlatform, User, VipRequest } from "./lib/types";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within Providers");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Language                                                            */
/* ------------------------------------------------------------------ */

interface LangCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LangCtx | null>(null);

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within Providers");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Store (products, cart, auth, orders)                                */
/* ------------------------------------------------------------------ */

interface StoreCtx {
  products: Product[];
  addProduct: (p: Omit<Product, "id">) => Promise<{ ok: boolean; error?: string }>;
  removeProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id">>) => Promise<{ ok: boolean; error?: string }>;

  /** Admin-managed restaurants and their menu categories. */
  brands: BrandConfig[];
  /** Admin: add/remove restaurants and categories. `error` is a code for translation. */
  manageBrands: (
    input:
      | { action: "addBrand"; name: string }
      | { action: "removeBrand"; id: string }
      | { action: "addCategory"; brandId: string; name: string; icon: string }
      | { action: "removeCategory"; brandId: string; name: string }
        | { action: "addSubcategory"; brandId: string; categoryName: string; name: string; icon: string }
        | { action: "removeSubcategory"; brandId: string; categoryName: string; name: string }
      | { action: "setLogo"; brandId: string; logo: string }
  ) => Promise<{ ok: boolean; error?: string }>;

  cart: Record<string, number>;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  users: User[];
  currentUser: User | null;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    adminCode?: string;
    accountType?: AccountType;
    btw?: string;
    kvk?: string;
    agreementAccepted?: boolean;
  }) => Promise<{
    ok: boolean;
    error?: "emailTaken" | "wrongAdminCode" | "fillFields" | "companyFields" | "agreement";
  }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: "invalidLogin" }>;
  logout: () => Promise<void>;

  orders: Order[];
  placeOrder: (details: {
    customerName: string;
    address: string;
    postcode: string;
    phone: string;
    note?: string;
    pointsToUse?: number;
    schedule?: OrderSchedule;
    fulfillment?: OrderFulfillment;
  }) => Promise<{ ok: boolean; error?: "minOrder" | "empty" | "outsideArea" | "closed"; order?: Order; checkoutUrl?: string }>;

  /** Admin: advance an order's fulfilment status. */
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  /** Admin: mark an order's payment as received (or revert). */
  setOrderPaid: (orderId: string, paid: boolean) => Promise<void>;
  /** Admin: mark a company order's invoice as sent (or revert). */
  setInvoiceSent: (orderId: string, sent: boolean) => Promise<void>;

  buyVip: () => Promise<{ ok: boolean; checkoutUrl?: string }>;

  /** VIP card requests (photo of a physical card awaiting admin approval). */
  vipRequests: VipRequest[];
  /** Customer: submit a photo of an existing VIP card for approval. */
  requestVip: (image: string) => Promise<{ ok: boolean }>;
  /** Admin: approve a pending VIP request - activates the customer's VIP. */
  approveVipRequest: (requestId: string) => Promise<void>;
  /** Admin: reject a pending VIP request. */
  rejectVipRequest: (requestId: string) => Promise<void>;

  reviews: Review[];
  addReview: (data: { orderId: string; rating: number; text: string }) => Promise<{ ok: boolean }>;
  /** Leave a review for a confirmed reservation that already took place. */
  addReservationReview: (data: { reservationId: string; rating: number; text: string }) => Promise<{ ok: boolean; error?: string }>;

  /** Table reservations (own bookings for guests, all bookings for admins). */
  reservations: Reservation[];
  /** Book a table. `error` is a code for translation. */
  createReservation: (data: {
    guestName: string;
    email?: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    occasion?: string;
    note?: string;
  }) => Promise<{ ok: boolean; error?: "fillFields" | "invalidSlot" | "pastDate" | "invalidInput"; reservation?: Reservation }>;
  /** Customer: cancel an upcoming reservation. Admin: cancel any. */
  cancelReservation: (id: string) => Promise<void>;
  /** Admin: confirm or decline a pending reservation. */
  setReservationStatus: (id: string, action: "confirm" | "decline") => Promise<void>;

  /** Social media links shown in the footer (all platforms, enabled or not). */
  socialLinks: SocialLink[];
  /** Admin: set the URL and visibility of a social media link. */
  updateSocialLink: (platform: SocialPlatform, url: string, enabled: boolean) => Promise<{ ok: boolean }>;

  /** Reload all server-backed data (used by the staff terminal for polling). */
  refresh: () => Promise<void>;

  hydrated: boolean;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within Providers");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const LS = {
  theme: "tm.theme",
  lang: "tm.lang",
  cart: "tm.cart",
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readThemePreference(fallback: Theme): Theme {
  const value = readJSON<unknown>(LS.theme, fallback);
  return value === "light" || value === "dark" ? value : fallback;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function Providers({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("nl");

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<BrandConfig[]>(DEFAULT_BRAND_CONFIGS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vipRequests, setVipRequests] = useState<VipRequest[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Load server-backed data (products, session user, orders, reviews, VIP requests).
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setProducts(data.products ?? []);
      setBrands(data.brands ?? []);
      setCurrentUser(data.currentUser ?? null);
      setOrders(data.orders ?? []);
      setUsers(data.users ?? []);
      setReviews(data.reviews ?? []);
      setVipRequests(data.vipRequests ?? []);
      setSocialLinks(data.socialLinks ?? []);
      setReservations(data.reservations ?? []);
    } catch {
      /* ignore transient network errors - the UI keeps its current state */
    }
  }, []);

  // Hydrate client-only preferences from localStorage, then load server data.
  useEffect(() => {
    queueMicrotask(() => {
      const initialTheme = readThemePreference(document.documentElement.classList.contains("dark") ? "dark" : "light");
      setTheme((currentTheme) => (currentTheme === initialTheme ? currentTheme : initialTheme));
      setLangState(readJSON<Lang>(LS.lang, "nl"));
      setCart(readJSON<Record<string, number>>(LS.cart, {}));
      refresh().finally(() => setHydrated(true));
    });
  }, [refresh]);
  // Apply + persist theme.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(LS.theme, JSON.stringify(theme));
  }, [theme, hydrated]);

  // Persist language + reflect on <html lang>.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("lang", lang);
    window.localStorage.setItem(LS.lang, JSON.stringify(lang));
  }, [lang, hydrated]);

  // Persist the cart (client-only; users/orders/etc. live in the database).
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(LS.cart, JSON.stringify(cart));
  }, [cart, hydrated]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);
  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const addProduct = useCallback<StoreCtx["addProduct"]>(async (p) => {
    try {
      const res = await fetch("/api/products", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(p) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
      await refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "network" };
    }
  }, [refresh]);
  const removeProduct = useCallback<StoreCtx["removeProduct"]>(async (pid) => {
    await fetch(`/api/products?id=${encodeURIComponent(pid)}`, { method: "DELETE" });
    setCart((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
    await refresh();
  }, [refresh]);
  const updateProduct = useCallback<StoreCtx["updateProduct"]>(async (pid, patch) => {
    // Serialize undefined fields as explicit null so cleared values (e.g. a removed
    // image or detailed description) are sent - JSON.stringify omits undefined keys,
    // which would otherwise leave the old value untouched on the server.
    const body = JSON.stringify({ id: pid, ...patch }, (_key, value) => (value === undefined ? null : value));
    try {
      const res = await fetch("/api/products", { method: "PATCH", headers: JSON_HEADERS, body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
      await refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "network" };
    }
  }, [refresh]);

  const manageBrands = useCallback<StoreCtx["manageBrands"]>(async (input) => {
    try {
      const res = await fetch("/api/brands", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(input) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
      await refresh();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "network" };
    }
  }, [refresh]);

  const addToCart = useCallback((pid: string) => {
    setCart((prev) => ({ ...prev, [pid]: (prev[pid] || 0) + 1 }));
  }, []);
  const removeFromCart = useCallback((pid: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if ((next[pid] || 0) <= 1) delete next[pid];
      else next[pid] = next[pid] - 1;
      return next;
    });
  }, []);
  const clearCart = useCallback(() => setCart({}), []);

  const register: StoreCtx["register"] = useCallback(
    async (data) => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ action: "register", ...data }),
        });
        const json = await res.json().catch(() => null);
        if (!json) return { ok: false, error: "server" };
        if (json.ok) await refresh();
        return json;
      } catch {
        return { ok: false, error: "server" };
      }
    },
    [refresh]
  );

  const login: StoreCtx["login"] = useCallback(
    async (email, password) => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ action: "login", email, password }),
        });
        const json = await res.json().catch(() => null);
        if (!json) return { ok: false, error: "server" };
        if (json.ok) await refresh();
        return json;
      } catch {
        return { ok: false, error: "server" };
      }
    },
    [refresh]
  );

  const logout = useCallback<StoreCtx["logout"]>(async () => {
    await fetch("/api/auth", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ action: "logout" }) });
    setCurrentUser(null);
    setOrders([]);
    setUsers([]);
    setVipRequests([]);
    setReservations([]);
    await refresh();
  }, [refresh]);

  const buyVip = useCallback<StoreCtx["buyVip"]>(async () => {
    const res = await fetch("/api/vip", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ action: "buy" }) });
    const json = await res.json();
    // With Mollie enabled the server returns a checkout URL (no state change yet).
    if (json.ok && !json.checkoutUrl) await refresh();
    return json;
  }, [refresh]);

  const requestVip = useCallback<StoreCtx["requestVip"]>(
    async (image) => {
      const res = await fetch("/api/vip", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: "request", image }),
      });
      const json = await res.json();
      if (json.ok) await refresh();
      return json;
    },
    [refresh]
  );

  const approveVipRequest = useCallback<StoreCtx["approveVipRequest"]>(async (requestId) => {
    await fetch("/api/vip", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ action: "approve", id: requestId }) });
    await refresh();
  }, [refresh]);

  const rejectVipRequest = useCallback<StoreCtx["rejectVipRequest"]>(async (requestId) => {
    await fetch("/api/vip", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ action: "reject", id: requestId }) });
    await refresh();
  }, [refresh]);

  const addReview: StoreCtx["addReview"] = useCallback(
    async ({ orderId, rating, text }) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ orderId, rating, text }),
      });
      const json = await res.json();
      if (json.ok) await refresh();
      return json;
    },
    [refresh]
  );

  const addReservationReview: StoreCtx["addReservationReview"] = useCallback(
    async ({ reservationId, rating, text }) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ reservationId, rating, text }),
      });
      const json = await res.json();
      if (json.ok) await refresh();
      return json;
    },
    [refresh]
  );

  const createReservation: StoreCtx["createReservation"] = useCallback(
    async (data) => {
      try {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ ...data, email: data.email ?? "" }),
        });
        const json = await res.json().catch(() => null);
        if (!json) return { ok: false, error: "invalidInput" as const };
        if (json.ok) await refresh();
        return json;
      } catch {
        return { ok: false, error: "invalidInput" as const };
      }
    },
    [refresh]
  );

  const cancelReservation = useCallback<StoreCtx["cancelReservation"]>(async (id) => {
    await fetch("/api/reservations", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ id, action: "cancel" }) });
    await refresh();
  }, [refresh]);

  const setReservationStatus = useCallback<StoreCtx["setReservationStatus"]>(async (id, action) => {
    await fetch("/api/reservations", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ id, action }) });
    await refresh();
  }, [refresh]);

  const placeOrder: StoreCtx["placeOrder"] = useCallback(
    async (details) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ ...details, cart }),
      });
      const json = await res.json();
      // Company orders come back immediately; personal orders return a Mollie
      // checkout URL and the cart is cleared only after payment succeeds.
      if (json.ok && json.order) {
        setCart({});
        await refresh();
      }
      return json;
    },
    [cart, refresh]
  );

  const updateOrderStatus = useCallback<StoreCtx["updateOrderStatus"]>(async (orderId, status) => {
    await fetch("/api/orders", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ id: orderId, status }) });
    await refresh();
  }, [refresh]);

  const setOrderPaid = useCallback<StoreCtx["setOrderPaid"]>(async (orderId, paid) => {
    await fetch("/api/orders", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ id: orderId, paid }) });
    await refresh();
  }, [refresh]);

  const setInvoiceSent = useCallback<StoreCtx["setInvoiceSent"]>(async (orderId, sent) => {
    await fetch("/api/orders", { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ id: orderId, invoiceSent: sent }) });
    await refresh();
  }, [refresh]);

  const updateSocialLink = useCallback<StoreCtx["updateSocialLink"]>(async (platform, url, enabled) => {
    const res = await fetch("/api/social", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ platform, url, enabled }),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (json.ok) {
      // Optimistic local update - no full refresh needed for a single link.
      setSocialLinks((prev) => {
        const others = prev.filter((l) => l.platform !== platform);
        return [...others, { platform, url: url.trim(), enabled }];
      });
    }
    return { ok: !!json.ok };
  }, []);

  const themeValue = useMemo<ThemeCtx>(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  const langValue = useMemo<LangCtx>(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang, setLang]
  );
  const storeValue = useMemo<StoreCtx>(
    () => ({
      products,
      addProduct,
      removeProduct,
      updateProduct,
      brands,
      manageBrands,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      users,
      currentUser,
      register,
      login,
      logout,
      orders,
      placeOrder,
      updateOrderStatus,
      setOrderPaid,
      setInvoiceSent,
      buyVip,
      vipRequests,
      requestVip,
      approveVipRequest,
      rejectVipRequest,
      reviews,
      addReview,
      addReservationReview,
      reservations,
      createReservation,
      cancelReservation,
      setReservationStatus,
      socialLinks,
      updateSocialLink,
      refresh,
      hydrated,
    }),
    [
      products,
      addProduct,
      removeProduct,
      updateProduct,
      brands,
      manageBrands,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      users,
      currentUser,
      register,
      login,
      logout,
      orders,
      placeOrder,
      updateOrderStatus,
      setOrderPaid,
      setInvoiceSent,
      buyVip,
      vipRequests,
      requestVip,
      approveVipRequest,
      rejectVipRequest,
      reviews,
      addReview,
      addReservationReview,
      reservations,
      createReservation,
      cancelReservation,
      setReservationStatus,
      socialLinks,
      updateSocialLink,
      refresh,
      hydrated,
    ]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <LanguageContext.Provider value={langValue}>
        <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}
