import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';

export default function PrivacyPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">
              Effective August 27, 2026. Last updated August 27, 2026.
            </p>

            <div className="mt-8 space-y-8 text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2">
              <section>
                <h2>What we collect</h2>
                <p>
                  You can browse Bhosdike movies without creating an account. When you post a take,
                  we store the name you provide, your comment, any image you upload, and the movie
                  and side you selected. We also store upvote and payment status data needed to
                  operate the service.
                </p>
              </section>

              {/* <section>
                <h2>Payments</h2>
                <p>
                  Payments are handled by Polar, our merchant of record. We do not receive or store
                  full payment-card numbers. Polar may process information under its own privacy
                  notice when you leave this site to complete checkout.
                </p>
              </section> */}

              <section>
                <h2>Cookies and analytics</h2>
                <p>
                  Bhosdike does not set first-party cookies and does not require cookies to browse,
                  post, or view comments. We do not use advertising or cross-site tracking cookies.
                </p>
                {/* <p>
                  Privacy-friendly Umami analytics is disabled unless the site operator explicitly
                  configures it. When enabled, it may receive aggregate page-view information from
                  your browser. Checkout is operated by Polar and may use its own technologies.
                </p> */}
              </section>

              <section>
                <h2>How we use information</h2>
                <ul>
                  <li>To publish and display takes, images, rankings, and activity.</li>
                  <li>To process paid upvotes and reconcile payment webhooks.</li>
                  <li>
                    To prevent abuse, enforce the Rules and Terms, and respond to legal requests.
                  </li>
                  <li>To maintain and improve the service.</li>
                </ul>
              </section>

              <section>
                <h2>Retention and contact</h2>
                <p>
                  Public posts and the records needed to support payments are retained while needed
                  to operate the service, meet legal obligations, resolve disputes, and enforce our
                  agreements. For privacy questions or deletion requests, contact
                  bhosdike@gmail.com.
                </p>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
