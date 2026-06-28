import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Malayalam } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import '../globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoMalayalam = Noto_Sans_Malayalam({
  subsets: ['malayalam'],
  variable: '--font-ml',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Family Tree',
  description: 'Our family tree — connecting generations',
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'ml')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${notoSans.variable} ${notoMalayalam.variable}`}>
      <body className="font-sans min-h-screen bg-background">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="pt-16">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
