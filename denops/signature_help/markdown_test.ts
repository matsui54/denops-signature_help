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

// Deno.test("getHighlights", () => {
//   assertEquals(
//     getHighlights([
//       "hoge",
//       "```c",
//       "int a = 1",
//       "a=20",
//       "```",
//       "print",
//       "```python",
//       "a = 10",
//       "```",
//     ]),
//     [[
//       "hoge",
//       "int a = 1",
//       "a=20",
//       "print",
//       "a = 10",
//     ], [{
//       ft: "c",
//       start: 2,
//       finish: 3,
//     }, {
//       ft: "python",
//       start: 5,
//       finish: 5,
//     }]],
//   );
// });

Deno.test("getMarkdownFences", () => {
  assertEquals(getMarkdownFences(["ts=typescript", "foo=hoge"]), {
    ts: "typescript",
    foo: "hoge",
  });
});

const resultCcls: SignatureHelp = {
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
const result = {
  activeParameter: 0,
  activeSignature: 0,
  signatures: [
    {
      documentation: "line1\nline2",
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

Deno.test("convertSignatureHelpToMarkdownLines", () => {
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "", [","], "full"),
    [["func() -> int", "no args s1"], [0, 0]],
  );
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "c", [","], "full", true),
    [[
      "```c",
      "func() -> int",
      "func(int a) -> int",
      "func(int &a) -> int",
      "func(int *a) -> int",
      "func(int a, int b) -> int",
      "func(int a, int b, int c) -> int",
      "```",
      "no args s1",
    ], [0, 0]],
  );
  resultCcls.activeSignature = 1;
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "", [","], "full"),
    [["func(int a) -> int", "one int arg s2"], [5, 10]],
  );
  resultCcls.activeSignature = 5;
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "", [","], "full"),
    [["func(int a, int b, int c) -> int", "three args"], [5, 10]],
  );
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "", [","], "virtual"),
    [["int a, int b, int c"], null],
  );
  resultCcls.activeParameter = 2;
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "c", [","], "full"),
    [
      ["```c", "func(int a, int b, int c) -> int", "```", "three args"],
      [19, 24],
    ],
  );
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "c", [","], "labelOnly"),
    [
      ["```c", "func(int a, int b, int c) -> int", "```"],
      [19, 24],
    ],
  );
  assertEquals(
    convertSignatureHelpToMarkdownLines(
      resultCcls,
      "",
      [","],
      "currentLabelOnly",
    ),
    [["int c"], null],
  );
  assertEquals(
    convertSignatureHelpToMarkdownLines(resultCcls, "", [","], "virtual"),
    [["int c"], null],
  );
  assertEquals(
    convertSignatureHelpToMarkdownLines(result, "ft", ["(", ","], "full"),
    [
      [
        "```ft",
        "Date(year int, month time.Month, day int, hour int, min int, sec int, nsec int, loc *time.Location) time.Time",
        "```",
        "line1",
        "line2",
      ],
      [5, 13],
    ],
  );
  result.activeParameter = 1;
  assertEquals(
    convertSignatureHelpToMarkdownLines(result, "ft", ["(", ","], "full"),
    [
      [
        "```ft",
        "Date(year int, month time.Month, day int, hour int, min int, sec int, nsec int, loc *time.Location) time.Time",
        "```",
        "line1",
        "line2",
      ],
      [15, 31],
    ],
  );
});
