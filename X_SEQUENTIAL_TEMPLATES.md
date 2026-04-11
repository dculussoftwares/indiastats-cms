# X Daily Post - Sequential Template Implementation

## Overview
Posts election cards to X (Twitter) using 8 specific templates in sequential order.

## Templates (Cycling Order)
1. **Timeline** (card21)
2. **Did You Know** (card18)
3. **Fight Night** (card17)
4. **Election Map** (card16)
5. **Analytics** (card13)
6. **Breaking News** (card9)
7. **Newspaper** (card4)
8. **Bold Classic** (card1)

## How It Works

### Template Cycling
- Each time the workflow runs, it posts with the next template in the sequence
- After posting with template #8 (Bold Classic), it cycles back to #1 (Timeline)
- Template index is based on the assembly post count (next_index)
- Formula: `templateIndex = postIndex % 8`

### Implementation Details

**Workflow File:** `.github/workflows/x-daily-post.yml`

**State Tracking:** `.github/x-post-template-state.json`
- Stores current template index
- Updated after each successful post
- Cycles: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 0

**Card Rendering:**
- Uses x-card route: `/x-card/{assemblyId}?template={cardN}`
- Viewport: 1024x512 (card aspect ratio)
- Captures `[data-card]` element
- High quality: 2x device scale factor

### Running Manually

Trigger workflow via GitHub Actions:
```bash
# Via GitHub UI: Actions → X Daily Post → Run workflow
# Specify optional parameters:
# - assembly_override: specific assembly (e.g., ac001)
# - dry_run: true to skip posting
```

### Automated Schedule (Can be enabled)
```
Times (commented out in workflow):
- 7:00 AM IST
- 10:00 AM IST
- 1:00 PM IST
- 4:00 PM IST
- 7:00 PM IST
- 10:00 PM IST
```

## Technical Flow

1. **Trigger**: Manual dispatch or scheduled cron
2. **Get Assembly**: Selects next assembly from rotation
3. **Calculate Template**: `templateIndex = assemblyIndex % 8`
4. **Build URL**: `/x-card/{assemblyId}?template=card{N}`
5. **Screenshot**: Puppeteer captures card (1024x512)
6. **Post to X**: Uploads image + text
7. **Update State**: Records template index for next post
8. **Commit**: Saves state to git

## Card URLs

View specific card:
```
http://localhost:3000/x-card/ac001?template=card21   # Timeline
http://localhost:3000/x-card/ac001?template=card18   # Did You Know
http://localhost:3000/x-card/ac001?template=card17   # Fight Night
http://localhost:3000/x-card/ac001?template=card16   # Election Map
http://localhost:3000/x-card/ac001?template=card13   # Analytics
http://localhost:3000/x-card/ac001?template=card9    # Breaking News
http://localhost:3000/x-card/ac001?template=card4    # Newspaper
http://localhost:3000/x-card/ac001?template=card1    # Bold Classic
```

View all templates:
```
http://localhost:3000/x-card/ac001
```

## Environment Variables

Required (in GitHub Secrets):
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `X_OAUTH2_REFRESH_TOKEN`

Site URL (in workflow):
- `SITE_URL: https://indiastats.org` (production)

## Example Posting Sequence

Post #1: Assembly ac001 + Timeline
Post #2: Assembly ac002 + Did You Know
Post #3: Assembly ac003 + Fight Night
Post #4: Assembly ac004 + Election Map
Post #5: Assembly ac005 + Analytics
Post #6: Assembly ac006 + Breaking News
Post #7: Assembly ac007 + Newspaper
Post #8: Assembly ac008 + Bold Classic
Post #9: Assembly ac009 + Timeline (cycles back)

## Troubleshooting

**Card not rendering?**
- Check x-card route exists: `/x-card/[assemblyId]/`
- Verify assembly data loads correctly
- Check browser console for errors

**Template not changing?**
- Verify `TEMPLATE_INDEX` passes correctly
- Check `x-post-template-state.json` updates
- Manual fix: Edit state file template index

**X post fails?**
- Check OAuth tokens (may need refresh)
- Verify image capture succeeds
- Check X API rate limits

## Future Enhancements

- [ ] Add custom templates per assembly
- [ ] Time-of-day specific templates
- [ ] A/B testing different templates
- [ ] User engagement tracking per template
- [ ] Template performance analytics

