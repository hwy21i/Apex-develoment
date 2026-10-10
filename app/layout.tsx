import "./index.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { UserProvider } from "@/components/auth/UserProvider";

export const metadata: Metadata = {
  title: "Apex Build | Construction Project Management ERP",
  description: "Enterprise Construction Project Management, Cost Control, Site & Fleet ERP",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
