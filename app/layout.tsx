import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trợ Lý Sáng Kiến VIP · GDPT 2018 | Soạn Thảo & Thẩm Định SKKN 100 Điểm",
  description: "Trợ lý AI chuyên biệt cho giáo viên: Thiết lập hồ sơ, soạn thảo 6 phần chuẩn mực và thẩm định sáng kiến kinh nghiệm theo barem 100 điểm của Bộ Giáo dục & Đào tạo.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
