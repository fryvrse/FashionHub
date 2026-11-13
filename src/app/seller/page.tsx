import { redirect } from "next/navigation";

export default function SellerRootRedirect({
  searchParams,
}: {
  searchParams: { guard?: string; from?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.guard) params.set("guard", searchParams.guard);
  if (searchParams.from) params.set("from", searchParams.from);
  const qs = params.toString();
  redirect(`/seller/dashboard${qs ? `?${qs}` : ""}`);
}
