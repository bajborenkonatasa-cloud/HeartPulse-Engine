# HeartPulse Engine v0.4.0

Clean UI rebuild for SillyTavern. The opening mechanism now follows the same direct module-import and DOM show/hide pattern used by working SillyTavern extensions.

Open from:
- floating ❤️‍🔥 button;
- Extensions drawer → HeartPulse Engine;
- 🪄 extensions menu → HeartPulse Engine.

Data remains local/per chat; prompt injection does not require a separate API request.

# HeartPulse Engine v0.3.0

Mobile-safe opener rebuild. Panel can be opened from:
- floating ❤️‍🔥 button
- Extensions settings block
- SillyTavern wand/extensions menu

This build intentionally disables dragging of the floating button to eliminate Android tap/drag conflicts.


## v0.5.0
- Draggable mobile ❤️‍🔥 button; position is saved locally.
- Single pointer event path (no click/touch double-trigger).
- Compact relationship screen: 6 main feelings + collapsible secondary feelings.
- Automatic relationship updates remain optional and are parsed from a hidden HEARTPULSE_STATE comment in the model reply.
- State-update prompt now uses sparse deltas to reduce tokens.
- Manual sliders remain available as an override.
- Panel is pinned to the viewport on mobile.
