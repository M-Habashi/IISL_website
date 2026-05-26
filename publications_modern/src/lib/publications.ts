export type PublicationType =
  | "Journal"
  | "Doctoral Dissertation"
  | "Masters Thesis"
  | "Technical Report"

export type Publication = {
  id: string
  type: PublicationType
  year: string
  title: string
  authors: string
  link: string
  source: string
  raw: string
  keywords: string[]
}

type PublicationSource = {
  url: string
  type: PublicationType
}

const publicationPageBase = (() => {
  if (import.meta.env.DEV) {
    return "/pages/"
  }

  return window.location.pathname.includes("/publications_modern/dist/") ? "../../pages/" : "../pages/"
})()

export const publicationSources: PublicationSource[] = [
  { url: `${publicationPageBase}publicationjo.html`, type: "Journal" },
  { url: `${publicationPageBase}publicationdoc.html`, type: "Doctoral Dissertation" },
  { url: `${publicationPageBase}publicationms.html`, type: "Masters Thesis" },
  { url: `${publicationPageBase}publicationtr.html`, type: "Technical Report" },
]

function clean(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/Â /g, " ")
    .replace(/Â/g, "")
    .replace(/â€“|â€”/g, "-")
    .replace(/â€/g, "-")
    .replace(/â€œ|â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/Ã±/g, "n")
    .replace(/Ã³/g, "o")
    .replace(/Ã­/g, "i")
    .replace(/Ã¶/g, "o")
    .replace(/Ã¼/g, "u")
    .replace(/\s+/g, " ")
    .trim()
}

function yearFrom(text: string) {
  const years = clean(text).match(/\b(19|20)\d{2}\b/g)
  return years?.[0] ?? "Undated"
}

function absoluteUrl(url: string, base: string) {
  try {
    return new URL(url, base).href
  } catch {
    return url
  }
}

function titleFrom(node: Element, type: PublicationType) {
  const link = node.querySelector("a")
  if (link) {
    return clean(link.textContent ?? "")
  }

  const text = clean(node.textContent ?? "")
  if (type === "Technical Report") {
    return clean(text.match(/"([^"]+)"/)?.[1] ?? text)
  }

  return text
}

