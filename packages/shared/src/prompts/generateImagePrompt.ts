import type { PostTypeSelection } from "../schemas/workflowOutputs.js";
import type { WorkflowContextBundle } from "./workflowContext.js";

/**
 * Port of n8n agent "Generate Prompt to Generate Image".
 * Returns the full system-style instruction block; the LLM returns only the DALL-E prompt.
 */
export function buildGenerateImagePromptInstruction(
  ctx: WorkflowContextBundle,
  postType: PostTypeSelection,
  draft: string
): string {
  return `# LinkedIn Visual Generation Prompt

You are creating a single professional LinkedIn post visual optimized for DALL-E 3.

## INPUT DATA

**Post Type:**
${postType.type}

**Post Content:**
${draft}

**User Feedback:**
${ctx.userFeedback}

## DESIGN SPECIFICATIONS

**Color Palette:**
- Primary: Neon blue (#00D9FF)
- Background: Pure black (#000000)
- Text: White (#FFFFFF)
- Accents: Subtle gray only if needed

**Style Requirements:**
- Clean, flat design
- No gradients or shadows
- High contrast
- Sharp geometric shapes
- Minimalist line icons
- Professional LinkedIn aesthetic
- Generous negative space
- Mobile-optimized clarity

## OUTPUT REQUIREMENTS

Generate a single DALL-E 3 prompt (150-200 words) that:
1. Starts with technical specifications
2. Describes the core visual metaphor clearly
3. Specifies exact colors (black, neon blue, white)
4. Details composition and element placement
5. Emphasizes flat design and high contrast
6. Ends with quality and style modifiers
7. Includes "4:3 aspect ratio" requirement

Return ONLY the final DALL-E 3 prompt, no explanations or meta-commentary.`;
}
