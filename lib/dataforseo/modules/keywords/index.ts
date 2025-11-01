/**
 * Keywords Module
 *
 * Comprehensive keyword research and analysis tools
 */

import { searchVolume } from './searchVolume'
import { suggestions } from './suggestions'
import { difficulty } from './difficulty'
import { ideas } from './ideas'
import { related } from './related'
import { historical } from './historical'
import { forSite } from './forSite'

export const keywords = {
  searchVolume,
  suggestions,
  difficulty,
  ideas,
  related,
  historical,
  forSite,
}

export default keywords

// Individual exports
export {
  searchVolume,
  suggestions,
  difficulty,
  ideas,
  related,
  historical,
  forSite,
}
