import assert from "assert";
import { PairedOccurrence } from "./pairedOccurrence";
import { Region } from "../util/region";
import { Range } from "../util/range";

/**
 * A fragment is a collection of one or more consequent pairedOccurrences (kmers).
 *
 * A fragment can be extended with a new match if its kmer indices in both
 * files are directly after that of the fragment.
 */
export class Hunk {

  public pairedOccurrences: Array<PairedOccurrence>;
  public leftKmers: Range;
  public rightKmers: Range;
  public leftSelection: Region;
  public rightSelection: Region;
  public mergedData: string;

  private mergedStop: number;

  constructor(initial: PairedOccurrence) {
    this.pairedOccurrences = [initial];
    this.leftKmers = new Range(initial.left.index);
    this.rightKmers = new Range(initial.right.index);
    this.leftSelection = initial.left.location;
    this.rightSelection = initial.right.location;
    this.mergedData = initial.left.data;
    this.mergedStop = initial.left.stop;
  }

  private extendable(other: PairedOccurrence): boolean {
    return this.leftKmers.to == other.left.index &&
      this.rightKmers.to == other.right.index;
  }

  public extendWithMatch(other: PairedOccurrence): void {
    assert(this.extendable(other), "match does not extend this fragment");
    this.pairedOccurrences.push(other);

    if (this.mergedStop < other.left.start) {
      this.mergedData += "|" + other.left.data;
    } else {
      this.mergedData +=
        other.left.data.substring(this.mergedStop - other.left.start + 1);
    }
    this.mergedStop = other.left.stop;

    // Merge kmers index range
    this.leftKmers =
      Range.merge(this.leftKmers, new Range(other.left.index));
    this.rightKmers =
      Range.merge(this.rightKmers, new Range(other.right.index));

    // Merge selection
    this.leftSelection = Region.merge(
      this.leftSelection,
      other.left.location
    );
    this.rightSelection = Region.merge(
      this.rightSelection,
      other.right.location
    );

  }

  public extendWithFragment(other: Hunk): void {
    const otherFirst = other.pairedOccurrences[0];
    assert(this.extendable(otherFirst));

    this.pairedOccurrences = this.pairedOccurrences.concat(other.pairedOccurrences);

    if (this.mergedStop < other.leftKmers.from) {
      this.mergedData += "|" + other.mergedData;
    } else {
      this.mergedData +=
        other.mergedData.substring(this.mergedStop - other.leftKmers.from + 1);
    }

    this.mergedStop = other.mergedStop;

    // merge kmer ranges
    this.leftKmers =
      Range.merge(this.leftKmers, other.leftKmers);
    this.rightKmers =
      Range.merge(this.rightKmers, other.rightKmers);

    // merge selections
    this.leftSelection = Region.merge(
      this.leftSelection,
      other.leftSelection,
    );
    this.rightSelection = Region.merge(
      this.rightSelection,
      other.rightSelection,
    );

  }

}
