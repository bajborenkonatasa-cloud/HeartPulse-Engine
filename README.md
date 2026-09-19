# HeartPulse Engine ❤️‍🔥✨

Experimental SillyTavern extension that combines relationship dynamics, intimacy/kink guidance, persistent intentions, NPC state and a transparent “what the model sees” panel in one place.

## Design goals

- One extension instead of several overlapping roleplay helpers.
- No separate model/API request in the base mode.
- Per-chat state stored in SillyTavern `chatMetadata`.
- Prompt injection through SillyTavern's extension prompt mechanism.
- Manual control remains available at all times.
- Optional automatic state updates piggyback on the normal assistant reply using a compact hidden HTML-comment packet.
- The model sees only the generated context block, not the extension UI or all locally stored data.

## Main tabs

- **💗 Пульс** — relationship/emotion scales.
- **❤️‍🔥 Искра** — kink/fetish tags, intensity, spontaneity and character-card keyword scan.
- **🎯 Намерения** — persistent unfinished goals so the character can carry plans across later turns.
- **👥 NPC** — compact NPC state returned by the normal model response.
- **📜 Журнал** — local history of emotional shifts and completed intentions.
- **👁 Модель** — exact prompt text currently injected into the next generation.

## Important: model visibility

The UI, sliders, journal and local metadata are **not automatically visible to the language model**. Only the text shown in **“👁 Модель”** is injected into generation. This is intentional: it keeps token usage predictable and gives the user a transparent control surface.

When automatic tracking is enabled, the prompt asks the model to append one compact `HEARTPULSE_STATE` HTML comment to its ordinary response. The extension parses that packet locally, updates the UI, removes the packet from the stored chat message, and does not make a second API call.

## Installation

1. Put this repository into your SillyTavern user extension directory, or install it from a Git repository URL after publishing it.
2. Reload SillyTavern.
3. Tap the floating **❤️‍🔥✨** button.

## Current version

`0.1.0` — architecture/base build. Before publishing broadly, test on the exact SillyTavern build you use, especially automatic packet parsing and message persistence.
