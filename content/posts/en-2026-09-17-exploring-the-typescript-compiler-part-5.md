---
title: "Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠"
slug: "exploring-the-typescript-compiler-part-5"
lang: en
publishedAt: "2026-09-17"
category: "tech"
---

This is Part 5 of an expanded and revised version of the [tskaigi 2026 Day 2 talk, “A History of TypeScript Compiler Design Through Constraints and Historical Context”](https://2026.tskaigi.org/talks/38).

- [Exploring the TypeScript Compiler Part 0: Overview](/en/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/en/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/en/blog/exploring-the-typescript-compiler-part-2)
- [Exploring the TypeScript Compiler Part 3: Why TypeScript?](/en/blog/exploring-the-typescript-compiler-part-3)
- [Exploring the TypeScript Compiler Part 4: Roslyn and the Red-Green Tree](/en/blog/exploring-the-typescript-compiler-part-4)
- [Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠](/en/blog/exploring-the-typescript-compiler-part-5)
- [Exploring the TypeScript Compiler Part 6: What Go Unlocks](/en/blog/exploring-the-typescript-compiler-part-6)

Last time, we looked at Roslyn, Microsoft's C# compiler. We saw the properties a compiler needs to work well with an editor and the Red-Green Tree design that supports them.

An immutable Green Tree and Red nodes created when needed make it possible to:

- Run several analyses safely at the same time.
- Keep older versions available.
- Share as many nodes as possible to save memory.
- Access context when it is needed.

Did the TypeScript compiler use the same design? No. It developed a rather unusual design of its own, shaped in large part by the limits of JavaScript.

## No Practical Way to Run in Parallel

JavaScript around 2010, when TypeScript development began, was very different from today's JavaScript. ES5 had just arrived. There was no `const`, `let`, `() =>`, or `Promise`. ES6, a major turning point, was still five years away.

Node.js was around version 0.1 or 0.2 and had no Worker Threads API.[^1]

At the time, JavaScript had no practical way to share a tree across several threads and process it in parallel. So there was less reason to make the tree strictly immutable for that purpose.

## Memory Use

JavaScript programs also tend to use more memory overall than programs in statically typed languages.

The Red-Green Tree is designed with memory use in mind. Green nodes are small and can be shared, while Red nodes are created only when needed. Still, the real size of a node depends on the language used to build it.

Consider a very simple Green Tree node.[^2] In C# or Rust, the following structures take eight bytes:

```cs
internal struct GreenNode {
    public ushort Kind; // 2 bytes
    public int Fullwidth; // 4 bytes
} // 8 bytes in total, including padding
```

```rs
pub struct GreenNode {
    kind: u16, // 2 bytes
    width: u32, // 4 bytes
} // 8 bytes in total, including padding
```

Here is a similar JavaScript object:

```js
function GreenNode(kind, width) {
  this.kind = kind; // number
  this.width = width; // number
}

new GreenNode(kind, width);
```

On my machine with Node.js v26, this object takes 40 bytes.[^3]

In JavaScript, everything other than primitive values is an object. An object stores its property values and extra information that the JavaScript engine uses to manage it. This makes the total size larger. As this example shows, JavaScript can use several times as much memory for a similar structure.

## Control Over Memory Layout

With normal JavaScript objects, developers cannot closely control or guarantee that values are stored next to each other in memory. For example:

```js
const nodes = [
  { kind: 1, pos: 0, text: "foo" },
  { kind: 1, pos: 4, text: "bar" },
];
```

This array holds references to the objects, rather than the objects themselves stored side by side. Accessing their values requires following those references. The garbage collector also has to track many separate objects. These steps add a cost.

Part 6 looks at this in more detail.

## A Further Note

I have given several possible reasons here, but I do not work at Microsoft and was not involved in building the compiler. This is my view of the design. In 2026, however, someone who said they had worked on the early TypeScript compiler added a useful comment to another article. I was glad to see that it supported the general direction of my explanation.

The commenter says they worked on the early compiler and were a C# language designer.

[Tree-sitter vs. Language Servers](https://news.ycombinator.com/item?id=46729720)

Their explanation for not using a Red-Green Tree was roughly as follows:

> I wrote parts of the early TypeScript compiler. We did not use a Red-Green Tree for several reasons.
>
> The design was not efficient on the JavaScript engines of the time, mainly V8 and Chakra. Red-Green Trees work very well with .NET features such as structs. JavaScript lacked those features, making the design much more costly. The [Red-Green Trees design document](https://github.com/dotnet/roslyn/blob/main/docs/compilers/Design/Red-Green%20Trees.md) explains this further.
>
> The needs were also different. Roslyn had to support many threads sharing immutable data. TypeScript and JavaScript ran on one thread, so they did not have the same concern. Keeping the data structures mutable worked better with JavaScript engines at the time, without a major cost.
>
> The TypeScript parser does work incrementally, much like the [Roslyn Incremental Parser](https://github.com/dotnet/roslyn/blob/main/docs/compilers/Design/Incremental%20Parser.md). But it works at a level like the Red Tree, so it has extra work to update positions and parent pointers.
>
> In short, differences in engine speed and how the trees were used led us to a different design.

## The Choice at the Time

JavaScript at the time made it harder to gain the benefits of a Red-Green Tree. Memory use was also higher, so the TypeScript compiler needed another approach. As Part 2 explained, it made these choices:

- Give up strict immutability because it was not needed.
- Set the parent pointer on every node during binding, instead of creating it only when needed.
- Have the Binder create Symbols and SymbolTables, which AST nodes can access through fields such as `symbol` and `locals`. This helps save memory and makes access faster.
- During incremental analysis, reuse existing nodes and update their positions and parent pointers directly. This means the old tree cannot be kept as it was.

These choices let TypeScript work both as a compiler that processes a whole project and as a tool for editors. They also gave it reasonable response times while keeping memory use manageable.

## Next

The TypeScript compiler has many other special techniques to work well in JavaScript. But in recent years, large TypeScript projects have faced slow responses, long type checks, and high memory use. Small improvements could no longer keep up as projects grew. This led to the Go port.

Next, we will go beyond saying “Go is faster” and look at exactly what changed and why it helped.

[Part 6: What Go Unlocks](/en/blog/exploring-the-typescript-compiler-part-6).

[^1]: Browser Web Workers were just becoming available.

[^2]: The real Green Tree uses classes.

[^3]: JavaScript engines use many forms of optimization. Actual object size depends on the environment and how the engine optimizes it.
