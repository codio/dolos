import { fileToTokenizedFile } from "@/api/utils";
import {
  Pair,
  Kgram,
  Metadata,
  Fragment,
  PairedOccurrence,
  Hash,
} from "@/api/models";
import {
  Fragment as DolosFragment,
  Options,
  Index,
} from "@dodona/dolos-lib";
import * as Comlink from "comlink";

// Parse a list of Dolos fragments into a list of fragment models.
function parseFragments(
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
async function populateFragments(
  pair: Pair,
  metadata: Metadata,
  kgrams: Kgram[],
): Promise<Pair> {
  const customOptions = metadata;
  delete customOptions.maxFingerprintCount;
  delete customOptions.maxFingerprintPercentage;
  const kmers = kgrams;

  const options = new Options(customOptions);
  const index = new Index(null, options);
  const leftFile = fileToTokenizedFile(pair.leftFile);
  const rightFile = fileToTokenizedFile(pair.rightFile);
  const report = await index.compareTokenizedFiles([leftFile, rightFile]);
  const reportPair = report.getPair(leftFile, rightFile);

  const kmersMap: Map<Hash, Kgram> = new Map();
  for (const kmerKey in kmers) {
    const kmer = kmers[kmerKey];
    kmersMap.set(kmer.hash, kmer);
  }
  pair.fragments = parseFragments(reportPair.buildFragments(), kmersMap);

  return pair;
}


const expose = {
  populateFragments,
};

Comlink.expose(expose);

export type DataWorker = typeof expose;
