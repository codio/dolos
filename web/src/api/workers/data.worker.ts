import { fileToTokenizedFile } from "@/api/utils";
import {
  Pair,
  Kgram,
  Metadata,
  Fragment,
  PairedOccurrence,
  Hash,
} from "@/api/models";
import { Fragment as DolosFragment, FingerprintIndex } from "@dodona/dolos-core";

// Parse a list of Dolos fragments into a list of fragment models.
export function parseFragments(
  dolosFragments: DolosFragment[],
  kmersMap: Map<Hash, Kgram>
): Fragment[] {
  return dolosFragments.map((dolosFragment: DolosFragment): Fragment | undefined => {
    const occurrences = dolosFragment.pairs.map((occurrence): PairedOccurrence | undefined => {
      const kgram = kmersMap.get(occurrence.fingerprint.hash);
      if (kgram === undefined) {
        console.log(`Kgram hash not found: ${occurrence}`);
        return undefined;
      }
      return {
        kgram,
        left: occurrence.left,
        right: occurrence.right,
      };
    });
    const filtered = occurrences.flatMap(f => f ? [f] : []);
    if (filtered.length > 0) {
      return {
        active: true,
        left: dolosFragment.leftSelection,
        right: dolosFragment.rightSelection,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data: dolosFragment.mergedData!,
        occurrences: filtered,
      };
    } else {
      return undefined;
    }
    
  }).flatMap(f => f ? [f] : []);
}

// Populate the fragments for a given pair.
export function populateFragments(
  pair: Pair,
  metadata: Metadata,
  kgrams: Kgram[]
): Pair {
  const customOptions = metadata;
  delete customOptions.maxFingerprintCount;
  delete customOptions.maxFingerprintPercentage;
  const kmers = kgrams;

  const index = new FingerprintIndex(customOptions.kgramLength, customOptions.kgramsInWindow);
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);
  index.addFiles([leftFile, rightFile]);
  const reportPair = index.getPair(leftFile, rightFile);

  const kmersMap: Map<Hash, Kgram> = new Map();
  for (const kmerKey in kmers) {
    const kmer = kmers[kmerKey];
    kmersMap.set(kmer.hash, kmer);
  }
  pair.fragments = parseFragments(reportPair.buildFragments(), kmersMap);

  return pair;
}
