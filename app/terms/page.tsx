import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';

export default function TermsPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">
              Effective August 27, 2026. Last updated August 27, 2026.
            </p>

            <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              <strong>Template notice:</strong> this page is a starting draft, not legal advice. The
              bracketed placeholders below (operator identity, jurisdiction) need to be filled in
              with your real details, and a lawyer should review this before you rely on it.
            </div>

            <div className="mt-8 space-y-8 text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2">
              <p>
                These Terms of Service (&quot;Terms&quot;) govern access to and use of hot-or-not (the
                &quot;Service&quot;), including the movie feed, posting comments, upvoting, checkout,
                and related features. By using the Service, posting a comment, or completing a
                payment, you agree to these Terms.
              </p>
              <p>
                If you do not agree, do not use the Service and do not pay to upvote. Before checkout
                you must confirm, by checking a box, that you have read and agree to these Terms.
              </p>

              <section>
                <h2>Operator and contact</h2>
                <p>
                  The Service is operated by <strong>[Your legal name / entity]</strong>, based in{' '}
                  <strong>[Your country]</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
                </p>
                <ul>
                  <li>Legal and takedown notices: joellsiby@gmail.com</li>
                </ul>
                <p>These Terms work together with the public Rules. If the Rules and these Terms conflict, these Terms control.</p>
              </section>

              <section>
                <h2>What the Service is</h2>
                <p>
                  hot-or-not is a public feed of fan opinion about movies. Posting a comment as
                  &quot;Hot&quot; (in favour) or &quot;Not&quot; (critical) costs a fixed ₹20, and you
                  may pay more than that to claim a higher starting position. Upvoting any comment
                  also costs ₹20 per upvote; each paid upvote raises that comment&apos;s position and
                  adds to its side&apos;s running total, shown on the vote meter.
                </p>
                <p>
                  A payment buys one upvote at the moment it&apos;s fulfilled. It does not buy a
                  guaranteed rank, a fixed duration at a position, or any particular outcome — other
                  upvotes can push a comment back down the feed. We may change, pause, or discontinue
                  features, including movies, categories, and ranking behaviour.
                </p>
              </section>

              <section>
                <h2>Eligibility</h2>
                <ul>
                  <li>You must be at least 18 years old and able to form a binding contract.</li>
                  <li>
                    If you use the Service on behalf of a company, you represent that you have
                    authority to bind that company, and &quot;you&quot; includes that company.
                  </li>
                  <li>
                    You may not use the Service if you are prohibited from receiving services under
                    the laws of your jurisdiction, including trade sanctions.
                  </li>
                </ul>
              </section>

              <section>
                <h2>Payments and taxes</h2>
                <p>
                  Checkout is processed by Razorpay. We do not collect or store your card, UPI, or
                  bank details — Razorpay handles that directly. Razorpay&apos;s terms and privacy
                  notice also apply to the payment itself. Amounts are priced in Indian Rupees (₹).
                  Applicable taxes may be added at checkout.
                </p>
                <p>
                  The price is fixed and shown before you pay. Completing checkout is an offer to buy
                  one post or one upvote at that price. It&apos;s applied the moment we verify your
                  payment, at whatever position that pushes the comment to.
                </p>
              </section>

              <section>
                <h2>No refunds</h2>
                <p>
                  All payments are final and not refundable. Posting a comment and upvoting one are
                  both digital services that begin as soon as payment is confirmed: the comment is
                  published (for a post) or its position and total are updated (for an upvote)
                  immediately. Being pushed back down later by other posts or upvotes, downtime, or a
                  later removal of the comment for breach of these Terms does not create a refund.
                </p>
                <p>
                  By completing checkout you request that we start this digital service immediately
                  and acknowledge that you lose any statutory right of withdrawal or cooling-off
                  period to the extent that law allows that waiver. Where a mandatory consumer right
                  cannot be waived, we honor that right. Chargebacks or reversed payments without a
                  legally required basis are a breach of these Terms; we may remove the associated
                  comment or upvote and refuse future use of the Service.
                </p>
              </section>

              <section>
                <h2>Your content and warranties</h2>
                <p>By posting a comment, an image, or a payment, you represent and warrant that:</p>
                <ul>
                  <li>You wrote the comment yourself, or have the right to post it.</li>
                  <li>You own the image you upload, or have the right to post it.</li>
                  <li>
                    Your content complies with all applicable laws, including defamation, privacy,
                    and intellectual-property rules.
                  </li>
                  <li>You are not impersonating another person or account.</li>
                  <li>The information you submit is accurate.</li>
                </ul>
              </section>

              <section>
                <h2>Prohibited content and use</h2>
                <p>In addition to the Rules, you may not post or use the Service for:</p>
                <ul>
                  <li>Sexual, pornographic, or adult content in text or images.</li>
                  <li>
                    Content that is illegal, fraudulent, defamatory, harassing, hateful, violent, or
                    that exploits children.
                  </li>
                  <li>Spam, chat/invite links, or content unrelated to the movie being discussed.</li>
                  <li>Counterfeit content or infringement of copyright, trademark, or other rights.</li>
                  <li>
                    Interfering with the Service: scraping beyond ordinary browsing, manipulating
                    upvote counts, bypassing rate limits, automated posting or upvoting without our
                    written permission, or reverse engineering except as allowed by mandatory law.
                  </li>
                </ul>
              </section>

              <section>
                <h2>Our right to remove content</h2>
                <p>
                  We may refuse, edit, hide, or permanently remove any comment, image, or upvote, with
                  or without notice, including where we believe these Terms, the Rules, or the law may
                  have been broken, or where we think the content creates legal, security, or
                  reputational risk. Removal does not entitle you to a refund of any upvote already
                  paid on that comment.
                </p>
              </section>

              <section>
                <h2>Movie names and identification</h2>
                <p>
                  Movie titles shown on the Service are used only to identify which film a comment
                  thread is about. This is not an endorsement by, or affiliation with, the film&apos;s
                  studio, distributor, or rights holders, and no sponsorship is implied.
                </p>
              </section>

              <section>
                <h2>License you grant us</h2>
                <p>
                  You grant us a worldwide, non-exclusive, royalty-free license to host, cache,
                  reproduce, resize, and publicly display the comment and image you submit, for as
                  long as needed to operate the Service. If you want a comment taken down, email
                  joellsiby@gmail.com. Takedown does not undo a completed upvote payment.
                </p>
              </section>

              <section>
                <h2>Complaints and rights notices</h2>
                <p>
                  If you believe a comment or image infringes your rights, or is unlawful, email
                  joellsiby@gmail.com with: your contact details, a link to the comment, a description
                  of the problem, and a statement that you are the rights holder or authorized to act.
                  We may remove or restrict the content while we review the notice.
                </p>
              </section>

              <section>
                <h2>No endorsement</h2>
                <p>
                  Comments on the Service are the opinions of the people who posted them. We do not
                  verify their accuracy. Upvote counts and totals describe what people paid; they are
                  not our opinion of the movie or the comment.
                </p>
              </section>

              <section>
                <h2>Availability and changes</h2>
                <p>
                  We provide the Service as-is. It may be unavailable, slow, or incorrect. We may
                  change these Terms; if a change is material, we will update the date at the top of
                  this page. Continued use after a change means you accept the new Terms. For an
                  upvote already paid for, the Terms in effect at checkout still apply to that
                  payment, except where a change is required by law.
                </p>
              </section>

              <section>
                <h2>Disclaimers and limitation of liability</h2>
                <p>
                  To the fullest extent permitted by law, we disclaim all warranties, express or
                  implied, and do not warrant that the Service will be uninterrupted, secure, or free
                  of errors. We are not liable for indirect, incidental, or consequential damages. Our
                  total liability for a claim relating to a payment is limited to the amount you paid
                  us for the upvote that the claim concerns, in the three months before the claim.
                  Nothing here limits liability that applicable law says cannot be limited.
                </p>
              </section>

              <section>
                <h2>Governing law</h2>
                <p>
                  These Terms are governed by the laws of <strong>[Your country/state]</strong>,
                  excluding conflict-of-law rules. If you are a consumer with a mandatory local law
                  that cannot be displaced, that law still protects you.
                </p>
              </section>

              <section>
                <h2>General</h2>
                <ul>
                  <li>
                    If a part of these Terms is unenforceable, the rest remains in effect, and the
                    invalid part is replaced by the valid term that comes closest to the original
                    intent.
                  </li>
                  <li>Our failure to enforce a provision is not a waiver.</li>
                  <li>
                    These Terms, the Rules, and the checkout details you confirm form the entire
                    agreement for the Service.
                  </li>
                  <li>Payments and hosting involve third parties, including Polar. Their outages or decisions are outside our control.</li>
                </ul>
                <p>Questions: joellsiby@gmail.com.</p>
              </section>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