function authorsFrom(node: Element, title: string, type: PublicationType) {
  const clone = node.cloneNode(true) as Element
  const link = clone.querySelector("a")
  if (link) {
    link.textContent = ""
  }

  let text = clean(clone.textContent ?? "")
  const year = yearFrom(text)
  const yearIndex = text.indexOf(year)

  if (type === "Technical Report") {
    text = text.replace(/^IISL_Report_\d+:\s*/i, "")
  }

  if (yearIndex > -1) {
    text = clean(text.slice(0, yearIndex))
  }

  text = text.replace(/[;,:\s(]+$/g, "")

  if (!text || text.length < 3) {
    text = clean(node.textContent ?? "").replace(title, "")
  }

  return clean(text)
}

function keywordsFor(item: Pick<Publication, "title" | "authors" | "raw" | "type">) {
  const haystack = `${item.title} ${item.authors} ${item.raw}`.toLowerCase()
  const rules: Array<[string, RegExp]> = [
    ["RTHS", /rths|hybrid simulation|real-time|real time/i],
    ["Multi-actuator systems", /multi-actuator|multiple actuator|actuator placement/i],
    ["Structural health monitoring", /health monitoring|damage detection|inspection|condition/i],
    ["Wireless sensing", /wireless|sensor/i],
    ["Wireless control", /wireless structural control|wireless control/i],
    ["Structural control", /control|damper|base isolation|actuator/i],
    ["Computer vision", /vision|image|visual|classification|localization/i],
    ["Lunar habitats", /lunar|space habitat|extraterrestrial|habitat/i],
    ["ISRU materials", /isru|in situ resource|regolith|landing pad|launching pad/i],
    ["Deep space missions", /deep space|space mission|mission|contingency/i],
    ["Seismic resilience", /seismic|earthquake|fragility|vulnerab/i],
    ["Seismic isolation", /seismic isolator|base isolator|isolation|isolated building/i],
    ["Soil-structure interaction", /soil-structure|soil structure|bridge-soil|ssi\b/i],
    ["System identification", /identification|model updating|bayesian|kalman/i],
    ["Bridge systems", /bridge|deck/i],
    ["Concrete infrastructure", /concrete|reinforced concrete|cementitious/i],
    ["Corrosion deterioration", /corrosion|deterioration|defect/i],
    ["Cyber-physical testing", /cyber-physical|testbed|thermomechanical/i],
    ["Data-driven methods", /data-driven|data driven|data assimilation|data fusion/i],
    ["Machine learning", /machine learning|neural|deep learning|artificial intelligence|ai\b/i],
    ["Anomaly detection", /anomaly|autoencoder|outlier|novelty detection/i],
    ["Digital twins", /digital twin|model calibration|surrogate/i],
    ["Resilience assessment", /resilience|resilient|recovery|risk|reliability/i],
    ["Optimization", /optimization|optimal|adaptive|genetic algorithm/i],
    ["Experimental testing", /experiment|shake table|laboratory|benchmark/i],
    ["Large-scale structures", /large-scale|large scale|full-scale|full scale/i],
    ["Building systems", /building|frame|floor|story|stories/i],
    ["Infrastructure systems", /infrastructure|civil infrastructure|lifeline/i],
    ["Smart structures", /smart structure|smart infrastructure|intelligent infrastructure/i],
    ["Finite element modeling", /finite element|fe model|numerical model/i],
    ["Uncertainty quantification", /uncertainty|probabilistic|stochastic/i],
    ["Sensing networks", /sensing network|sensor network|distributed sensing/i],
    ["Active sensing", /active sensing|information fusion|sensor fusion/i],
    ["Vibration", /vibration|modal|dynamic response|frequency/i],
    ["Wind engineering", /wind|aeroelastic|hurricane/i],
    ["Fault tolerance", /fault|failure|robust|stability|time delay/i],
    ["Displacement measurement", /displacement|deformation|strain|measurement/i],
    ["Lifecycle management", /lifecycle|life-cycle|maintenance|asset management/i],
    ["Pedestrian interaction", /pedestrian|gait|human-structure|human structure/i],
    ["Nonlinear dynamics", /nonlinear|hysteretic|ductility|plasticity/i],
    ["Structural materials", /material|materials|mechanical properties|rubber|tire/i],
    ["Power systems", /power system|grid|microgrid|energy/i],
    ["Robotics", /robot|autonomous|navigation/i],
  ]

  const found = rules
    .filter((rule) => rule[1].test(haystack))
    .map((rule) => rule[0])

  return (found.length ? found : [item.type]).slice(0, 5)
}

function parseSource(source: PublicationSource, html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const nodes = Array.from(doc.querySelectorAll(".content_main p"))

  return nodes
    .map((node, index) => {
      const title = titleFrom(node, source.type)
      const link = node.querySelector("a")
      const text = clean(node.textContent ?? "")
      const item: Publication = {
        id: `${source.type}-${index}`,
        type: source.type,
        year: yearFrom(text),
        title,
        authors: authorsFrom(node, title, source.type),
        link: link ? absoluteUrl(link.getAttribute("href") ?? "", source.url) : "",
        source: source.url,
        raw: text,
        keywords: [],
      }

      item.keywords = keywordsFor(item)
      return item
    })
    .filter((item) => item.title && item.raw.length > 10)
}

export async function loadPublications() {
  const groups = await Promise.all(
    publicationSources.map(async (source) => {
      const response = await fetch(source.url)

      if (!response.ok) {
        throw new Error(`${source.url} returned ${response.status}`)
      }

      return parseSource(source, await response.text())
    }),
  )

  return groups.flat()
}

export function typeLabel(type: PublicationType) {
  if (type === "Doctoral Dissertation") return "Thesis"
  if (type === "Masters Thesis") return "Thesis"
  if (type === "Technical Report") return "Report"
  return type
}
