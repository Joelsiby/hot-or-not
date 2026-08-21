"use client"

import { useState, useEffect, useRef } from "react"
import { LeaderboardCard } from "@/components/leaderboard-card"
import { LeaderboardCardSkeleton } from "@/components/leaderboard-card-skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { leaderboardItems } from "@/lib/leaderboard-data"

const ITEMS_PER_PAGE = 10

interface LeaderboardListProps {
  onClaimClick?: (rank: number, bid: number) => void
}

export function LeaderboardList({ onClaimClick }: LeaderboardListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const prevPage = useRef(currentPage)
  const totalPages = Math.ceil(leaderboardItems.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = leaderboardItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (prevPage.current !== currentPage) {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), 500)
      prevPage.current = currentPage
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [currentPage])

  const handleClaimClick = (rank: number, bid: number) => {
    if (onClaimClick) {
      onClaimClick(rank, bid)
    }
  }

  return (
    <div>
      <div className="space-y-6">
        {isLoading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <LeaderboardCardSkeleton key={i} />
            ))
          : currentItems.map((item) => (
              <LeaderboardCard key={item.rank} item={item} onClaimClick={handleClaimClick} />
            ))}
      </div>

      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => setCurrentPage(page)}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}