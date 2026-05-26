import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  GraduationCap,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  loadPublications,
  type Publication,
  type PublicationType,
  typeLabel,
} from "@/lib/publications"

type FilterType = PublicationType | "All"
type SortMode = "newest" | "oldest" | "type" | "title"

const typeFilters: Array<{ value: FilterType; label: string }> = [
  { value: "All", label: "All" },
  { value: "Journal", label: "Journal" },
  { value: "Doctoral Dissertation", label: "Dissertation" },
  { value: "Masters Thesis", label: "Thesis" },
  { value: "Technical Report", label: "Technical Report" },
]

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "type", label: "Type" },
  { value: "title", label: "Name" },
]

const typeSortRank: Record<string, number> = {
  Journal: 0,
  Thesis: 1,
  Report: 2,
}

const sitePath = (path: string) => {
  if (import.meta.env.DEV) {
    return new URL(path, "http://localhost:8000/").toString()
  }

  const siteRoot = window.location.pathname.includes("/publications_modern/dist/") ? "../../" : "../"

  return `${siteRoot}${path}`
}

const logoSrc = sitePath("Generated%20image%201.png")

const navItems = [
  { label: "Home", href: sitePath("index.html") },
  { label: "People", href: sitePath("pages/people.html") },
  { label: "Research", href: sitePath("pages/control.html") },
  { label: "Facilities", href: sitePath("pages/facility.html") },
  { label: "Projects", href: sitePath("pages/control.html") },
  { label: "Publications", href: "./" },
  { label: "News", href: sitePath("pages/news.html") },
  { label: "Contact", href: "mailto:sdyke@purdue.edu" },
]

function PublicationIcon({ type }: { type: PublicationType }) {
  if (type === "Doctoral Dissertation" || type === "Masters Thesis") {
    return <GraduationCap aria-hidden="true" />
  }

  if (type === "Technical Report") {
    return <BookOpen aria-hidden="true" />
  }

  return <FileText aria-hidden="true" />
}

function comparePublications(sort: SortMode) {
  return (a: Publication, b: Publication) => {
    if (sort === "oldest") {
      return Number(a.year || 0) - Number(b.year || 0) || a.title.localeCompare(b.title)
    }

    if (sort === "type") {
      const typeA = typeLabel(a.type)
      const typeB = typeLabel(b.type)

      return (typeSortRank[typeA] ?? 99) - (typeSortRank[typeB] ?? 99) || a.title.localeCompare(b.title)
    }

    if (sort === "title") {
      return a.title.localeCompare(b.title)
    }

    return Number(b.year || 0) - Number(a.year || 0) || a.title.localeCompare(b.title)
  }
}

function groupLabelFor(publication: Publication, sort: SortMode) {
  if (sort === "type") {
    return typeLabel(publication.type)
  }

  if (sort === "title") {
    return publication.title.trim().charAt(0).toUpperCase().match(/[A-Z]/)?.[0] ?? "#"
  }

  return publication.year
}

function groupToneFor(group: string, sort: SortMode) {
  if (sort !== "type") {
    return undefined
  }

  if (group === "Journal") return "journal"
  if (group === "Thesis") return "thesis"
  if (group === "Report") return "report"
  return undefined
}

function searchAliasesFor(publication: Publication) {
  const aliases: string[] = []
  const searchableText = `${publication.title} ${publication.authors} ${publication.raw} ${publication.keywords.join(" ")}`

  if (/rths|hybrid simulation|real-time|real time/i.test(searchableText)) {
    aliases.push("rths", "real time hybrid simulation", "real-time hybrid simulation")
  }

  return aliases
}

function useFilteredPublications(
  publications: Publication[],
  activeType: FilterType,
  query: string,
  sort: SortMode,
) {
  return useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

    return publications
      .filter((publication) => {
        if (activeType !== "All" && publication.type !== activeType) {
          return false
        }

        if (!terms.length) {
          return true
        }

        const searchable = [
          publication.title,
          publication.authors,
          publication.year,
          publication.type,
          publication.keywords.join(" "),
          publication.raw,
          searchAliasesFor(publication).join(" "),
        ]
          .join(" ")
          .toLowerCase()

        return terms.every((term) => searchable.includes(term))
      })
      .sort(comparePublications(sort))
  }, [activeType, publications, query, sort])
}

