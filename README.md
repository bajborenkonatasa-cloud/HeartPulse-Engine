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

## v0.6.0
- Живая авто-анкета персонажа: настроение, мотивы, скрытая мысль, текущая цель и желание на будущее обновляются из того же ответа модели через скрытый HEARTPULSE_STATE-блок.
- Ручная правка и блокировка 🔒 каждого внутреннего поля.
- Вкладка/страница больше не сбрасывается при изменении ползунков Искры.
- «Проверить карточку» теперь выполняет локальный словарный анализ карточки, показывает найденный «анамнез» и добавляет распознанные предпочтения без отдельного API-запроса.
- Улучшено чтение полей карточки персонажа, включая вложенные текстовые поля.

## v0.7.0
- Relationship scale is now 0–200.
- Existing chats can calibrate from their already-established context instead of starting at zero.
- Added manual re-calibration button.
- NPC profiles are persistent and richer (mood, motive, goal and compact relationship values).
- Auto Spark now uses intensity as a behavior-strength hint while chance controls whether it fires after cooldown.
- Journal is bounded: recent shifts stay visible; old low-level entries are compacted while current state, goals and NPC profiles remain stored.
- Manual directives are explicitly scoped to {{char}} / NPC and can be persistent or next-response-only.


## v0.7.2
- Ещё более компактный мобильный интерфейс.
- Подтверждение перед завершением долгой цели.
- В журнале завершённую цель можно вернуть обратно кнопкой «↩ Вернуть цель».
- Исправлена отображаемая версия в шапке.


## v0.8.1
- 6 salient feelings on the Pulse screen.
- Full 25-value palette remains stored locally, but the normal model prompt sends only the currently salient 1–6 values.
- The full key vocabulary is still supplied to auto-tracking so the model may activate a different emotion when the scene changes.

## v0.9.3

- Исправлен разбор служебного HeartPulse-пакета: вложенный JSON теперь читается корректно, а не обрезается на первой `}`.
- Добавлены резервные форматы пакета и повторная проверка после завершения генерации.
- Во вкладке «Модель» появилась диагностика авто-анкеты и кнопка ручной проверки последнего ответа.
- Добавлена фиксация русского языка: английское название кинка не должно переключать ролевую и анкету на английский.
- Расширен локальный словарь предпочтений, включая секс по телефону/голос, секстинг и другие категории.
- Пользовательские кинки теперь можно сохранять как карточку «название + описание», включать/выключать и удалять.
- Локальный анализ карточки ищет как встроенные категории, так и сохранённые пользовательские названия.


## v0.9.3
- Restored six default Pulse slots.
- Added recovery for models that output the HeartPulse JSON packet as bare visible JSON instead of wrapping it. HeartPulse can now recognize, apply, and strip a trailing schema-matching packet from the chat.


## v0.9.3
- Fixed bare HeartPulse JSON capture when other SillyTavern/extension UI content appears after the JSON.
- The parser now removes only the detected HeartPulse JSON block and preserves content that follows it.


## v0.9.5
- Tolerant HeartPulse packet parser: accepts LLM JSON-like numeric deltas written with a leading `+` (for example `"jealousy": +18`).
- Panel/version console label corrected to v0.9.5.


## v0.9.5 parser-state fix
- Fixes a state race where a freshly parsed model packet could be overwritten by an older local backup before persistence.
- Parser now applies the packet to one exact state object and persists that same object to chat metadata + local backup.
- Diagnostics status is persisted on every parse path, so “Ещё не проверялось” no longer survives after an actual check.


## v0.9.9.2 bare-JSON parser hotfix
- Fixes a JavaScript ReferenceError in the bare JSON recovery path (`end` was referenced as an undeclared variable).
- Bare HeartPulse packets can now be captured and removed correctly.
- Parser exceptions are now written into Diagnostics instead of leaving the status stuck at “Ещё не проверялось”.


## v0.9.9.2 — rollback hidden transport
- Returned auto-profile transport to the original hidden HTML-comment form only.
- Removed XML/plain/bare-JSON fallbacks from parsing.
- If the model cannot keep the service packet hidden, it is instructed to omit the update instead of printing metadata into roleplay chat.


## v0.9.9.2
- Fixed assistant message field access in the hidden HeartPulse packet parser (`mes`, not the wrapper object).
- Fixed hidden payload cleanup to edit `mes` correctly after a successful parse.
- No visual/CSS changes.


## v0.9.9.2 — transport fix
- HeartPulse no longer depends on HTML comments surviving SillyTavern/provider processing.
- The model appends a bounded `[[HEARTPULSE_STATE]]` service packet.
- The extension consumes the exact `MESSAGE_RECEIVED` message by its message ID, applies state, and strips the packet before normal character rendering.
- Legacy HTML-comment packets remain readable as a fallback.


## v0.9.9.2
- Pulse now fills up to exactly six visible feeling sliders when enough stored non-zero feelings exist, while keeping model-selected salient feelings first.
- NPC update instruction is stricter: named NPCs that are present, mentioned, or materially relevant should be returned in the service packet.
- No changes to the stable v0.9.9 service-packet parser or transport.


## v0.9.9.2 — NPC patch
- Named NPCs that appear, are mentioned by the user, or matter to the current scene are now explicitly required in the service packet.
- Up to 8 recent saved NPC profiles are sent back to the model as compact continuity memory.
- NPC tab now supports manual add/edit/delete and manual relationship values.
- Deleting an NPC removes it from HeartPulse NPC memory, so it is no longer injected as saved continuity.
- Stable v0.9.9 service-packet transport is unchanged.
