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
