"use client";

export default function PaywallGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Subscription gate bypassed — free access for all users
  return <>{children}</>;
}
