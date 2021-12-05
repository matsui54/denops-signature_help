import { assertEquals } from "./deps.ts";
import {
  convertInputToMarkdownLines,
  getHighlights,
  getMarkdownFences,
} from "./markdown.ts";
import { convertSignatureHelpToMarkdownLines } from "./markdown.ts";
import { SignatureHelp } from "./types.ts";

Deno.test("convertInputToMarkdownLines", () => {
  assertEquals(convertInputToMarkdownLines("hoge\nfoo", ["var"]), [
    "var",
    "hoge",
    "foo",
  ]);
  assertEquals(
    convertInputToMarkdownLines({ kind: "plaintext", value: "hoge\nfoo" }, [
      "var",
    ]),
    [
      "var",
      "<text>",
      "hoge",
      "foo",
      "</text>",
    ],
  );
  assertEquals(
    convertInputToMarkdownLines({ language: "c", value: "hoge\nfoo" }, [
      "var",
    ]),
    [
      "var",
      "```c",
      "hoge",
      "foo",
      "```",
    ],
  );
});

Deno.test("getHighlights", () => {
  assertEquals(
    getHighlights([
      "hoge",
      "```c",
      "int a = 1",
      "a=20",
      "```",
      "print",
      "```python",
      "a = 10",
      "```",
    ]),
    [[
      "hoge",
      "int a = 1",
      "a=20",
      "print",
      "a = 10",
    ], [{
      ft: "c",
      start: 2,
      finish: 3,
    }, {
      ft: "python",
      start: 5,
      finish: 5,
    }]],
  );
});

Deno.test("getMarkdownFences", () => {
  assertEquals(getMarkdownFences(["ts=typescript", "foo=hoge"]), {
    ts: "typescript",
    foo: "hoge",
  });
});

const result_ccls: SignatureHelp = {
  "activeParameter": 0,
  "activeSignature": 0,
  "signatures": [
    {
      "documentation": "no args s1",
      "label": "func() -> int",
      "parameters": [],
    },
    {
      "documentation": "one int arg s2",
      "label": "func(int a) -> int",
      "parameters": [{ "label": [5, 10] }],
    },
    {
      "documentation": "one ref arg s3",
      "label": "func(int &a) -> int",
      "parameters": [{ "label": [5, 11] }],
    },
    {
      "documentation": "on pointer s3",
      "label": "func(int *a) -> int",
      "parameters": [{ "label": [5, 11] }],
    },
    {
      "documentation": "two args s4",
      "label": "func(int a, int b) -> int",
      "parameters": [{ "label": [5, 10] }, { "label": [12, 17] }],
    },
    {
      "documentation": "three args",
      "label": "func(int a, int b, int c) -> int",
      "parameters": [{ "label": [5, 10] }, { "label": [12, 17] }, {
        "label": [19, 24],
      }],
    },
  ],
};
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeSignature = 1;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeSignature = 2;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeSignature = 3;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeSignature = 4;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeSignature = 5;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeParameter = 1;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "", [","]));
result_ccls.activeParameter = 2;
console.log(convertSignatureHelpToMarkdownLines(result_ccls, "c", [","]));

const result = {
  activeParameter: 0,
  activeSignature: 0,
  signatures: [
    {
      documentation:
        "Date returns the Time corresponding to\n\tyyyy-mm-dd hh:mm:ss + nsec nanoseconds\nin the appropriate zone for that time in the given location.\n\nThe month, day, hour, min, sec, and nsec values may be outside\ntheir usual ranges and will be normalized during the conversion.\nFor example, October 32 converts to November 1.\n\nA daylight savings time transition skips or repeats times.\nFor example, in the United States, March 13, 2011 2:15am never occurred,\nwhile November 6, 2011 1:15am occurred twice. In such cases, the\nchoice of time zone, and therefore the time, is not well-defined.\nDate returns a time that is correct in one of the two zones involved\nin the transition, but it does not guarantee which.\n\nDate panics if loc is nil.\n",
      label:
        "Date(year int, month time.Month, day int, hour int, min int, sec int, nsec int, loc *time.Location) time.Time",
      parameters: [
        { label: "year int" },
        { label: "month time.Month" },
        { label: "day int" },
        { label: "hour int" },
        { label: "min int" },
        { label: "sec int" },
        { label: "nsec int" },
        { label: "loc *time.Location" },
      ],
    },
  ],
};
console.log(convertSignatureHelpToMarkdownLines(result, "", ["(", ","]));
result.activeParameter = 1;
console.log(convertSignatureHelpToMarkdownLines(result, "", []));
