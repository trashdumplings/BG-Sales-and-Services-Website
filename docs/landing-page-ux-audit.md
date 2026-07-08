# BG Sales & Supplies — Landing Page UX Audit

Audit date: June 22, 2026

Scope: code, content, responsive rules, accessibility structure, production build, and conversion flow. This is not a browser-device or field Core Web Vitals test.

Legend:

- [x] Pass
- [~] Partial
- [ ] Needs work

## 1. Brand and visual design

- [x] Distinctive, relevant hero rather than a generic corporate banner.
- [x] Consistent Bhutan-focused imagery with no identifiable people.
- [x] Cohesive navy-to-blue palette across the landing-page journey.
- [x] Consistent editorial display typography and interface typography.
- [x] Clear visual hierarchy between headline, supporting copy, and actions.
- [x] Purposeful motion tied to scrolling and interaction.
- [~] Section rhythm is improved, but should be checked at common laptop heights to catch oversized transitions.
- [~] Very small labels (roughly 8–11px) appear throughout the design and may become difficult to read.

## 2. Information architecture and usability

- [x] Story flow is logical: value → philosophy → services → products → about → proof → partners → contact.
- [x] Products, projects, and services progressively reveal detail instead of showing dense card grids.
- [x] Primary conversion routes are present: services, catalog, quotation, and contact.
- [x] Contact form is concise and asks only for useful information.
- [x] Contact information and location are visible without requiring form submission.
- [x] Navigation label matches the Projects section.
- [x] Native fragment navigation uses shared scroll padding instead of per-link hard-coded offsets.
- [~] Theme switching is available, but most cinematic sections use fixed colors and do not meaningfully change with the theme.
- [x] The logo links to Home.
- [x] A keyboard-visible skip-to-content link is present.

## 3. Accessibility and inclusive interaction

- [x] Form controls have visible text labels.
- [x] Informative images generally have useful alternative text.
- [x] Decorative visual layers are generally hidden from assistive technology.
- [x] Reduced-motion handling exists across the major animated sections.
- [x] Interactive project and product choices work on focus/click, not hover alone.
- [~] Product tabs use ARIA roles, but tab IDs, `aria-labelledby`, and arrow-key behavior are incomplete.
- [x] Focus-visible treatment covers primary navigation, product tabs, project rows, CTAs, form actions, archive controls, and footer links.
- [~] Several muted labels use low opacity and very small type, creating likely contrast/readability failures.
- [~] The moving partner ribbons pause on pointer hover, but do not provide a visible keyboard pause control.
- [x] The hero uses a semantic `<h1>`.
- [x] Landing-page navigation uses conventional fragment links.
- [x] The mobile menu button exposes `aria-expanded` and `aria-controls`.
- [x] The mobile menu closes with Escape and moves focus appropriately.

## 4. Conversion and trust

- [x] Primary value proposition is visible above the fold.
- [x] Credibility is supported by clients, delivered systems, company history, and technology partners.
- [x] Projects avoid invented performance metrics.
- [x] Product and service CTAs lead to relevant destinations.
- [x] The primary sales email is standardized as `bgsales@outlook.com`.
- [x] The contact form clearly identifies itself as a non-sending preview until the backend exists.
- [x] Placeholder social links have been removed until verified profile URLs are supplied.
- [x] Footer service links use the real Services section destination.
- [x] Placeholder legal links have been removed until real pages exist.
- [ ] Claims such as “24/7 support” in metadata should be verified or removed.

## 5. SEO and shareability

- [x] Page title, meta description, canonical URL, robots directive, and language are present.
- [x] The content contains meaningful company, location, product, service, and project terms.
- [x] The page has a semantic hero `<h1>` and section-level headings.
- [~] The production HTML includes Open Graph title and description but no Open Graph image.
- [ ] No structured organization/local-business data is present in the Vite root HTML currently used for the frontend build.
- [ ] No Twitter/X card metadata is present.
- [x] Important section navigation uses crawlable fragment links.

## 6. Performance and stability

- [x] Production build succeeds and routes are code-split.
- [x] Hero raster is optimized and marked high priority.
- [x] Three.js hero geometry is lazy-loaded.
- [x] Below-the-fold imagery generally uses lazy loading.
- [x] Large original PNG files are not imported by the production page.
- [~] The lazy Three.js hero chunk is approximately 511KB minified and triggers the build-size warning.
- [~] Six project images total about 1.85MB; confirm they are loaded only when needed in real browser testing.
- [~] Google Fonts are loaded through CSS `@import`, which can delay rendering compared with local/self-hosted fonts or document preloads.
- [~] Most images do not declare intrinsic width and height, leaving some layout-shift risk.
- [ ] No measured Lighthouse/mobile profile has been recorded.
- [ ] No field Core Web Vitals monitoring is connected despite the `web-vitals` package being installed.

Target production thresholds:

- LCP: 2.5 seconds or less
- INP: 200 milliseconds or less
- CLS: 0.1 or less

## 7. Responsive and device behavior

- [x] Every major section has tablet/mobile layout rules.
- [x] Product, project, contact, and About layouts collapse cleanly in code.
- [x] Mobile navigation exists.
- [~] Sticky storytelling consumes 170–300 viewport heights and should be tested on low-end phones and short landscape screens.
- [~] Several mobile headings are extremely large and need real-device checks for awkward wrapping.
- [~] The map disables direct iframe pointer interaction and depends on the outer link; verify expected touch behavior.
- [ ] No documented testing matrix exists for 320px, 375px, 768px, 1024px, 1366px, and ultrawide screens.

## Overall assessment

Visual/design readiness: 9/10

UX and content readiness: 8/10

Accessibility readiness: 7.5/10

Technical launch readiness: 7.5/10

Overall: 8.1/10

The landing page looks modern and distinctive, but it should not be considered fully launch-ready until the semantic heading/navigation issues, placeholder links, form behavior, focus states, and performance measurement are resolved.

## Priority fix order

### P0 — before launch

Completed in the first remediation pass:

1. Semantic hero `<h1>`.
2. Explicit non-sending contact-form preview.
3. Placeholder footer links removed.
4. Primary sales email standardized.
5. Projects navigation naming corrected.
6. Focus-visible styles and mobile-menu ARIA/focus behavior added.

### P1 — launch quality

1. Convert section navigation to real fragment URLs.
2. Add skip-to-content and keyboard-friendly menu behavior.
3. Increase the smallest labels and verify WCAG contrast.
4. Complete tab semantics and keyboard behavior.
5. Add Open Graph image, social metadata, and valid Organization/LocalBusiness structured data.
6. Add image dimensions and improve font loading.

### P2 — polish and monitoring

1. Run Lighthouse on mobile and desktop builds.
2. Record LCP, INP, and CLS in production.
3. Test sticky sections on low-end mobile devices and short viewports.
4. Consider replacing or reducing the Three.js hero layer if it materially harms LCP or battery use.
5. Perform a final spacing pass at common laptop and ultrawide sizes.
