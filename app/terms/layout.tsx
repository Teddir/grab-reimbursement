import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | AsisGrab Business",
  description: "Read the terms and conditions for using the AsisGrab Business platform.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
