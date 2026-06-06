"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fetchAddresses } from "@/lib/api/addresses";
import type { AddressInput } from "@/lib/api/addresses";
import { checkout } from "@/lib/api/checkout";
import { fa } from "@/lib/i18n/fa";
import { routes } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils/formatPrice";
import { normalizeDigits } from "@/lib/utils/normalizeDigits";
import type { Address } from "@/types/api";

const emptyAddress: AddressInput = {
  title: "خانه",
  province: "",
  city: "",
  postal_address: "",
  postal_code: "",
  receiver_name: "",
  receiver_phone: "",
  is_default: true,
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm";

function normalizeAddressForm(form: AddressInput): AddressInput {
  return {
    ...form,
    title: form.title.trim(),
    province: form.province.trim(),
    city: form.city.trim(),
    postal_address: form.postal_address.trim(),
    receiver_name: form.receiver_name.trim(),
    postal_code: normalizeDigits(form.postal_code),
    receiver_phone: normalizeDigits(form.receiver_phone),
  };
}

function validateAddressForm(form: AddressInput): string | null {
  if (!form.title || !form.province || !form.city || !form.postal_address || !form.receiver_name) {
    return fa.checkout.addressRequired;
  }
  if (form.receiver_phone.length !== 11) {
    return fa.checkout.invalidPhone;
  }
  if (form.postal_code.length !== 10) {
    return fa.checkout.invalidPostalCode;
  }
  return null;
}

export default function CheckoutPageClient() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refreshCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [form, setForm] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (cartLoading) return;
    if (!user || !token) {
      router.replace(`${routes.login}?next=${encodeURIComponent(routes.checkout)}`);
      return;
    }
    if (cart.items.length === 0) {
      router.replace(routes.cart);
      return;
    }
    fetchAddresses(token)
      .then((data) => {
        setAddresses(data);
        if (data.length > 0) {
          const defaultAddress = data.find((a) => a.is_default) ?? data[0];
          setSelectedAddressId(defaultAddress.id);
        }
      })
      .catch(() => {});
  }, [authLoading, cartLoading, user, token, cart.items.length, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || busy) return;

    setBusy(true);
    setError("");

    try {
      const serverCart = await refreshCart();
      if (serverCart.items.length === 0) {
        setError(fa.checkout.emptyCart);
        router.replace(routes.cart);
        return;
      }

      let payload: { address_id?: number; address?: AddressInput };

      if (selectedAddressId === "new") {
        const normalized = normalizeAddressForm(form);
        const validationError = validateAddressForm(normalized);
        if (validationError) {
          setError(validationError);
          return;
        }
        payload = { address: normalized };
      } else {
        payload = { address_id: selectedAddressId };
      }

      const result = await checkout(token, payload);
      await refreshCart();
      if (result.payment_url) {
        window.location.assign(result.payment_url);
        return;
      }
      setError(fa.common.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : fa.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || cartLoading || !user || !token || cart.items.length === 0) {
    return <p className="p-8 text-center text-muted-foreground">{fa.common.loading}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-primary">{fa.checkout.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{fa.checkout.subtitle}</p>

      <form className="mt-8 grid gap-8 lg:grid-cols-5" onSubmit={(e) => void handleSubmit(e)}>
        <section className="lg:col-span-3">
          <h2 className="text-lg font-bold">{fa.checkout.shippingTitle}</h2>

          {addresses.length > 0 ? (
            <div className="mt-4 space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    selectedAddressId === address.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                  />
                  <span className="text-sm leading-7">
                    <span className="font-medium">{address.title}</span>
                    <br />
                    {address.receiver_name} — {address.receiver_phone}
                    <br />
                    {address.province}، {address.city}
                    <br />
                    {address.postal_address}
                  </span>
                </label>
              ))}
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                  selectedAddressId === "new" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === "new"}
                  onChange={() => setSelectedAddressId("new")}
                />
                <span className="text-sm font-medium">{fa.checkout.newAddress}</span>
              </label>
            </div>
          ) : null}

          {selectedAddressId === "new" || addresses.length === 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={fa.checkout.addressTitle} className="sm:col-span-2">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={fa.checkout.receiverName}>
                <input
                  value={form.receiver_name}
                  onChange={(e) => setForm({ ...form, receiver_name: e.target.value })}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={fa.checkout.receiverPhone}>
                <input
                  value={form.receiver_phone}
                  onChange={(e) => setForm({ ...form, receiver_phone: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                  inputMode="numeric"
                  required
                />
              </Field>
              <Field label={fa.checkout.province}>
                <input
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={fa.checkout.city}>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                  required
                />
              </Field>
              <Field label={fa.checkout.postalCode}>
                <input
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                  inputMode="numeric"
                  required
                />
              </Field>
              <Field label={fa.checkout.postalAddress} className="sm:col-span-2">
                <textarea
                  value={form.postal_address}
                  onChange={(e) => setForm({ ...form, postal_address: e.target.value })}
                  className={`${inputClass} min-h-24`}
                  required
                />
              </Field>
            </div>
          ) : null}
        </section>

        <aside className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-muted/30 p-5 lg:sticky lg:top-24">
            <h2 className="font-bold">{fa.checkout.orderSummary}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {cart.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="line-clamp-2 text-muted-foreground">
                    {item.product.title} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
              <span>{fa.cart.total}</span>
              <span>{formatPrice(cart.total_price)}</span>
            </div>

            {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
            >
              {busy ? fa.common.loading : fa.checkout.payOnline}
            </button>

            <Link href={routes.cart} className="mt-3 block text-center text-sm text-primary hover:underline">
              {fa.checkout.backToCart}
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
    </label>
  );
}
