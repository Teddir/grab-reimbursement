import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | AsisGrab Business",
  description: "Sign in to your AsisGrab Business account to manage your reimbursements.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
