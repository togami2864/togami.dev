---
title: "Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler"
slug: "exploring-the-typescript-compiler-part-2"
lang: en
publishedAt: "2026-09-14"
category: "tech"
---

<!-- markdownlint-disable MD033 -->

This is Part 2 of an expanded and revised version of the [tskaigi 2026 Day 2 talk, “A History of TypeScript Compiler Design Through Constraints and Historical Context”](https://2026.tskaigi.org/talks/38).

- [Exploring the TypeScript Compiler Part 0: Overview](/en/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/en/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/en/blog/exploring-the-typescript-compiler-part-2)
- Part 3: Why TypeScript (Coming soon)
- Part 4: Roslyn and the Red-Green Tree (Coming soon)
- Part 5: JavaScript Madness🫠 (Coming soon)
- Part 6: What Changes with Go (Coming soon)

In the previous part, I explained that one reason for choosing Go was that it made it easier to port the compiler while preserving its existing data structures. To understand those structures, this part follows the path from source code to type checking.

## A Quick Tour of the TypeScript Compiler

> [!CAUTION]
> This article does not cover the details of control flow analysis or type inference. It also does not cover the Transformer or Emitter.

The following diagram traces the TypeScript compiler's path from source code to type checking:

<figure class="figure-extra-wide figure-scrollable">
  <img src="/images/posts/2026-09-14-exploring-the-typescript-compiler-part-2/compiler-pipeline-flow.svg" alt="TypeScript compiler processing flow" />
  <figcaption>TypeScript compiler processing flow</figcaption>
</figure>

### Creating the Program

In a typical run, the compiler first reads `tsconfig` and determines which `.ts` files to check. It then initializes an object called `Program` from those files. `Program` manages multiple files and options, and coordinates later stages such as Parser, Binder, and Checker.

### Parse

Each `.ts` file to be analyzed passes through a scanner, which turns it into a sequence of tokens.[^1] Parser then builds an AST from those tokens. This is a common flow in compilers for other languages as well. You can inspect the result in TS AST Viewer.

[TypeScript AST Viewer](https://ts-ast-viewer.com/#files/N4Ig9AtghglgdgOgC4GcQC4QDMCucDGSMA9nAARQAmlAFFOmXDhAEYCmATgDRksNOtOASjLAAOuTIc2SHB3JQyAal4BuCQF8JVWgEYeYkACZDQ1WRAagA)

In the sections below, keep in mind that the root of a TypeScript AST is a `SourceFile` node.

<figure>
  <img src="/images/posts/2026-05-26-compiler-part2/ts-ast-viewer-sourcefile-root.png" alt="TS AST Viewer showing SourceFile as the root of the AST" />
  <figcaption>The root of the AST is SourceFile</figcaption>
</figure>

### Semantic Analysis

The AST produced by Parser represents the syntactic structure of the code. But that alone is not enough to detect type errors. **Code can be syntactically valid while being semantically invalid, and an AST alone makes such cases hard to catch.**

Consider this simple code:

```ts
function add(a: number, b: number) {
  return a + b;
}
add(1, "2"); // Argument of type 'string' is not assignable to parameter of type 'number'.
```

**The syntax of `add(1, "2")` is valid, but the argument types do not match, so it produces an error.** A person can quickly see why the call to `add` has a type error.

The compiler cannot make that judgment from the AST alone. The AST represents syntax. To check types, the compiler needs to find which declaration this `add` refers to and what arguments that function accepts.[^2]

This is where **Symbol** and the **Binder** that constructs it come in.

### Symbol

A Symbol represents the declaration and kind of entity an identifier refers to. It is the basic unit used to work with the results of name resolution. Scopes are represented mainly through containers in the AST and their SymbolTables, such as `locals`. **This is entirely different from the ES6 Symbol.**

Let's look at the earlier example again:

```ts
// Declaration of the function named add
function add(a: number, b: number) {
  return a + b;
}
add(1, "2"); // Reference to the entity named add
```

It is clear at a glance that the second `add` calls the previously declared `add` function. But the AST only represents syntax as a tree, so it treats the two occurrences of `add` as separate Identifier nodes, even though they have the same name.

A Symbol links a declaration and its references as one semantic entity.

```ts
export interface Symbol {
  flags: SymbolFlags; // Kind (variable? function? class?)
  escapedName: __String; // Name, a branded string type
  declarations?: Declaration[]; // AST nodes where this name is declared
  members?: SymbolTable; // Members of a class or interface
  exports?: SymbolTable; // Module exports
}
```

This object holds information such as:

- The name
- Where it was declared, including references to the original AST nodes (`declarations`)
- The kind of symbol (`BlockScopedVariable`, `Function`, `Class`, etc)

A `SymbolTable` is straightforward: it is a Map that records Symbols by name.

```ts
export type SymbolTable = Map<__String, Symbol>;
```

### Binder

The component that creates Symbols from the AST is the **Binder**. It creates symbols, symbol tables based on them, and nodes for control flow analysis.

In the earlier example, Binder first reaches the `function add()` declaration, a `FunctionDeclaration`, and creates roughly the following Symbol:

```ts
Symbol {
  flags: Function,
  escapedName: "add",
  declarations: [(FunctionDeclaration AST)]
}
```

It registers this Symbol in the `SymbolTable` held in the `locals` field of the AST node, which in this case is the root `SourceFile` node. `locals` records the mapping between names declared directly in that scope and their Symbols. This is also one of the distinctive steps in which semantic analysis information is added to an existing AST.

At the same time, Binder sets the `symbol` field of the `FunctionDeclaration` node to this Symbol.

After binding, the result looks like the following diagram.[^3]

<figure class="figure-wide figure-scrollable">
  <img src="/images/posts/2026-09-14-exploring-the-typescript-compiler-part-2/node-symbol-bidirectional-link.svg" alt="Mutual references between a declaration AST node and a Symbol" />
  <figcaption>Mutual references between a declaration AST node and a Symbol (parameters <code>a</code> and <code>b</code> are omitted)</figcaption>
</figure>

Next, Binder reaches `add(1, "2")`. Although this code references the `add` function, **Binder does not resolve the name at this point.** Binder only sets up the information needed for control flow analysis. Later, when Checker needs the target of the reference, it resolves the Symbol for the corresponding function declaration.

:::column[TypeScript and C#]
TypeScript and Roslyn, the C# compiler, have very similar internal concepts and terminology. I guess that's because both were developed at Microsoft and were designed by the same architect🤔

[Roslyn Overview](https://github.com/dotnet/roslyn/blob/main/docs/wiki/Roslyn-Overview.md)

The Roslyn wiki explains terms such as Symbol and Compilation, and mentions a Bind phase. Similar concepts appear in the TypeScript compiler, with fairly similar responsibilities.

Roslyn is important to this series, and Part 4 discusses it in detail.

:::

### Checker

Now for Checker. Starting from the AST, Checker follows Symbols to compute and look up types. Let's trace how it checks the call `add(1, "2")` in the earlier example.

When Checker finds the reference to `add`, it uses a function called `getResolvedSymbol` to resolve the Symbol it points to.

When it encounters the expression to check, it looks up the symbol registered under that name in the scope's SymbolTable, as shown in step 2 of the diagram.

Once it reaches the Symbol, step 3 shows how it can follow `declarations` to the AST node that declares the name.

<figure class="figure-wide figure-scrollable">
  <img src="/images/posts/2026-09-14-exploring-the-typescript-compiler-part-2/checker-symbol-resolution-flow.svg" alt="How Checker resolves a Symbol from the identifier add" />
  <figcaption>How Checker resolves the Symbol referenced by a name</figcaption>
</figure>

The parameters of this `add` function have type annotations, so their types are known to be `number, number`. The return type is not explicit, so it is inferred as `number` from `a + b`.

With those types known, Checker compares the types of the actual arguments, `1` (`number`) and `"2"` (`string`), with the corresponding parameter types. The second argument passes a `string` where a `number` is required, so Checker reports an error.

### Checker's Lazy Evaluation

Checker evaluates much of the type information lazily, resolving types on demand rather than all at once.

- What is the type of this value?
- What completion candidates are available?
- Is this assignment valid?

Each such query does not require computing every type in the project. Checker computes the requested type information at that point and caches the result.

In the Binder section, we saw how declarations are linked to Symbols and how SymbolTables are built. During that phase, references are established so that syntax and semantic information can be reached from the AST.

Those references form the basis for name resolution. **Starting from an AST node of interest, Checker can resolve the Symbols and type information it needs on demand.**

<figure class="figure-extra-wide figure-scrollable figure-spacious-top">
  <img src="/images/posts/2026-09-14-exploring-the-typescript-compiler-part-2/checker-lazy-type-resolution.svg" alt="Checker consults SourceFiles and returns type information in response to a client query" />
  <figcaption>Checker resolves type information lazily. For each query, it traverses the bound SourceFiles as needed.</figcaption>
</figure>

The Language Service holds a Program and a TypeChecker. When it needs type information for completions or error displays, it queries the TypeChecker. Another use case is typescript-eslint.

[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)

typescript-eslint has a feature called type-aware linting. Each rule traverses the AST and, when it reaches a relevant node, requests type information through the Compiler API.

When this feature is enabled, a Program and TypeChecker are prepared in advance based on `tsconfig` and other settings, and the target files are parsed and bound. But the types for the entire project are not all computed up front. A rule requests type information when it reaches a node that needs it, then checks the result that Checker resolves through lazy evaluation and caching.

Enabling type-aware linting increases execution time because it adds the steps through binding discussed above, as well as the actual type computations.

## Challenges for the Port

So far, we have followed the path from source code to type checking. The distinctive stage that presents a challenge for the port is binding.

A key characteristic is that **the AST carries semantic information.** Binder adds various kinds of information to the AST after parsing. In the code, Binder assigns values directly to fields of AST objects.

```ts
node.symbol = symbol // Symbol
node.locals = ... // SymbolTable
node.flowNode = ... // CFA
node.parent = ... // Pointer to parent
```

The TypeScript compiler puts Symbols, control flow analysis information, pointers to parent nodes, and scope information directly into the AST that represents syntax.

As a result, syntax tree data and semantic analysis data coexist in one mutable tree. The compiler writes this information directly into the AST instead of keeping it in a separate layer.

This implementation also creates many circular references. After binding, some representative relationships are:

- Parent and child AST nodes refer to each other.
- Declaration AST nodes and Symbols refer to each other.
- For members and exports, parent and child Symbols refer to each other.

The exact cycles depend on the kinds of nodes and Symbols involved. One benefit is that, starting from the AST, the compiler can access many kinds of information, including a node's parent, children, Symbol, and scope.

The porting challenge discussed in Part 1 was how to handle these reference relationships in the target language while preserving existing behavior.

## Next

This part covered the broad flow of the TypeScript compiler and some of its distinctive features. Starting in Part 3, the series turns to the historical context to explore why it has this structure.

[^1]: The diagram shows Scanner -> Parser for clarity. In the actual implementation, Parser calls Scanner to tokenize the input.

[^2]: This simple example could be handled with an implementation that uses only the AST. Real programs, however, span multiple files and can contain global declarations. Mapped Types, Generics, Conditional Types, and Namespace Merging make it harder to determine types from the AST alone.

[^3]: More precisely, all SourceFiles are bound when Checker is initialized, and a global SymbolTable is built.
