export interface MockSource {
  title: string;
  url: string;
  publisher: string;
}

const PUBLISHERS = [
  "Reuters",
  "Bloomberg",
  "Financial Times",
  "Wall Street Journal",
  "Associated Press",
  "CNBC",
];

let counter = 0;

export function makeMockSource(headline: string): MockSource {
  counter += 1;
  const publisher = PUBLISHERS[counter % PUBLISHERS.length];
  const slug = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return {
    title: `${publisher}: ${headline}`,
    url: `https://example-news.test/${publisher.toLowerCase().replace(/\s+/g, "-")}/${slug}-${counter}`,
    publisher,
  };
}
