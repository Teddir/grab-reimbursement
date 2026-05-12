import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AsisGrab Business",
  description: "Learn how AsisGrab Business protects and manages your data privacy.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
