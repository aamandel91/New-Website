import searchConfig from '@configs/search'

import {
  property1,
  property2,
  property3,
  property4,
  property5
} from './__mocks__'
import { getSeoUrl, parseSeoUrl } from './seo'

describe('utils/properties/seo', () => {
  it('should emit permanent /homes/ URLs from address fields', () => {
    // unitNumber and streetDirection are intentionally dropped — the permanent
    // /homes/ URL is address-only (street + city + state + zip).
    expect(getSeoUrl(property1)).toBe(
      '/homes/135-lower-barrette-way-ottawa-k1l-7z9'
    )
    expect(getSeoUrl(property2)).toBe(
      '/homes/135-lower-barrette-way-ottawa-k1l-7z9'
    )
  })

  it('should preserve startImage as a query param on /homes/ URLs', () => {
    expect(getSeoUrl(property2, { startImage: 12 })).toBe(
      '/homes/135-lower-barrette-way-ottawa-k1l-7z9?startImage=12'
    )
  })

  it('should ignore boardId for /homes/ URLs (address-only) and preserve startImage', () => {
    // boardId is no longer encoded — the permanent URL is address-only.
    expect(getSeoUrl(property3, { boardId: 14 })).toBe(
      '/homes/13-5-d-artagnan-bay-ottawa?startImage=1'
    )
    // No address at all — last-resort fallback to the legacy /listing/<mls> form.
    expect(getSeoUrl(property4, { boardId: 15 })).toBe('/listing/12347')
  })

  it('should strip scrubbed placeholders from address fields before building the slug', () => {
    expect(getSeoUrl(property5)).toBe('/homes/o-reilly')
  })

  it('should correctly parse SEO url to address', () => {
    expect(
      parseSeoUrl('ph3-135-lower-barrette-way-east-ottawa-k1l-7z9-X12345X-12')
    ).toMatchObject({
      unitNumber: 'PH3',
      streetName: 'Lower Barrette Way',
      streetSuffix: 'east',
      city: 'Ottawa',
      zip: 'K1L 7Z9',
      mlsNumber: 'X12345X',
      boardId: 12
    })

    expect(
      parseSeoUrl('135-lower-barrette-way-ottawa-k1l-7z9-12346')
    ).toMatchObject({
      streetName: 'Lower Barrette',
      streetSuffix: 'way',
      streetNumber: '135',
      city: 'Ottawa',
      zip: 'K1L 7Z9',
      mlsNumber: '12346',
      boardId: searchConfig.defaultBoardId
    })

    expect(parseSeoUrl('X12346X')).toMatchObject({
      mlsNumber: 'X12346X',
      boardId: searchConfig.defaultBoardId
    })
  })

  it('should correctly parse SEO url with US zip code', () => {
    expect(
      parseSeoUrl('12-elm-street-chicago-60090-X12345X-999')
    ).toMatchObject({
      streetNumber: '12',
      streetName: 'Elm',
      streetSuffix: 'street',
      city: 'Chicago',
      zip: '60090',
      mlsNumber: 'X12345X',
      boardId: 999
    })
  })

  // expect(parseSeoUrl('12346-123')).toMatchObject({
  //   mlsNumber: '12346',
  //   boardId: 123
  // })
})
