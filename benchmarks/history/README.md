# Honest Benchmark History

This directory stores timestamped summaries produced by the `pnpm benchmark:report:combined` workflow.

Each run writes:

- `honest-benchmark-<timestamp>.json` – combined Node + browser results, renderer metrics, and cross-framework comparison data.
- `latest.json` – copy of the most recent summary for quick inspection.

CI uploads the generated files as build artefacts, so committed history is optional. To create a new entry locally:

```bash
pnpm benchmark:browser:report    # optional; generates fresh browser metrics
pnpm benchmark:report:combined   # writes history files in this directory
```

The JSON payload contains:

- `node` – TachUI benchmark results, including renderer metric aggregates.
- `browser` – the latest Chromium run exported by Playwright (if present) plus the derived comparison summary.
- `comparison` – TachUI vs React/Solid metrics derived from `FRAMEWORK_BASELINES`.
- `performanceScore` – weighted js-framework-benchmark style score.

Only ASCII content is stored to keep diffs review-friendly.
