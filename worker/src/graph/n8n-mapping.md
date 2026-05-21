# n8n → LangGraph mapping

Source workflow: `linkedin-agent.json` (repo root).

```text
[Trigger: Manual | Execute Workflow + optional msg]
    → loadContext (4× Google Docs → merge → concat)
    → selectPostType (LLM + {type, goal, description})
    → chooseHook (LLM + {hook_type, sample_hook})
    → generatePost (LLM + {draft})
    → generateImagePrompt (LLM → DALL-E prompt string)
    → generateImage (OpenAI image)
    → uploadAsset (Google Drive)
    → notifySlack (block kit → #post-drafts)
    → persistDraft (data table row)
    → markReady (terminal audit: Delivered → Completed)
```

See `Documentation/decisions/0002-n8n-to-langgraph-port.md` for adapter boundaries and follow-ups.

**Context loading:** `loadContext` uses `ConfigSourceAdapter`. With `API_URL` set, `HttpConfigSourceAdapter` reads Postgres via `GET /internal/v1/workflow-context` (see `0003-user-workflow-context-postgres.md`).
