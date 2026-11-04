# Office life

See [README.md](README.md) for setup, controls and verification.

Use **Call to canteen** in an employee panel, or type **`/canteen`** in their chat. The employee reserves a dining seat, collects food or coffee, sits, finishes and returns. Busy employees and invitations exceeding the two-person break limit wait their turn. Three reserved pickup spots let multiple people use the serving table without sharing the same location. Its plates, food and drinks replace the old snack shelf.

Automatic break timing is independently randomized and shorter than before. Reserved seats, walking separation and strict table checks prevent sharing spots or walking through the serving/dining tables. Seated conversations keep bodies aligned with their chairs.

Adhi, Taha and Vaibav default to GPT through official ChatGPT sign-in. Abbu, Prox, Rewu and Ameen default to Gemini through Antigravity. Each employee's model can be changed and saved in **Connection settings**. No provider API keys are required. All seven have individual skills listed in [the manifest](agents/manifest.json). Gemini streams visible answer text when the CLI provides it; GPT displays the completed assistant message.

Use **Attach image** for image descriptions and visible-text extraction, or select **Create image** beside the composer for image generation. Image requests use Gemini/Antigravity for every role. Rewu handles design and branding; Adhi, Abbu and Prox cover web/SEO/GEO; Taha and Vaibav cover CRM/AI automation; Ameen oversees and optimizes the team.

The app must stay open for active client requests to finish. Closing a panel preserves its job; reloading or closing the browser interrupts it. Use **C** near an absent employee's desk, or team recall in the office menu, to bring people back to work.
