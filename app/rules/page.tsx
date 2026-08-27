import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';

export default function RulesPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold tracking-tight">Rules</h1>
            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-3">Hype vs Hate</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>
                    Every movie has two columns: <span className="text-sky-600 font-medium">⚡ Hype</span> (in favour) and{' '}
                    <span className="text-red-600 font-medium">🔥 Hate</span> (critical).
                  </li>
                  <li>
                    Comments from both columns rank together in one feed, sorted purely by how much
                    has been paid on each — not by which column it&apos;s in, not by post time.
                  </li>
                  <li>
                    The meter above the feed totals every rupee paid on each side (posts and upvotes
                    together) so you can see who&apos;s actually winning, live.
                  </li>
                  <li>Pick a movie from the list to switch to its own Hype vs Hate thread.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Posting</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>
                    Posting a comment costs a flat ₹20 minimum — pick a side, write your take, and
                    optionally pay more than the base price to claim a higher starting rank than a
                    fresh ₹20 post would get.
                  </li>
                  <li>Paying more doesn&apos;t lock your spot — someone else can still outbid you later.</li>
                  <li>Username is required on every post; there&apos;s no login, so pick something you&apos;re fine being public.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Upvoting</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Upvoting costs a flat ₹20 — there&apos;s no bidding, just the base price.</li>
                  <li>
                    You can stack multiple ₹20 units into a single upvote instead of clicking upvote
                    repeatedly — the confirm screen lets you type an amount or use the +/- buttons.
                  </li>
                  <li>
                    Each paid upvote adds to that comment&apos;s total and moves it up the feed;
                    comments are ranked by total raised, not just upvote count.
                  </li>
                  <li>You can upvote any comment, including your own.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Trending &amp; activity</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Trending shows the top 3 most-upvoted comments for the selected movie.</li>
                  <li>Latest activity shows the most recent comments posted, from either side.</li>
                  <li>
                    Both update on their own every few seconds — new posts and upvotes from other
                    people show up without you needing to refresh the page.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Images</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>You can attach one image to a comment, up to 5MB.</li>
                  <li>
                    Images show as a small thumbnail by default — the full-size version only loads
                    when you hover over it.
                  </li>
                  <li>Links to sexual content are not allowed, in comments or images.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Payments</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Checkout runs through Razorpay — UPI, cards, netbanking, and wallets all work.</li>
                  <li>
                    A completed payment is what registers a post or an upvote — nothing counts until
                    then, and nothing is charged if you close the payment window.
                  </li>
                  <li>All payments are final. See the <a href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</a> for the full policy.</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