function LoadingList() {
  return (
    <div className="publication-list publication-list-loading" aria-label="Loading publications">
      {[0, 1, 2].map((item) => (
        <Card className="publication-card" key={item}>
          <CardHeader>
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
          </CardHeader>
          <CardContent className="publication-card-skeleton-content">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PublicationCard({ publication }: { publication: Publication }) {
  const label = typeLabel(publication.type)

  return (
    <Card className="publication-card">
      <div className="publication-type-mark" data-publication-type={publication.type}>
        <PublicationIcon type={publication.type} />
      </div>
      <CardHeader className="publication-card-header">
        <CardTitle className="publication-title">
          {publication.link ? (
            <a href={publication.link} target="_blank" rel="noreferrer">
              {publication.title}
            </a>
          ) : (
            publication.title
          )}
        </CardTitle>
        <CardDescription className="publication-authors">{publication.authors}</CardDescription>
      </CardHeader>
      <CardContent className="publication-meta-grid">
        <div className="publication-meta-cell publication-type-cell">
          <Badge variant="outline" data-publication-type={publication.type}>
            {label}
          </Badge>
        </div>
        <div className="publication-meta-cell publication-year-cell">
          <time dateTime={publication.year}>{publication.year}</time>
        </div>
        <div className="publication-meta-cell publication-keyword-cell">
          <div className="publication-keywords">
            {publication.keywords.map((keyword) => (
              <Badge variant="secondary" key={keyword}>
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PublicationGroups({ publications, sort }: { publications: Publication[]; sort: SortMode }) {
  const groups = useMemo(() => {
    const publicationGroups = new Map<string, Publication[]>()

    publications.forEach((publication) => {
      const label = groupLabelFor(publication, sort)
      const items = publicationGroups.get(label) ?? []
      items.push(publication)
      publicationGroups.set(label, items)
    })

    return Array.from(publicationGroups.entries())
  }, [publications, sort])

  return (
    <div className="publication-list">
      {groups.map(([group, items]) => (
          <section className="publication-year-group" data-group-tone={groupToneFor(group, sort)} key={group}>
            <div className="publication-group-marker">
              <h2>{group}</h2>
              <span className="publication-marker-dot" aria-hidden="true" />
            </div>
            <div className="publication-rail" aria-hidden="true" />
            <div className="publication-year-items">
              {items.map((publication) => (
                <PublicationCard publication={publication} key={publication.id} />
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}

function App() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [query, setQuery] = useState("")
  const [activeType, setActiveType] = useState<FilterType>("All")
  const [sort, setSort] = useState<SortMode>("newest")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    loadPublications()
      .then((items) => {
        if (!isMounted) return
        setPublications(items)
        setError("")
      })
      .catch((loadError: Error) => {
        if (!isMounted) return
        setError(loadError.message)
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredPublications = useFilteredPublications(publications, activeType, query, sort)
  const activeSortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "Newest first"

  return (
    <div className="publications-shell dark">
      <header className="publications-nav">
        <a className="publications-brand" href={sitePath("index.html")} aria-label="IISL home">
          <img src={logoSrc} alt="Intelligent Infrastructure Systems Laboratory" />
        </a>
        <nav aria-label="Main navigation">
          {navItems.map((item) => (
            <Button
              asChild
              className={item.label === "Publications" ? "is-active" : ""}
              key={item.label}
              variant="ghost"
            >
              <a href={item.href}>{item.label}</a>
            </Button>
          ))}
        </nav>
      </header>

      <main className="publications-main">
        <section className="publications-heading">
          <h1>Publications</h1>
        </section>

        <div className="publication-search">
          <Search aria-hidden="true" />
          <Input
            aria-label="Search publications"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search publications"
            type="search"
            value={query}
          />
        </div>

        <div className="publication-controls">
          <ToggleGroup
            aria-label="Publication type"
            className="publication-type-controls"
            onValueChange={(value) => value && setActiveType(value as FilterType)}
            type="single"
            value={activeType}
            variant="outline"
          >
            {typeFilters.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="publication-sort-controls">
            <span aria-live="polite">{filteredPublications.length} results</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Sort publications" className="publication-sort-trigger" variant="ghost">
                  <span>{activeSortLabel}</span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="publication-sort-menu w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Sort publications</DropdownMenuLabel>
                  {sortOptions.map((option) => (
                    <DropdownMenuItem key={option.value} onSelect={() => setSort(option.value)}>
                      {option.label}
                      {sort === option.value ? (
                        <Check aria-hidden="true" className="publication-sort-check" />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />

        {isLoading ? <LoadingList /> : null}
        {!isLoading && error ? (
          <Card className="publication-empty">
            <CardHeader>
              <CardTitle>Publication sources could not be loaded</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {!isLoading && !error && filteredPublications.length === 0 ? (
          <Card className="publication-empty">
            <CardHeader>
              <CardTitle>No publications match the current filters</CardTitle>
              <CardDescription>Reset the filters or search for a different author, title, year, or topic.</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {!isLoading && !error && filteredPublications.length > 0 ? (
          <PublicationGroups publications={filteredPublications} sort={sort} />
        ) : null}
      </main>
    </div>
  )
}

export default App
