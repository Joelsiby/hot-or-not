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
                Hate or Hype is where movie opinions actually cost something. Pick a movie, then put
                your money where your mouth is — argue for it under <span className="text-sky-600 font-medium">⚡ Hype</span>, or tear it apart
                under <span className="text-red-600 font-medium">🔥 Hate</span>. No ads, no API keys, no revenue share — just fans versus
                critics, settled in rupees instead of replies.
              </p>
              <p>
                The concept is simple: ₹20 to post your take, ₹20 to upvote anyone else&apos;s — yours
                included, if you want to hype your own comment. Every payment pushes that comment
                higher up its column and adds to its side&apos;s total, so the meter above each movie
                is a live scoreboard of who&apos;s actually winning, not just who posted the loudest.
                Pay more than the base price and you can claim a higher starting rank outright —
                though someone else can always out-hype (or out-hate) you back down later.
              </p>
              <p>
                It updates on its own — new posts and upvotes from other people show up within
                seconds, no refresh needed. Payments run through Razorpay, so UPI, cards, netbanking,
                and wallets all work. And every comment thread comes with its own scoreboard-adjacent
                commentary: the Trending box surfaces the most-upvoted takes for whichever movie
                you&apos;re on, and the meter occasionally roasts whoever&apos;s losing by name.
              </p>
              <p>
                This project was built as a side project to explore paid, real-time, opinionated
                leaderboards — and to see what happens when arguing about a movie has an actual
                scoreboard attached to it.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
