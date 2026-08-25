// Layout wrapper that renders the children for all account-scoped routes.
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render the account-scoped child route content directly.
  return <>{children}</>;
}
