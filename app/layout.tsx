import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'NeedieAdmin - Technical Dashboard',
  description: 'Administrative suite for NeedieShop',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink font-sans antialiased min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
