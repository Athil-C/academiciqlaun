# AcademiQ â€” Connecting Minds. Creating Opportunities.

A multi-page marketing site for [AcademiQ](https://www.AcademiQ.com/), built with
**Astro**, **GSAP**, **three.js** and **Lenis**. Static output, no backend.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site â†’ dist/
npm run preview   # serve dist/
```

Node 22.12 or newer.

## Pages

| Route | What it is for |
| --- | --- |
| `/` | The pitch: proof, Pay After Placement, the 12 months, domains, alumni, hubs |
| `/AcademiQ Fellowship/` | The program in depth: method, six phases, entry requirements, admission, FAQ |
| `/courses/` | All 12 domains with filtering, Solution Builder tracks, what every domain includes |
| `/pay-after-placement/` | How PAP works, PAP vs upfront chart, money-back guarantee, questions to ask |
| `/placements/` | Numbers, salary plot, alumni wall, draggable globe of where alumni work |
| `/hire/` | For companies: hiring models, the filter candidates pass, enquiry form |
| `/apply/` | Lead form, every contact desk, hubs |
| `/404` | Not-found page |

## Where things live

```
src/
  data/          â† every number, name and contact. Edit here, the site follows.
    site.js        stats, contacts, hubs, nav
    courses.js     the 12 domains
    alumni.js      alumni, stories (video ids), globe destinations
    program.js     phases, principles, FAQs
    hire.js        hiring partners, models, employer quotes
  layouts/Base.astro      document shell, preloader, cursor, WebGL canvas
  components/             Nav, Footer, Button, Faq, Marquee, ApplyFormâ€¦
  pages/                  one .astro file per route
  styles/
    global.css            design tokens, reset, typography
    components.css        shared components
    blocks.css            blocks used on several pages
    pages/*.css           page-specific styles
  scripts/
    app.js                entry: boots the shell, then the page module
    core/                 scroll, cursor, nav, transitions, reveals, formsâ€¦
    webgl/                particle stage, shapes, globe arcs
    pages/*.js            per-page scroll scenes (lazy-loaded)
scripts/build-globe.mjs   regenerates public/data/land.bin (`npm run globe`)
```

## Motion system

- **Preloader** counts to the number of engineers placed while `BROÂ·TOTYPE`
  becomes `BROÂ·THER`, then the word flies into the headline (GSAP Flip).
  Plays once per session.
- **Page transitions**: a red curtain with a `[BRO]` pun per destination
  (`AcademiQ Fellowship`, `BROWSE`, `BROS, PLACED`â€¦).
- **WebGL stage**: one fixed canvas of ~20k particles that re-forms as you
  scroll â€” a dotted globe with placement arcs from wayand, `â‚¹0`, `12`, `</>`.
  Each page declares its "stops" in `scripts/pages/*.js`.
- **Micro-interactions**: custom cursor with contextual labels, magnetic
  buttons whose fill grows from the pointer, rolling link labels, odometer
  counters, 3D tilt + spotlight cards, velocity-reactive marquees, typed
  terminals, a 2,395-dot matrix that reacts to the pointer.

Declarative helpers, usable in any markup:

| Attribute | Effect |
| --- | --- |
| `data-reveal="lines\|chars\|words\|up\|fade\|scale"` | entrance on scroll |
| `data-scrub-words` | words light up as you scroll through the paragraph |
| `data-odo="2,395"` | digits roll into place |
| `data-magnetic="0.3"` | element is pulled toward the pointer |
| `data-tilt="4"` | 3D tilt, max angle in degrees |
| `data-cursor="view\|drag\|play\|copyâ€¦"` | cursor label |
| `data-video="<youtube id>"` | opens the video dialog |
| `data-copy="text"` | click to copy |

## Accessibility and resilience

- `prefers-reduced-motion`: smooth scroll, WebGL motion, pinning and
  entrances are switched off; all content is visible immediately.
- No WebGL? The canvas is removed and the page works without it.
- If the script never boots, a failsafe reveals the page after 7 seconds.
  With JavaScript disabled, animated content is simply visible.
- Keyboard: skip link, focus-visible styles, focus trap in the menu,
  `<details>`-based FAQ, native `<dialog>` for video.
- Videos load from `youtube-nocookie.com`, and only after a click.

## Forms

There is no backend, so the forms do not pretend to submit:

- **Apply** opens a WhatsApp chat with admissions, with the answers pre-written.
- **Hire** opens the visitor's mail app with the enquiry composed.

To post to a CRM instead, replace `handoff()` in `src/scripts/core/forms.js`
with a `fetch()` to your endpoint.

## Content sources

Figures and copy facts were taken from AcademiQ.com (`/`, `/AcademiQ Fellowship`,
`/alumni`, `/courses`) and study.AcademiQ.com/hiring-page in September 2026.

**Please review before publishing:**

1. **Headline numbers.** AcademiQ's own pages disagree with each other
   (page title: "2500+ placements at â‚¹4.68 LPA"; hero badge: "â‚¹40K/month";
   live counters: 2,395 placed, â‚¹44,000/month, 5.32 LPA average). This site
   uses the live counters. Update `src/data/site.js` with the current figures.
2. **Pay After Placement terms.** The public site does not state how much is
   paid after placement, or over how long. This site therefore does not state
   it either, and the chart marks the post-placement line as "not to scale".
   Add the real terms to `/pay-after-placement/` if they can be published.
3. **"Leads to" roles** on course cards are indicative job titles, written for
   this site.
4. **Hub coordinates** in `site.js` are approximate, used only for the
   constellation graphic.
5. Alumni names, packages and employer quotes are reproduced as published by
   AcademiQ; keep them in sync with the source.

Fonts (Anek Latin, Anek Malayalam, Fraunces, JetBrains Mono) are open source
(SIL OFL) and self-hosted via Fontsource. Land data for the globe is Natural
Earth, via `world-atlas`.
