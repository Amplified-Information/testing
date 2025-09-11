import { MarketOption } from "@/types/market";

export interface MarketData {
  id: string;
  question: string;
  category: string;
  yesPrice?: number;
  noPrice?: number;
  volume: number;
  endDate: string;
  liquidity: number;
  change24h: number;
  marketType?: string;
  marketStructure?: string;
  options?: MarketOption[];
}

export const isMultiChoiceMarket = (market: MarketData): boolean => {
  // Check market structure first
  if (market.marketStructure === 'multi-choice') {
    return true;
  }

  // Fallback: Check if there are more than 2 options or if there are candidate options
  if (market.options && market.options.length > 2) {
    return true;
  }

  // Check if any option has candidate information
  if (market.options && market.options.some(option => option.candidate_name)) {
    return true;
  }

  return false;
};

export const processMultiChoiceCandidates = (options: MarketOption[]) => {
  if (!options) return [];

  // Group options by candidate
  const candidateMap = new Map();
  
  options.forEach(option => {
    if (!option.candidate_name) return;
    
    if (!candidateMap.has(option.candidate_name)) {
      candidateMap.set(option.candidate_name, {
        id: option.candidate_name,
        name: option.candidate_name,
        avatar: option.candidate_avatar,
        party: option.candidate_party,
        yesPrice: 0,
        noPrice: 0,
        yesOptionId: '',
        noOptionId: '',
        volume24h: 0,
        change24h: 0, // Would need to calculate from price history
        totalShares: 0
      });
    }
    
    const candidate = candidateMap.get(option.candidate_name);
    
    if (option.option_type === 'yes') {
      candidate.yesPrice = option.current_price;
      candidate.yesOptionId = option.id;
      candidate.totalShares += option.total_shares;
    } else if (option.option_type === 'no') {
      candidate.noPrice = option.current_price;
      candidate.noOptionId = option.id;
    }
  });

  return Array.from(candidateMap.values())
    .filter(candidate => candidate.yesPrice > 0) // Only show candidates with yes options
    .sort((a, b) => b.yesPrice - a.yesPrice); // Sort by yes price descending
};