import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata = {
  title: 'UrbanTwins — Smart City Digital Twin',
  description: 'Real-time urban infrastructure monitoring',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}