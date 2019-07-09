import { default as fsWithCallbacks } from "fs";
const fs = fsWithCallbacks.promises;
import { default as Parser, Range, SyntaxNode } from "tree-sitter";

export class Tokenizer {
  public static supportedLanguages = ["c-sharp", "haskell", "java", "javascript", "python"];

  /**
   * Returns true if the grammar of the given language is supported.
   *
   * @param language The name of the language to check
   */
  public static isSupportedLanguage(language: string): boolean {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Registers an additional language to Dolos. For this to work, the supporting
   * module of the name `tree-sitter-someLanguage` must first be installed manually
   * through yarn or npm.
   *
   * The function will throw an error when the supported module is not found.
   *
   * @param language The name of the language to register
   */
  public static registerLanguage(language: string) {
    try {
      require("tree-sitter-" + language);
    } catch (error) {
      throw new Error(`The module 'tree-sitter-${language}' could not be found`);
    }
    this.supportedLanguages.push(language);
  }

  public readonly language: string;
  private readonly parser: Parser;

  /**
   * Creates a new tokenizer of the given language. Will throw an error when the given
   * language is not supported. See Tokenizer.supportedLanguages for a list of all
   * supported languages.
   *
   * @param language The language to use for this tokenizer.
   */
  constructor(language: string) {
    if (!Tokenizer.isSupportedLanguage(language)) {
      throw new Error(`Language '${language}' is not supported`);
    }

    this.language = language;
    this.parser = new Parser();
    // tslint:disable-next-line: no-var-requires
    const languageModule = require("tree-sitter-" + language);
    this.parser.setLanguage(languageModule);
  }

  /**
   * Runs the parser on a file with the given name. Returns a stringified version
   * of the abstract syntax tree.
   *
   * @param fileName The name of the file to parse.
   */
  public async tokenizeFile(fileName: string): Promise<string> {
    const fileContent = await fs.readFile(fileName, "utf8");
    return this.tokenize(fileContent);
  }

  /**
   * Runs the parser on a given string. Returns a stringified version of the abstract
   * syntax tree.
   *
   * @param text The text string to parse
   */
  public tokenize(text: string): string {
    const tree = this.parser.parse(text);
    return tree.rootNode.toString();
  }

  public async *mappedTokenize(fileName: string): AsyncIterableIterator<[string, Range]> {
    const fileContent = await fs.readFile(fileName, "utf8");
    const tree = this.parser.parse(fileContent);

    function* tokenizeNode(node: SyntaxNode): IterableIterator<[string, Range]> {
      const range: Range = {
        end: node.endPosition,
        start: node.startPosition,
      };

      yield ["(", range];
      // "(node.type child1 child2 ...)"
      for (const c of node.type) {
        yield [c, range];
      }

      for (const child of node.namedChildren) {
        yield [" ", range];
        yield* tokenizeNode(child);
      }
      yield [")", range];
    }

    yield* tokenizeNode(tree.rootNode);
  }
}
