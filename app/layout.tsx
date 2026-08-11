import "./index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apex Developments",
  description: "Elegant Construction Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
