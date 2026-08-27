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
                  <li>Every movie has two columns: Hype (in favour) and Hate (critical).</li>
                  <li>
                    Posting a comment costs a flat ₹20 minimum — pick a side, write your take, and
                    optionally pay more than the base price to claim a higher starting rank.
                  </li>
                  <li>
                    The meter above the columns shows how much has been paid on each side (posts and
                    upvotes together), so everyone can see who&apos;s winning in real time.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Upvoting</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Upvoting costs a flat ₹20 — there&apos;s no bidding, just the base price.</li>
                  <li>
                    Each paid upvote adds ₹20 to that comment&apos;s total and moves it up the
                    column; comments are ranked by total raised, not just upvote count.
                  </li>
                  <li>You can upvote any comment, including your own.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Trending &amp; activity</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Trending shows the top 3 most-upvoted comments for the selected movie.</li>
                  <li>Latest activity shows the most recent comments posted, from either side.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Images</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>You can attach one image to a comment.</li>
                  <li>
                    Images show as a small thumbnail by default — the full-size version only loads
                    when you hover over it.
                  </li>
                  <li>Links to sexual content are not allowed.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">After you pay</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>
                    A completed payment is what registers a post or an upvote — nothing counts until
                    then.
                  </li>
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
