
// Copyright 2020 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * Promotion result.
 */
 interface Schema$Promotion {
  /**
   * An array of block objects for this promotion.
   */
  bodyLines?: Array<{
    htmlTitle?: string;
    link?: string;
    title?: string;
    url?: string;
  }> | null;
  /**
   * An abridged version of this search's result URL, e.g. www.example.com.
   */
  displayLink?: string | null;
  /**
   * The title of the promotion, in HTML.
   */
  htmlTitle?: string | null;
  /**
   * Image belonging to a promotion.
   */
  image?: { height?: number; source?: string; width?: number } | null;
  /**
   * The URL of the promotion.
   */
  link?: string | null;
  /**
   * The title of the promotion.
   */
  title?: string | null;
}
/**
 * A custom search result.
 */
 interface Schema$Result {
  /**
   * Indicates the ID of Google's cached version of the search result.
   */
  cacheId?: string | null;
  /**
   * An abridged version of this search result’s URL, e.g. www.example.com.
   */
  displayLink?: string | null;
  /**
   * The file format of the search result.
   */
  fileFormat?: string | null;
  /**
   * The URL displayed after the snippet for each search result.
   */
  formattedUrl?: string | null;
  /**
   * The HTML-formatted URL displayed after the snippet for each search result.
   */
  htmlFormattedUrl?: string | null;
  /**
   * The snippet of the search result, in HTML.
   */
  htmlSnippet?: string | null;
  /**
   * The title of the search result, in HTML.
   */
  htmlTitle?: string | null;
  /**
   * Image belonging to a custom search result.
   */
  image?: {
    byteSize?: number;
    contextLink?: string;
    height?: number;
    thumbnailHeight?: number;
    thumbnailLink?: string;
    thumbnailWidth?: number;
    width?: number;
  } | null;
  /**
   * A unique identifier for the type of current object. For this API, it is `customsearch#result.`
   */
  kind?: string | null;
  /**
   * Encapsulates all information about refinement labels.
   */
  labels?: Array<{
    displayName?: string;
    label_with_op?: string;
    name?: string;
  }> | null;
  /**
   * The full URL to which the search result is pointing, e.g. http://www.example.com/foo/bar.
   */
  link?: string | null;
  /**
   * The MIME type of the search result.
   */
  mime?: string | null;
  /**
   * Contains [PageMap](https://developers.google.com/custom-search/docs/structured_data#pagemaps) information for this search result.
   */
  pagemap?: { [key: string]: any } | null;
  /**
   * The snippet of the search result, in plain text.
   */
  snippet?: string | null;
  /**
   * The title of the search result, in plain text.
   */
  title?: string | null;
}
/**
 * Response to a custom search request.
 */
 export interface Schema$Search {
  /**
   * Metadata and refinements associated with the given search engine, including: * The name of the search engine that was used for the query. * A set of [facet objects](https://developers.google.com/custom-search/docs/refinements#create) (refinements) you can use for refining a search.
   */
  context?: { [key: string]: any } | null;
  /**
   * The current set of custom search results.
   */
  items?: Schema$Result[];
  /**
   * Unique identifier for the type of current object. For this API, it is customsearch#search.
   */
  kind?: string | null;
  /**
   * The set of [promotions](https://developers.google.com/custom-search/docs/promotions). Present only if the custom search engine's configuration files define any promotions for the given query.
   */
  promotions?: Schema$Promotion[];
  /**
   * Query metadata for the previous, current, and next pages of results.
   */
  queries?: {
    nextPage?: Array<{
      count?: number;
      cr?: string;
      cx?: string;
      dateRestrict?: string;
      disableCnTwTranslation?: string;
      exactTerms?: string;
      excludeTerms?: string;
      fileType?: string;
      filter?: string;
      gl?: string;
      googleHost?: string;
      highRange?: string;
      hl?: string;
      hq?: string;
      imgColorType?: string;
      imgDominantColor?: string;
      imgSize?: string;
      imgType?: string;
      inputEncoding?: string;
      language?: string;
      linkSite?: string;
      lowRange?: string;
      orTerms?: string;
      outputEncoding?: string;
      relatedSite?: string;
      rights?: string;
      safe?: string;
      searchTerms?: string;
      searchType?: string;
      siteSearch?: string;
      siteSearchFilter?: string;
      sort?: string;
      startIndex?: number;
      startPage?: number;
      title?: string;
      totalResults?: string;
    }>;
    previousPage?: Array<{
      count?: number;
      cr?: string;
      cx?: string;
      dateRestrict?: string;
      disableCnTwTranslation?: string;
      exactTerms?: string;
      excludeTerms?: string;
      fileType?: string;
      filter?: string;
      gl?: string;
      googleHost?: string;
      highRange?: string;
      hl?: string;
      hq?: string;
      imgColorType?: string;
      imgDominantColor?: string;
      imgSize?: string;
      imgType?: string;
      inputEncoding?: string;
      language?: string;
      linkSite?: string;
      lowRange?: string;
      orTerms?: string;
      outputEncoding?: string;
      relatedSite?: string;
      rights?: string;
      safe?: string;
      searchTerms?: string;
      searchType?: string;
      siteSearch?: string;
      siteSearchFilter?: string;
      sort?: string;
      startIndex?: number;
      startPage?: number;
      title?: string;
      totalResults?: string;
    }>;
    request?: Array<{
      count?: number;
      cr?: string;
      cx?: string;
      dateRestrict?: string;
      disableCnTwTranslation?: string;
      exactTerms?: string;
      excludeTerms?: string;
      fileType?: string;
      filter?: string;
      gl?: string;
      googleHost?: string;
      highRange?: string;
      hl?: string;
      hq?: string;
      imgColorType?: string;
      imgDominantColor?: string;
      imgSize?: string;
      imgType?: string;
      inputEncoding?: string;
      language?: string;
      linkSite?: string;
      lowRange?: string;
      orTerms?: string;
      outputEncoding?: string;
      relatedSite?: string;
      rights?: string;
      safe?: string;
      searchTerms?: string;
      searchType?: string;
      siteSearch?: string;
      siteSearchFilter?: string;
      sort?: string;
      startIndex?: number;
      startPage?: number;
      title?: string;
      totalResults?: string;
    }>;
  } | null;
  /**
   * Metadata about a search operation.
   */
  searchInformation?: {
    formattedSearchTime?: string;
    formattedTotalResults?: string;
    searchTime?: number;
    totalResults?: string;
  } | null;
  /**
   * Spell correction information for a query.
   */
  spelling?: { correctedQuery?: string; htmlCorrectedQuery?: string } | null;
  /**
   * OpenSearch template and URL.
   */
  url?: { template?: string; type?: string } | null;
}



