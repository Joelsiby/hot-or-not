import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';

export default function AboutPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold tracking-tight">About</h1>
            <div className="mt-8 space-y-6 text-muted-foreground">
              <p>
                Hot or Not is a public arena for movie takes. Pick a movie, then argue for it in the
                Hot column or against it in the Not column. There are no ads, no API keys, and no
                revenue share — just fans versus critics.
              </p>
              <p>
                The concept is simple: post your take for free, then pay ₹100 to upvote any comment
                — yours or someone else&apos;s. Every upvote pushes that comment higher and adds ₹100
                to its side&apos;s total, so the meter above each movie always shows who&apos;s
                actually winning.
              </p>
              <p>
                This project was built as a simple side project to explore paid upvotes and
                real-time, opinionated leaderboards.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
