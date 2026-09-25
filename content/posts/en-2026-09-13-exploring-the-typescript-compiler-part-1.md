---
title: "Exploring the TypeScript Compiler Part 1: Why Go?"
slug: "exploring-the-typescript-compiler-part-1"
lang: en
publishedAt: "2026-09-13"
category: "tech"
---

This is Part 1 of an expanded and revised version of the [tskaigi 2026 Day 2 talk, “A History of TypeScript Compiler Design Through Constraints and Historical Context”](https://2026.tskaigi.org/talks/38).

- [Exploring the TypeScript Compiler Part 0: Overview](/en/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/en/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/en/blog/exploring-the-typescript-compiler-part-2)
- Part 3: Why TypeScript (Coming soon)
- Part 4: Roslyn and the Red-Green Tree (Coming soon)
- Part 5: JavaScript Madness🫠 (Coming soon)
- Part 6: What Changes with Go (Coming soon)

## Why Go

When Microsoft officially announced [typescript-go](https://github.com/microsoft/typescript-go) on March 11, 2025, its choice of language drew a lot of attention. Microsoft had chosen a language from Google rather than one of its own, and rewrites in Rust were common in the JavaScript ecosystem.

[A 10x faster TypeScript — with Anders Hejlsberg](https://www.youtube.com/watch?v=pNlq-EVld70)

Microsoft has already explained much of the reasoning:

- [typescript-go Discussion #411](https://github.com/microsoft/typescript-go/discussions/411)
- [Announcing TypeScript 7.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/)
- [reddit](https://www.reddit.com/r/javascript/comments/1j8s441/a_10x_faster_typescript/)

The reason Go was chosen seems to come down to this: it makes the port relatively straightforward while delivering good performance.

## A Port, Not a Rewrite

TypeScript has no specification that covers all of its behavior.[^1] The compiler's behavior itself is the only definitive reference. A replacement must reproduce edge cases and even bugs. Given that, backward compatibility with `tsc` is almost essential.

Rewriting the compiler while changing its design and data structures, yet preserving all of its behavior, would take an enormous amount of work. That makes a port that carries over the behavior as it is a viable option.

### The Obstacle of Circular References

Circular references posed another major obstacle for Rust. Rust's ownership model makes data structures with circular references difficult to represent.

The existing implementation makes extensive use of graph structures designed around garbage collection and traverses nodes both upward and downward. A language with garbage collection made it easier to port those structures directly than to redesign them around Rust's idioms.

The port had to preserve the existing structures while improving performance. Go offered four useful properties:

- Garbage collection, which handles data structures with circular references as JavaScript does
- Ahead-of-time compilation to machine code
- Value types, which can reduce allocations and improve memory layout
- Parallel execution using shared memory

Part 6 looks more closely at the performance-related properties in this list.

:::column[Rust and Circular References]
Of course, it is technically possible to reproduce these structures in Rust. Options include:

- Combining Rc and Weak
- Representing them with Vec and Index
- Using Arena Allocator + Index as an extension of that approach
- Using unsafe

These are all common ways to work around ownership constraints. Each requires careful thought about lifetimes, ownership, and how references are held, and each has tradeoffs.

There is a classic exercise that makes this complexity easy to experience: **doubly linked list**.

- push_front
- pop_front
- push_back
- pop_back

Implementing these operations quickly makes the complexity clear 🤓

:::

### Coding with Closures

The compiler's coding style was another factor in Go's favor. The TypeScript compiler uses surprisingly few classes.[^2] Instead, its main components are written as functions that use closures.[^3]

```ts
// Excerpt
export function createTypeChecker(host: TypeCheckerHost): TypeChecker {
  // Define state
  var scanner: Scanner | undefined;

  var typeCount = 0;
  var instantiationCount = 0;
  var currentNode: Node | undefined;

  var strictNullChecks = getStrictOptionValue(
    compilerOptions,
    "strictNullChecks",
  );

  // ...

  // Almost all type checking logic is declared within the scope of createTypeChecker
  function getTypeOfMappedSymbol(symbol: MappedSymbol) {
    if (!symbol.links.type) {
      // ...
      symbol.links.type ??= type;
    }
    return symbol.links.type;
  }

  return {
    getTypeOfMappedSymbol,
  };
}
```

This style happened to be well suited to mechanical conversion into Go code that defines a struct and attaches methods to it. The local variables captured by the closure map directly to struct fields, and the inner functions map to methods.

```go
// The local variables of createTypeChecker become fields
type Checker struct {
 id                 uint32
 program            Program
 compilerOptions    *core.CompilerOptions
 files              []*ast.SourceFile
 TypeCount          uint32
 instantiationCount uint32
 currentNode        *ast.Node
 strictNullChecks   bool
 // ...
}

// Attach each function as a method on the Checker struct
func (c *Checker) getTypeOfMappedSymbol(symbol *ast.Symbol) *Type {
 links := c.valueSymbolLinks.Get(symbol)
 if links.resolvedType == nil {
  mappedType := links.containingType
  // ...
  c.error(
   c.currentNode,
   diagnostics.Type_of_property_0_circularly_references_itself_in_mapped_type_1,
   c.symbolToString(symbol),
   c.TypeToString(mappedType),
  )
 }
 return links.resolvedType
}
```

Early in the port, the team appears to have used a tool that generated a starting point of syntactically valid Go code from the TypeScript compiler's code.

[jakebailey/ts-to-go](https://github.com/jakebailey/ts-to-go)

Together, these factors led to the choice of Go. The team reportedly tried other languages, including C# and Rust, as well.[^4]

:::column[The Class Refactoring That Never Happened]
One development drawback of using closures is that **splitting code across files is difficult**. This may not matter much in a small project. But the TypeScript compiler has a great deal of type checking logic, and writing it around closures caused that code to keep growing.

A well known example is checker.ts in the old TypeScript implementation. As of July 2026, that single file was about 3 MB and could not be displayed in GitHub's preview.

[checker.ts](https://github.com/microsoft/TypeScript/blob/28c68f49f846413d6c356394cc8cb2015e3aa264/src/compiler/checker.ts)

It also caused developer experience problems in editors: code folding did not work, error displays took several seconds to update, and the scrollbar could not be used to jump to the desired location.

To address this, someone experimented with refactoring checker.ts to use classes, with the aim of splitting it across files later.

[Crazy checker.ts refactor experiment (25kloc) #17861](https://github.com/microsoft/TypeScript/issues/17861)

The tests passed, but the experiment was not adopted. Internal benchmarks also measured type checking slowdowns of 16.6% to 24.1%.

Explaining the cause in detail would require some background on how JavaScript engines work, so here is a brief outline.

With classes, references to local variables in the closure become accesses through the instance object, `this`, in a form such as `this.property`.

An expression like `this.property` is an object property access. Engines such as V8 use hidden classes and inline caches to make those accesses fast. Even so, they may cost more than referring to a closure's local variable by name.

In a program such as the type checker, which repeats the same operations an enormous number of times, that small difference may have produced a meaningful performance gap. The TypeScript team has also pointed out that local variable access is faster than object property access.

[https://github.com/microsoft/TypeScript/issues/17861#issuecomment-767718112](https://github.com/microsoft/TypeScript/issues/17861#issuecomment-767718112)

Also, after converting closure functions to methods, they reportedly bound every method so it would not lose `this` when passed as a callback. The resulting extra allocations and indirect calls may have contributed to the slowdown.

:::

## Next

Go was chosen in part because it made the compiler easier to port while preserving its existing data structures and coding style, and it offered room for performance improvements.

But why does the TypeScript compiler use so many circular references and add information to the AST in the first place?

To explore that question, the next part takes a closer look at the TypeScript compiler's internal structure.

Continue to [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/en/blog/exploring-the-typescript-compiler-part-2).

[^1]: An early version (around v1.8) did have a specification, but it soon stopped being updated. [TypeScript Language Specification (archived)](https://github.com/microsoft/TypeScript/blob/v4.9.5/doc/TypeScript%20Language%20Specification%20-%20ARCHIVED.pdf)

[^2]: JavaScript did not have class syntax when TypeScript development began.

[^3]: For a refresher on closures, see [https://jsprimer.net/basic/function-scope/#closure](https://jsprimer.net/basic/function-scope/#closure).

[^4]: [TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=10qowKUW82U&t=483s)
