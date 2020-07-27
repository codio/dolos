#!/usr/bin/env node
import * as Utils from "./lib/util/utils";
import { Command } from "commander";
import { Dolos } from "./dolos";
import { Options } from "./lib/util/options";
import { TerminalPresenter } from "./lib/presenter/terminalPresenter";
import { closestMatch, error, setLogging, warning } from "./lib/util/utils";
import { WebPresenter } from "./lib/presenter/webPresenter";
import { CsvPresenter } from "./lib/presenter/csvPresenter";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");
const program = new Command();


program.version(pkg.version, "-v --version", "Output the current version.")
  .description("Plagiarism detection for programming exercises");

program
  .option(
    "-V, --verbose",
    Utils.indent("Enable verbose logging."),
    false
  )
  .option(
    "-l, --language <language>",
    Utils.indent(
      "Programming language used in the submitted files.",
      Options.defaultLanguage
    ),
    Options.defaultLanguage
  )
  .option(
    "-b, --base <base>",
    Utils.indent(
      "Specifies a base file. Matches with code from this file will never be " +
      "reported in the output. A typical base file is the supplied code for " +
      "an exercise. When this option is used in conjunction with the -d flag " +
      "then the location given is interpreted as a directory and all files " +
      "that are a child of that directory will be used as a base file. When " +
      "this is the case, a path to the directory is needed from the current " +
      "working directory. The name of the directory won't be enough."
    )
  )
  .option(
    "-d, --directory",
    Utils.indent("Specifies that submision are per directory, not by file. ")
  )
  .option(
    "-m, --maximum-hashing-count <integer>",
    Utils.indent(
      "The -m option sets the maximum number of times a given hashing may " +
      "appear before it is ignored. A code fragment that appears in many " +
      "programs is probably legitimate sharing and not the result of " +
      "plagiarism. With -m N any hashing appearing in more than N programs is " +
      "filtered out. This option has precedence over the -M option, " +
      "which is set to 0.9 by default."
    ),
    x => parseFloat(x)
  )
  .option(
    "-M --maximum-hashing-percentage <fraction>",
    Utils.indent(
      "The -M option sets how many percent of the files the hashing may appear " +
      "before it is ignored. A hashing that appears in many programs is " +
      "probably legitimate sharing and not the result of plagiarism. With -M " +
      "N any hashing appearing in more than N percent of the files is filtered " +
      "out. Must be a value between 0 and 1. This option is ignored when " +
      "comparing only two files, because each match appear in 100% of the " +
      "files",
    ),
    x => parseFloat(x),
  )
  .option(
    "-c --compare",
    Utils.indent(
      "Print a comparison of the matches even if analysing more than two " +
      "files. Only valid when the output is set to 'terminal'."
    )
  )
  .option(
    "-C, --comment <string>",
    Utils.indent("Comment string that is attached to the generated report")
  )
  .option(
    "-L, --limit <integer>",
    Utils.indent(
      "Specifies how many matching file pairs are shown in the result. " +
      "All pairs are shown when this option is omitted."
    ),
    x => parseFloat(x)
  )
  .option(
    "-s, --minimum-fragment-length <integer>",
    Utils.indent(
      "The minimum length of a fragment. Every fragment shorter than this is " +
      "filtered out."
    ),
    x => parseFloat(x),
    Options.defaultMinFragmentLength
  )
  .option(
    "-S, --minimum-similarity <fraction>",
    Utils.indent(
      "The minimum similarity between two files. " +
      "Must be a value between 0 and 1",
      Options.defaultMinSimilarity,
    ),
    x => parseFloat(x),
  )
  .option(
    "-g, --maximum-gap-size <integer>",
    Utils.indent(
      "If two fragments are close to each other, they will be merged into a " +
      "single fragment if the gap between them is smaller than the given " +
      "number of lines.",
      Options.defaultMaxGapSize
    ),
    x => parseFloat(x),
    Options.defaultMaxGapSize
  )
  .option(
    "-f, --output-format <format>",
    Utils.indent(
      "Specifies what format the output should be in, current options are: " +
      "terminal/console, csv, html.", "terminal"
    ),
    "terminal"
  )
  .option(
    "--sort <field>",
    Utils.indent(
      "Which field to sort the results by. Options are: similarity, continuous and total", "total"
    ),
    "total"
  )
  .option(
    "-v, --cluster-cut-off-value <integer>",
    Utils.indent(
      "The minimum amount of lines needed before two files will be clustered " +
      "together",
      Options.defaultClusterMinMatches
    ),
    x => parseFloat(x),
    Options.defaultClusterMinMatches
  )
  .option(
    "-k, --kmer-length <integer>",
    Utils.indent("The length of each k-mer fragment.", Options.defaultKmerLength),
    x => parseFloat(x),
    Options.defaultKmerLength
  )
  .option(
    "-w, --kmers-in-window <integer>",
    Utils.indent(
      "The size of the window that will be used (in kmers).",
      Options.defaultKmerLength
    ),
    x => parseFloat(x),
    Options.defaultKmerLength
  )
  .arguments("<locations...>")
  .action(async locations => {
    if(program.verbose){
      setLogging("info");
    }

    if (locations.length < 3 && program.maximumHashPercentage) {
      warning("You have given a maximum hash percentage (with -M), but " +
        "you are comparing less than three files so matching hash will occur " +
        "in 100% of the files. You might not want to use this option.");
    }

    try {
      const dolos = new Dolos({
        base: program.base,
        clusterMinMatches: program.clusterCutOffValue,
        comment: program.comment,
        directory: program.directory,
        kmerLength: program.kmerLength,
        kmersInWindow: program.kmersInWindow,
        language: program.language,
        maxGapSize: program.maxGapSize,
        maxHashCount: program.maximumHashCount,
        maxHashPercentage: program.maxHashPercentage,
        maxMatches: program.filePairOutputLimit,
        minFragmentLength: program.minimumFragmentLength,
        minSimilarity: program.minimumSimilarity,
        limitResults: program.limit,
        sortBy: program.sort,
      });
      const analysis = await dolos.analyzePaths(locations);

      const presenter = closestMatch(program.outputFormat, {
        "terminal": () => new TerminalPresenter(analysis, dolos.options, program.compare),
        "console" : () => new TerminalPresenter(analysis, dolos.options, program.compare),
        "csv" : () => new CsvPresenter(analysis, dolos.options),
        "html": () => new WebPresenter(analysis, dolos.options),
        "web": () => new WebPresenter(analysis, dolos.options),
      });

      if(presenter == null) {
        throw new Error(`Invalid output format: ${program.format}`);
      }

      await presenter().present();
    } catch (err) {
      error(err.stack);
      process.exit(1);
    }
  })
  .parse(process.argv);
