export const metadata = {
  title: 'Days',
  description: 'Year progress wallpaper generator',
  openGraph: {
    title: 'Days',
    description: 'Year progress wallpaper generator',
    images: [{ url: '/days?width=1200&height=630', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Days',
    description: 'Year progress wallpaper generator',
    images: ['/days?width=1200&height=630'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
