import "./index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ConstructFlow | Construction ERP",
  description: "Construction project management ERP",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
