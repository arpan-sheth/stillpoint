# Stillpoint

A free, no-subscription focus dashboard with a built-in planner. No account, no tracking, no paywall. Everything is saved in your browser (localStorage).

## Features

**Focus**
- Pomodoro timer with focus, short break and long break modes (lengths are adjustable)
- Optional auto-start, chime and desktop notifications
- Task list with session estimates; the session counter goes up for the task you have selected
- Clock, greeting and a daily quote
- Generated lo-fi music plus 7 ambient sounds (rain, ocean, wind, fireplace, café, white and brown noise) that you can mix
- 40 original backgrounds: soft aura glows (hearts, butterflies, moons, flowers, stars, clouds and more), animated rainy windows and starry hills, illustrated hills and clouds, silk, and simple gradients. The text switches between light and dark to suit each one.
- Use your own image instead (URL or upload)
- Optional daily affirmation
- Focus mode: the rest of the screen fades while the timer runs

**Planner**
- Week view: drag items between days
- Day view: an hour-by-hour timeline with a "now" line; click an hour to add an item there
- Color-coded items with times and notes
- Weekly goals and weekly notes
- Today's plan shows on the Focus screen; click an item to start focusing on it

**Stats**
- Minutes today and this week, total sessions, day streak and a 14-day chart
- Export and import your data as JSON

## Run it

It's plain HTML/CSS/JS with no build step. Either:

- open `index.html` in a browser, or
- serve the folder so offline mode and installing as an app work:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Start/pause the timer (Focus tab) |
| F | Toggle fullscreen |
| N | New planner item (Planner tab) |
| Esc | Close panels and dialogs |
