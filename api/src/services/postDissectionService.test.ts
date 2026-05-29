import test from "node:test";
import assert from "node:assert/strict";

import { parsePostDissectionResult } from "./postDissectionService.js";

test("parsePostDissectionResult parses structured analysis output", () => {
  const result = parsePostDissectionResult(
    JSON.stringify({
      thesis: "The post sells a contrarian lesson about shipping faster by reducing friction.",
      audience: "Founders and operators",
      cta: "Invite readers to rethink their process",
      emotionalTrigger: "Curiosity and urgency",
      proofType: "Personal anecdote and operating insight",
      alternateHooks: ["Most teams think speed is the problem.", "The real bottleneck is usually this.", "I kept seeing the same mistake."],
      hook: {
        title: "Contrarian truth hook",
        shortDescription: "Open with a surprising observation that challenges the default assumption.",
        longDescription: "Use a sharp claim that makes the reader pause and inspect their own process.",
        icon: "Sparkles",
        tags: ["contrarian", "curiosity"],
        examples: ["Everyone talks about speed. Almost nobody fixes the bottleneck."],
        whenToUse: "Use when the post needs a quick pattern break.",
        psychologicalEffect: "Creates tension and invites a read to resolve it."
      },
      postStyle: {
        title: "Contrarian lesson post",
        shortDescription: "A short reflective post built around a surprising lesson.",
        longDescription: "Lead with the lesson, show the tension, then land the operating principle.",
        icon: "CalendarDays",
        tags: ["lesson", "reflection"],
        structure: "Hook, tension, lesson, takeaway",
        expectedHooks: ["Curiosity opener", "Contrarian claim"],
        outcome: "Reader understands the lesson and remembers the framing."
      }
    })
  );

  assert.equal(result.hook.title, "Contrarian truth hook");
  assert.equal(result.postStyle.structure, "Hook, tension, lesson, takeaway");
  assert.equal(result.alternateHooks.length, 3);
});

test("parsePostDissectionResult sanitizes raw control characters inside strings", () => {
  const result = parsePostDissectionResult(`{
    "thesis": "The post uses a line break
and a tab	inside a string.",
    "audience": "Operators",
    "cta": "Try the pattern",
    "emotionalTrigger": "Curiosity",
    "proofType": "Practical experience",
    "alternateHooks": ["First hook", "Second hook", "Third hook"],
    "hook": {
      "title": "Hook",
      "shortDescription": "Short",
      "longDescription": "Long",
      "tags": ["a"],
      "examples": ["Example"],
      "whenToUse": "Now",
      "psychologicalEffect": "Interest"
    },
    "postStyle": {
      "title": "Style",
      "shortDescription": "Short",
      "longDescription": "Long",
      "structure": "1. Hook\n2. Body",
      "expectedHooks": ["Hook"],
      "outcome": "Result"
    }
  }`);

  assert.equal(result.thesis, "The post uses a line break\nand a tab\tinside a string.");
  assert.equal(result.hook.title, "Hook");
  assert.equal(result.postStyle.structure, "1. Hook\n2. Body");
});