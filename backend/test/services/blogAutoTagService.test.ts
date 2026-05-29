import 'reflect-metadata'
import assert from 'assert'
import { BlogAutoTagService } from '../../src/services/blogAutoTagService.js'

describe('BlogAutoTagService.validate', function () {
  const svc = new BlogAutoTagService()

  it('keeps cities, counties, topics, audience, seasonality that match the allow-lists', function () {
    const out = svc.validate({
      cities: ['Fort Lauderdale', 'fort-lauderdale', 'boca-raton', 'unknown-city'],
      counties: ['Broward', 'palm-beach', 'made-up-county'],
      neighborhoods: ['nonexistent'],
      topics: ['waterfront', 'luxury', 'not-a-topic'],
      audience: ['luxury-buyer', 'snowbird', 'made-up'],
      seasonality: ['winter', 'season-2026', 'fake'],
      reasoning: 'Test reasoning.'
    })

    assert.deepEqual(out.cities, ['fort-lauderdale', 'boca-raton'])
    assert.deepEqual(out.counties, ['broward', 'palm-beach'])
    assert.deepEqual(out.neighborhoods, [])
    assert.deepEqual(out.topics, ['waterfront', 'luxury'])
    assert.deepEqual(out.audience, ['luxury-buyer', 'snowbird'])
    assert.deepEqual(out.seasonality, ['winter', 'season-2026'])
    assert.equal(out.reasoning, 'Test reasoning.')
  })

  it('returns empty arrays for missing or non-array input', function () {
    const out = svc.validate({})
    assert.deepEqual(out.cities, [])
    assert.deepEqual(out.counties, [])
    assert.deepEqual(out.topics, [])
    assert.deepEqual(out.audience, [])
    assert.deepEqual(out.seasonality, [])

    const out2 = svc.validate(null)
    assert.deepEqual(out2.cities, [])

    const out3 = svc.validate({ cities: 'fort-lauderdale' })
    assert.deepEqual(out3.cities, [])
  })

  it('dedupes within each dimension', function () {
    const out = svc.validate({
      cities: ['fort-lauderdale', 'Fort Lauderdale', 'FORT-LAUDERDALE'],
      topics: ['luxury', 'luxury']
    })
    assert.deepEqual(out.cities, ['fort-lauderdale'])
    assert.deepEqual(out.topics, ['luxury'])
  })

  it('drops non-string entries inside arrays', function () {
    const out = svc.validate({
      cities: ['fort-lauderdale', 42, null, undefined, { not: 'a string' }],
      topics: ['waterfront', 99]
    })
    assert.deepEqual(out.cities, ['fort-lauderdale'])
    assert.deepEqual(out.topics, ['waterfront'])
  })

  it('truncates reasoning to 500 chars', function () {
    const long = 'a'.repeat(800)
    const out = svc.validate({ reasoning: long })
    assert.equal(out.reasoning?.length, 500)
  })
})

describe('BlogAutoTagService.flatten', function () {
  const svc = new BlogAutoTagService()

  it('puts cities/neighborhoods/counties/topics as bare slugs and prefixes audience+season', function () {
    const flat = svc.flatten({
      cities: ['fort-lauderdale'],
      neighborhoods: [],
      counties: ['broward'],
      topics: ['waterfront', 'luxury'],
      audience: ['luxury-buyer'],
      seasonality: ['winter']
    })

    // Bare entries (compat with Track 2's RelatedBlogPostsService matcher).
    assert.ok(flat.includes('fort-lauderdale'))
    assert.ok(flat.includes('broward'))
    assert.ok(flat.includes('waterfront'))
    assert.ok(flat.includes('luxury'))
    // Prefixed entries.
    assert.ok(flat.includes('audience:luxury-buyer'))
    assert.ok(flat.includes('season:winter'))
  })

  it('dedupes across dimensions', function () {
    // If a topic slug accidentally matches a city slug (e.g. 'design'), we
    // still want a deduped flat list rather than duplicates.
    const flat = svc.flatten({
      cities: ['design'],
      neighborhoods: [],
      counties: [],
      topics: ['design'],
      audience: [],
      seasonality: []
    })
    assert.equal(flat.filter(t => t === 'design').length, 1)
  })

  it('returns empty array when all dimensions are empty', function () {
    const flat = svc.flatten({
      cities: [],
      neighborhoods: [],
      counties: [],
      topics: [],
      audience: [],
      seasonality: []
    })
    assert.deepEqual(flat, [])
  })
})
