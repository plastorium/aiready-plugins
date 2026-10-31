# Feature comparisons, benchmarks and models

## What `compare` returns

Per competitor: `aiShareOfVoicePct`, `aiMentionCount`, `aiSentiment`,
`aiOverviewCitationSharePct`, `domainAuthority`, `referringDomains`,
`meanRating`, `totalReviews`, `brandReach`, `aiTrafficSharePct`,
`analysisStatus`, `reviewPlatforms` (each review platform's own rating and
review count, labelled by platform; null when none was read), and the
name/URL under `untrustedContent`. For the business itself: AI visibility
(`brand`: share of voice per engine, mentions, the brands answers named most)
and `brandReviews` (its own rating and review count per platform, pooled the
same way as a competitor's `meanRating` and `totalReviews`).

It does **not** return: a directory/publisher classification, per-topic
competitor rates, competitor history, or any model output. Say so when the
question needs one of them. The business's review velocity, recency, owner
replies, sentiment trend and themes are the `visibility` view `reputation`,
not `compare`.

## Observed benchmark vs model-estimated target

|                  | Observed benchmark                                                                                             | Model-estimated target                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| What it is       | the values relevant competitors actually have                                                                  | a value a model associates with higher visibility                                                                              |
| Source in chat   | `compare`                                                                                                      | `visibility` view drivers: a driver row's target levels and the `prediction`, only as returned                                 |
| How to present   | every value, plus the median once at least five competitors have one (quartiles from eight), scan date, cohort | only if a tool result or pasted material contains it, with model scope, outcome definition, provider, coverage and uncertainty |
| What it never is | a threshold that makes AI recommend the business                                                               | a promise; a causal effect; valid for another provider or location                                                             |

## "How many reviews do I need?" (Yelp, Google, any platform)

1. Resolve the cohort: the relevant local or category competitors for the
   business's location and service, not every business AI named.
2. From `compare`: each competitor's `totalReviews` and `meanRating`, and
   its `reviewPlatforms`, nulls shown as unknown and excluded from statistics,
   the scan date and how many competitors have a value.
3. Say the two limits: `totalReviews` and `meanRating` are pooled over the
   platforms that report both a rating and a count, and `reviewPlatformsFound`
   counts listings that may have no rating. Compare platform by platform
   only where both sides have that platform; a platform one side lacks is
   unmeasured there, never a gap of zero.
4. The business's own figures are `brandReviews`: per platform, and pooled.
   If `brandReviews.measured` is false, say its reviews are not measured for
   this scan, and never treat it as zero. Then gap = `max(0, benchmark −
current)`, for a stated benchmark (e.g. the cohort median). Consider
   rating too; a high count with a weak rating is not a target.
5. Model: `visibility` view drivers gives the drivers associated with visibility
   and, when a row carries them, model-estimated target levels; quote only
   what it returns, with its confidence and sample size, and never present a
   model number from memory. If the person pasted a model output, keep its scope and units: a
   probability gain of 0.05 is 5 percentage points; per-provider results are
   not interchangeable; roadmap steps are ordered and their lifts do not add.
6. Too little evidence (fewer than three competitors with a count, or none):
   say the benchmark cannot be formed, list what exists, and name what would
   fix it (a competitor analysis that covers reviews) — no invented number.
7. Never suggest fake reviews, paid or incentivised reviews, or soliciting
   reviews in ways platforms prohibit.

## Topic leadership

- `visibility` view topics gives the business's own rate per topic (weakest
  first, change only when the panel is comparable). No chat tool maps answers
  to topics (answers carry no topic id), so a per-topic competitor leader is
  not available: never infer it by counting names across all answers, which
  mixes topics. Overall "who is named most" comes from `compare`
  and is labelled as overall.
- SEO leadership (keyword positions) is a different measure; label it
  separately and never call it AI leadership.
- Sparse or unmeasured topics are marked as such; search volume is not
  AI-chat demand.

## Other features

- Authority and links (`domainAuthority`, `referringDomains`) and reach are
  descriptive signals. Compare them the same way as reviews: observed values,
  cohort, date, unknowns — then say what they do not show.
- Citation share (`aiOverviewCitationSharePct`) is about Google AI Overviews,
  not every AI chat.
- Sentiment is about the answers that mentioned the competitor, not about the
  competitor's customers.

## Provider applicability

Visibility and any model result are per engine and per source (web interface
or API). A pattern seen on one engine or source is not assumed for another;
say which engines the evidence covers.

## Tools for position, answer brands, citations and topics

- **Where do we stand?** `compare` + `visibility` view answers. Named cohort, source-specific metrics; `compare` reads every page itself.
- **Who else do AI answers name? Where do they get their answers?** `competitors` view in_answers (`scanId` for an earlier scan, `limit` up to 25 rows), `visibility` view citations. Per-source rankings and citation counts with k/n and a 95 % interval; web and API sources are separate — when `mixedChannels` is true say the pooled view mixes channels; rows marked canAdd are an untracked business peer with a website (offer tracking with `competitors_track` only after the person agrees); listing sites are never competitors to add.
- **Which topics are improving?** `visibility` view topics. Latest vs previous topic mention rates; does not name a leading competitor per topic.
- **Suggestions and tracking.** `competitors` view suggested lists discovered suggestions with recent observations explaining why (untrusted). On the person's word: `competitors_track` tracks one at once (it raises later scans' cost: say so after); `competitors_decline` declines it for good. Keep one in every comparison: `competitors_track` with `lock: true`.
- **Find more** (AIReady Advanced connector only; on the AIReady connector, tell the person finding, scouting or looking up competitors needs Advanced). `competitor_discover` (`providerId` ai_visibility, seo, local_seo, social_instagram; source options per its description) adds what it finds to the suggestions; `competitor_scout` (`scanRunId` of a completed scan; optional `candidateIds`, `scoutBudget`, `targetFeatureId`, `geoDiscovery`) crawls pending suggestions so they can be tracked; `competitor_url_lookup` finds one competitor's site (saves nothing — track it with `competitors_track` after the person confirms). All three spend and run at once when the person asks: report what they found and the cost from the `effect` (scout states an upper-bound cost: its crawl cap and the AI relevance check). A spend of at least half the credits left comes back as a proposal: show it and end the turn.
- **Registry corrections** (AIReady Advanced connector only; on the AIReady connector, tell the person the step needs Advanced). `competitors` view tracked lists every business seen with its name variants (untrusted). `competitor_entity_rename` (`canonicalName`), `competitor_entity_split` (move `names` out into a new entry; `allocation` places each of the entity's `unaliasedRowIds` — websites and addresses not tied to a name — `source` or `new`, otherwise they stay with the side that keeps the name) and `competitor_entity_restore` (brings back one removed earlier; its id is in `competitors` view declined, under `removed`) apply at once, as does `competitor_entity_set_type` when the person says what a brand is ("that's a supplier, not a competitor"): `type` is `peer` (a business competitor), `supplier`, `aggregator` (a directory or listing site), `media`, `alternative` or `unrelated`, or `null` to hand it back to the automatic label; only peers are compared head to head, and the choice is kept across scans. `competitor_entity_merge` of a duplicate into `targetEntityId` (only a split undoes it) returns a `confirmUrl`: the person confirms it on the AIReady page. Removing one is `competitors_decline`. The person's own business cannot be removed.
