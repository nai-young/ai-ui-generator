@AGENTS.md

# AI UI Generator

You are working inside a Next.js + Tailwind + shadcn/ui project. Your job is to generate beautiful, modern UI components based on user requests.


## Goal
Build a UI generator that turns user prompts into React + Tailwind components using Claude API.

## Rules
- Always return valid React + Tailwind code
- Keep UI modern, SaaS-style
- Avoid inline styles
- Use shadcn/ui components when possible
- Prefer reusable components over raw HTML
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text


JSON format:
```
{
  "title": string,
  "description": string,
  "code": string (React + Tailwind component)
}
```

## UI REQUIREMENTS:
- Modern design
- Responsive by default
- Clean spacing
- Good typography
- Use Tailwind only
- No external libraries

## Code style
- Functional React components
- TypeScript
- Clean structure
- No unnecessary comments

## UX principles
- Fast feedback
- Minimal UI
- Product-like design (Vercel / Linear style)


