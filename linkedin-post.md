# LinkedIn post — Challenge 4 (StadiumIQ)

No em dashes. Paste into LinkedIn, add a screen recording or screenshot, and
put your GitHub and live links in the first comment (links in the post body can
reduce reach).

---

The FIFA World Cup 2026 will move millions of fans through stadiums across 3
countries and 3 languages. So I built StadiumIQ. 👇

It is a GenAI smart-stadium concierge and operations assistant, built for the
Hack2skill Smart Stadiums challenge.

Two people, one app:

For fans:
→ Ask in English, Spanish, or French and get an answer in the same language.
→ Real wayfinding: "How do I get to section 300?" returns turn-by-turn steps.
→ Accessibility first: toggle step-free routes and it avoids every staircase,
   routing you by elevator instead.

For venue staff:
→ A live crowd overview per gate and concourse.
→ Ranked recommendations, like "Gate A is critical at 95%, redirect fans to
   Gate B at 20%." Actions first, so the most urgent call is on top.

The part I care about most: the AI does not make things up.

Every answer is built from a verified venue knowledge base and a real
shortest-path routing engine (Dijkstra, with a step-free filter). Gemini only
rephrases that verified answer fluently in the fan's language. If there is no
model key, or the model call fails, it falls back to the exact same verified
answer. Grounded GenAI, not a confident guess.

Under the hood:
• React + TypeScript client, Express + TypeScript server, one container.
• Server-side API key only, validated input, security headers, rate limiting.
• 40 automated tests across routing, crowd logic, the API, and the UI.
• Deploys to Google Cloud Run in one command.

Sports venues are the perfect test for agentic AI: high stakes, huge crowds,
many languages, and zero tolerance for a wrong turn. Grounding is what makes it
trustworthy enough to actually use.

Building in public for #IndiaRuns by Hack2skill.

Repo and live demo in the comments. What would you want a stadium assistant to
do for you?

#Hack2skill #GenAI #FIFAWorldCup2026 #SmartStadiums #CloudRun #React
#TypeScript #Accessibility #AgenticAI #BuildInPublic
