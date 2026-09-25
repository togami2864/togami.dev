---
title: "Exploring the TypeScript Compiler Part 0: Overview"
slug: "exploring-the-typescript-compiler-part-0"
lang: en
publishedAt: "2026-09-12"
category: "tech"
---

This article is an expanded and revised version of the [tskaigi 2026 Day 2 talk, “A History of TypeScript Compiler Design Through Constraints and Historical Context”](https://2026.tskaigi.org/talks/38).

TypeScript's port to Go prompted a question: “Why not Rust?” One obstacle cited was the compiler's heavy use of circular references and its reliance on GC The TypeScript compiler has many other distinctive implementation choices as well.

These choices are not simply unusual. They reflect constraints such as the era in which TypeScript was created, JavaScript as its runtime environment, editor integration, and backward compatibility. As the scale of the code it handled grew, it also became harder to improve performance through JavaScript optimizations alone.

Starting with the question “Why Go?”, this series traces the TypeScript compiler's internal structure and how its design came about. Then it looks at which constraints the Go port removes and how it improves performance while preserving existing behavior.

Part 1 explains why Go was chosen. It examines how the need to preserve backward compatibility, along with the compiler's existing data structures and coding style, influenced the choice of language.

Part 2 follows the steps the TypeScript compiler takes before type checking. It covers the relationships among the AST, Symbol, and Binder, establishing the internal structure needed for the later discussion.

Part 3 goes back to the era when TypeScript was created to understand the background behind that design. It reviews the state of the Web, JavaScript, and Microsoft at the time, and what TypeScript was trying to solve.

Part 4 looks at Roslyn, the C# compiler, as a point of comparison. It explains the properties needed for editor integration and how red-green trees provide them.

Part 5 considers why the TypeScript compiler did not adopt red-green trees and instead developed its own structure. Looking at the JavaScript runtime environment of the time helps reveal the intent behind the design covered in Part 2.

Finally, Part 6 explains how the Go port improves performance. It examines how compilation to machine code, memory layout using value types, and parallel processing with shared memory address the earlier constraints.

- [Exploring the TypeScript Compiler Part 0: Overview](/en/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/en/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/en/blog/exploring-the-typescript-compiler-part-2)
- Part 3: Why TypeScript (Coming soon)
- Part 4: Roslyn and the Red-Green Tree (Coming soon)
- Part 5: JavaScript Madness🫠 (Coming soon)
- Part 6: What Changes with Go (Coming soon)
