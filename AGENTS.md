<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Agents Guidelines

This repository contains an AI UI Generator.

## Agent behavior
- Prefer modifying existing components over creating new ones
- Keep UI consistent with shadcn/ui design system
- Do not introduce new dependencies without reason
- Maintain dark/light theme compatibility

## Architecture rules
- Frontend: Next.js App Router
- UI: shadcn/ui + Tailwind
- AI calls: server actions / API routes only

## Output expectations
- Production-ready UI
- Clean code
- No experimental patterns unless explicitly requested