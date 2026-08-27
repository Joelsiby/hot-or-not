'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileLayout } from '@/components/mobile-layout';
import { MovieList } from '@/components/movie-list';
import { VoteMeter } from '@/components/vote-meter';
import { CommentComposer } from '@/components/comment-composer';
import { CommentFeed } from '@/components/comment-feed';
import { TrendingSection } from '@/components/trending-section';
import { LatestActivity } from '@/components/latest-activity';
import { movies, getMovie } from '@/lib/movies';
import { seedComments, type Comment } from '@/lib/comments-data';

// Rows are ranked purely by amount raised (then recency) — Hot and Not
// takes interleave in the same feed based on price and top bid.
function byAmountRaised(comments: Comment[]) {
  return [...comments].sort(
    (a, b) => b.amountPaise - a.amountPaise || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function Home() {
  const [selectedSlug, setSelectedSlug] = useState(movies[0].slug);
  const [comments, setComments] = useState<Comment[]>(() =>
    byAmountRaised(seedComments.filter((c) => c.movieSlug === movies[0].slug))
  );
  const [isLoading, setIsLoading] = useState(true);

  // Land back on whichever movie the user was upvoting on after a Polar
  // checkout redirect (?movie=slug), instead of always resetting to Toxic.
  useEffect(() => {
    const movie = new URLSearchParams(window.location.search).get('movie');
    if (movie && getMovie(movie)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing initial selection from the URL is this effect's whole purpose
      setSelectedSlug(movie);
    }
  }, []);

  const loadComments = useCallback((movieSlug: string) => {
    setIsLoading(true);
    fetch(`/api/comments?movie=${movieSlug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data.items)) {
          setComments(byAmountRaised(data.items));
        }
      })
      // No backend configured yet (or the request failed) — fall back to seed data.
      .catch(() => {
        setComments(byAmountRaised(seedComments.filter((c) => c.movieSlug === movieSlug)));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching a movie's comment thread when the selection changes is the effect's whole purpose
    loadComments(selectedSlug);
  }, [selectedSlug, loadComments]);

  const movie = getMovie(selectedSlug)!;
  const hotPaise = comments.filter((c) => c.side === 'hot').reduce((sum, c) => sum + c.amountPaise, 0);
  const notPaise = comments.filter((c) => c.side === 'not').reduce((sum, c) => sum + c.amountPaise, 0);

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {movie.posterEmoji} {movie.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Pay ₹20 to upvote a take and push it up.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TrendingSection comments={comments} isLoading={isLoading} />
              <LatestActivity comments={comments} isLoading={isLoading} />
            </div>

            <div className="mb-6">
              <VoteMeter hotPaise={hotPaise} notPaise={notPaise} />
            </div>

            <CommentComposer
              movieSlug={selectedSlug}
              comments={comments}
              onPosted={() => loadComments(selectedSlug)}
            />

            <MovieList selectedSlug={selectedSlug} onSelect={setSelectedSlug} className="mt-3 mb-6" />

            <CommentFeed key={selectedSlug} comments={comments} onUpvoted={() => loadComments(selectedSlug)} />
          </div>
        </main>
        <Footer />
      </div>
    </MobileLayout>
  );
}
