import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, Key, Link, Shield, Users, TrendingUp, Settings, Coins, Vote, FileText, Clock } from "lucide-react";

const DatabaseDesignDocument = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Database Design Document
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Comprehensive documentation of the Hashy Markets database schema, including all tables, columns, relationships, and Row-Level Security policies.
            </p>
          </div>

          {/* Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Overview
              </CardTitle>
              <CardDescription>
                The Hashy Markets database is designed for a decentralized prediction markets platform built on Hedera Hashgraph.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-primary">23</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Tables</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-primary">5</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Main Domains</div>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-primary">RLS</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Security Enabled</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Categories */}
          <div className="grid gap-8">
            
            {/* CLOB & Trading Tables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  CLOB & Trading System
                </CardTitle>
                <CardDescription>
                  Continuous Limit Order Book implementation for decentralized trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* order_queue */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">order_queue</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Queue for incoming orders before they are processed by the order matcher.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">order_id (text, unique)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">maker_account_id (text)</Badge>
                      <Badge variant="secondary">side ('BUY'|'SELL')</Badge>
                      <Badge variant="secondary">price_ticks (integer)</Badge>
                      <Badge variant="secondary">quantity (bigint)</Badge>
                      <Badge variant="secondary">time_in_force ('GTC'|'IOC'|'FOK')</Badge>
                      <Badge variant="secondary">status ('QUEUED'|'PROCESSING'|'PROCESSED')</Badge>
                    </div>
                  </div>
                </div>

                {/* clob_orders */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">clob_orders</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Active and historical orders in the CLOB system.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">order_id (text, unique)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">maker_account_id (text)</Badge>
                      <Badge variant="secondary">side ('BUY'|'SELL')</Badge>
                      <Badge variant="secondary">price_ticks (integer)</Badge>
                      <Badge variant="secondary">quantity (bigint)</Badge>
                      <Badge variant="secondary">filled_quantity (bigint)</Badge>
                      <Badge variant="secondary">status ('PENDING'|'PUBLISHED'|'FILLED'|'CANCELLED')</Badge>
                      <Badge variant="secondary">order_signature (text)</Badge>
                    </div>
                  </div>
                </div>

                {/* clob_trades */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">clob_trades</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Executed trades resulting from order matching.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">trade_id (text, unique)</Badge>
                      <Badge variant="secondary">batch_id (uuid, FK→clob_batches)</Badge>
                      <Badge variant="secondary">buy_order_id (text, FK→clob_orders)</Badge>
                      <Badge variant="secondary">sell_order_id (text, FK→clob_orders)</Badge>
                      <Badge variant="secondary">price_ticks (integer)</Badge>
                      <Badge variant="secondary">quantity (bigint)</Badge>
                      <Badge variant="secondary">buyer_account_id (text)</Badge>
                      <Badge variant="secondary">seller_account_id (text)</Badge>
                    </div>
                  </div>
                </div>

                {/* clob_positions */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">clob_positions</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    User positions in prediction markets (YES/NO shares).
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">account_id (text)</Badge>
                      <Badge variant="secondary">position_type ('YES'|'NO')</Badge>
                      <Badge variant="secondary">quantity (bigint)</Badge>
                      <Badge variant="secondary">avg_entry_price (numeric)</Badge>
                      <Badge variant="secondary">realized_pnl (numeric)</Badge>
                      <Badge variant="secondary">unrealized_pnl (numeric)</Badge>
                    </div>
                  </div>
                </div>

                {/* clob_batches */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">clob_batches</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Batch processing records for order execution and settlement.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">batch_id (bigint, unique)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">window_start (bigint)</Badge>
                      <Badge variant="secondary">window_end (bigint)</Badge>
                      <Badge variant="secondary">trades_count (integer)</Badge>
                      <Badge variant="secondary">settlement_status ('PENDING'|'SUBMITTED'|'CONFIRMED')</Badge>
                    </div>
                  </div>
                </div>

                {/* sequencer_state */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">sequencer_state</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Real-time order book state and market statistics.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">bid_levels (jsonb)</Badge>
                      <Badge variant="secondary">ask_levels (jsonb)</Badge>
                      <Badge variant="secondary">last_matched_price (integer)</Badge>
                      <Badge variant="secondary">total_volume_24h (bigint)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Markets & Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Markets & Events
                </CardTitle>
                <CardDescription>
                  Market creation, categorization, and outcome management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* event_markets */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">event_markets</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Core table for prediction markets and their metadata.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">name (varchar)</Badge>
                      <Badge variant="secondary">description (text)</Badge>
                      <Badge variant="secondary">market_type ('binary'|'multi_choice')</Badge>
                      <Badge variant="secondary">category_id (uuid, FK→market_categories)</Badge>
                      <Badge variant="secondary">subcategory_id (uuid, FK→market_subcategories)</Badge>
                      <Badge variant="secondary">end_date (timestamptz)</Badge>
                      <Badge variant="secondary">resolution_status (enum)</Badge>
                      <Badge variant="secondary">yes_price (numeric)</Badge>
                      <Badge variant="secondary">no_price (numeric)</Badge>
                      <Badge variant="secondary">volume (numeric)</Badge>
                      <Badge variant="secondary">liquidity (numeric)</Badge>
                      <Badge variant="secondary">is_active (boolean)</Badge>
                    </div>
                  </div>
                </div>

                {/* market_categories */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">market_categories</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Top-level market categories (Politics, Sports, Technology, etc.).
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">name (varchar)</Badge>
                      <Badge variant="secondary">description (text)</Badge>
                      <Badge variant="secondary">sort_order (integer)</Badge>
                      <Badge variant="secondary">is_active (boolean)</Badge>
                    </div>
                  </div>
                </div>

                {/* market_subcategories */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">market_subcategories</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Subcategories within market categories for better organization.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">category_id (uuid, FK→market_categories)</Badge>
                      <Badge variant="secondary">name (varchar)</Badge>
                      <Badge variant="secondary">description (text)</Badge>
                      <Badge variant="secondary">sort_order (integer)</Badge>
                    </div>
                  </div>
                </div>

                {/* market_options */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">market_options</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Individual options/outcomes for markets (YES/NO for binary, multiple for multi-choice).
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">option_name (text)</Badge>
                      <Badge variant="secondary">option_type ('yes'|'no'|'custom')</Badge>
                      <Badge variant="secondary">current_price (numeric)</Badge>
                      <Badge variant="secondary">candidate_name (text)</Badge>
                      <Badge variant="secondary">candidate_party (text)</Badge>
                      <Badge variant="secondary">sort_order (integer)</Badge>
                    </div>
                  </div>
                </div>

                {/* market_price_history */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">market_price_history</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Historical price data for charting and analytics.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">option_id (uuid, FK→market_options)</Badge>
                      <Badge variant="secondary">price (numeric)</Badge>
                      <Badge variant="secondary">volume (numeric)</Badge>
                      <Badge variant="secondary">timestamp (timestamptz)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Governance System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="w-5 h-5" />
                  Governance System
                </CardTitle>
                <CardDescription>
                  Decentralized governance for market creation and platform decisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* market_proposals */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">market_proposals</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Proposals for new markets submitted through governance process.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">proposer_id (uuid)</Badge>
                      <Badge variant="secondary">title (text)</Badge>
                      <Badge variant="secondary">description (text)</Badge>
                      <Badge variant="secondary">market_title (text)</Badge>
                      <Badge variant="secondary">market_description (text)</Badge>
                      <Badge variant="secondary">governance_status (enum)</Badge>
                      <Badge variant="secondary">proposal_type (enum)</Badge>
                      <Badge variant="secondary">voting_start_date (timestamptz)</Badge>
                      <Badge variant="secondary">voting_end_date (timestamptz)</Badge>
                      <Badge variant="secondary">deployed_market_id (uuid, FK→event_markets)</Badge>
                    </div>
                  </div>
                </div>

                {/* proposal_votes */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">proposal_votes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Individual votes cast on governance proposals.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">proposal_id (uuid, FK→market_proposals)</Badge>
                      <Badge variant="secondary">voter_id (uuid)</Badge>
                      <Badge variant="secondary">vote_choice (enum: 'for'|'against'|'abstain')</Badge>
                      <Badge variant="secondary">voting_power (numeric)</Badge>
                      <Badge variant="secondary">is_proposal_phase (boolean)</Badge>
                      <Badge variant="secondary">wallet_signature (text)</Badge>
                    </div>
                  </div>
                </div>

                {/* staking_positions */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">staking_positions</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Token staking for governance participation and voting power.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">user_id (uuid)</Badge>
                      <Badge variant="secondary">staked_amount (numeric)</Badge>
                      <Badge variant="secondary">stake_duration (integer)</Badge>
                      <Badge variant="secondary">voting_power_multiplier (numeric)</Badge>
                      <Badge variant="secondary">stake_start_date (timestamptz)</Badge>
                      <Badge variant="secondary">stake_end_date (timestamptz)</Badge>
                    </div>
                  </div>
                </div>

                {/* voting_power_snapshots */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">voting_power_snapshots</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Historical snapshots of voting power for governance proposals.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">user_id (uuid)</Badge>
                      <Badge variant="secondary">proposal_id (uuid, FK→market_proposals)</Badge>
                      <Badge variant="secondary">snapshot_date (timestamptz)</Badge>
                      <Badge variant="secondary">token_balance (numeric)</Badge>
                      <Badge variant="secondary">staked_balance (numeric)</Badge>
                      <Badge variant="secondary">total_voting_power (numeric)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  User profiles, wallets, and token balances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* profiles */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">profiles</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    User profile information linked to Supabase auth.users.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK, FK→auth.users)</Badge>
                      <Badge variant="secondary">email (text)</Badge>
                      <Badge variant="secondary">first_name (text)</Badge>
                      <Badge variant="secondary">last_name (text)</Badge>
                      <Badge variant="secondary">username (text)</Badge>
                      <Badge variant="secondary">bio (text)</Badge>
                      <Badge variant="secondary">avatar_url (text)</Badge>
                      <Badge variant="secondary">email_verified (boolean)</Badge>
                    </div>
                  </div>
                </div>

                {/* hedera_wallets */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">hedera_wallets</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Connected Hedera wallet information for users.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">user_id (uuid, FK→profiles)</Badge>
                      <Badge variant="secondary">account_id (text, unique)</Badge>
                      <Badge variant="secondary">public_key (text)</Badge>
                      <Badge variant="secondary">wallet_name (text)</Badge>
                      <Badge variant="secondary">is_primary (boolean)</Badge>
                      <Badge variant="secondary">last_connected_at (timestamptz)</Badge>
                    </div>
                  </div>
                </div>

                {/* user_token_balances */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">user_token_balances</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Platform token balances and voting power calculation.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">user_id (uuid, FK→profiles)</Badge>
                      <Badge variant="secondary">token_balance (numeric)</Badge>
                      <Badge variant="secondary">staked_balance (numeric)</Badge>
                      <Badge variant="secondary">total_voting_power (numeric)</Badge>
                      <Badge variant="secondary">last_updated (timestamptz)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Infrastructure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Infrastructure
                </CardTitle>
                <CardDescription>
                  HCS topics, job processing, and system configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* hcs_topics */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">hcs_topics</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Hedera Consensus Service topics for different message types.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">topic_id (text, unique)</Badge>
                      <Badge variant="secondary">topic_type ('orders'|'batches'|'oracle')</Badge>
                      <Badge variant="secondary">market_id (uuid, FK→event_markets)</Badge>
                      <Badge variant="secondary">description (text)</Badge>
                      <Badge variant="secondary">is_active (boolean)</Badge>
                    </div>
                  </div>
                </div>

                {/* topic_creation_jobs */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">topic_creation_jobs</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Asynchronous job queue for creating HCS topics.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">topic_type (text)</Badge>
                      <Badge variant="secondary">market_id (uuid)</Badge>
                      <Badge variant="secondary">status ('pending'|'processing'|'completed')</Badge>
                      <Badge variant="secondary">topic_id (text)</Badge>
                      <Badge variant="secondary">request_id (text)</Badge>
                      <Badge variant="secondary">worker_id (text)</Badge>
                    </div>
                  </div>
                </div>

                {/* secrets */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">secrets</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Encrypted storage for API keys and sensitive configuration.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">name (varchar, unique)</Badge>
                      <Badge variant="secondary">value (text, encrypted)</Badge>
                    </div>
                  </div>
                </div>

                {/* settlement_transactions */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">settlement_transactions</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Hedera transaction records for batch settlements.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">batch_id (uuid, FK→clob_batches)</Badge>
                      <Badge variant="secondary">transaction_id (text)</Badge>
                      <Badge variant="secondary">transaction_hash (text)</Badge>
                      <Badge variant="secondary">status ('PENDING'|'SUBMITTED'|'CONFIRMED')</Badge>
                      <Badge variant="secondary">gas_used (bigint)</Badge>
                      <Badge variant="secondary">transaction_fee (bigint)</Badge>
                    </div>
                  </div>
                </div>

                {/* governance_settings */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">governance_settings</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    System-wide governance parameters and configuration.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">setting_key (text, unique)</Badge>
                      <Badge variant="secondary">setting_value (jsonb)</Badge>
                      <Badge variant="secondary">description (text)</Badge>
                      <Badge variant="secondary">updated_by (uuid)</Badge>
                    </div>
                  </div>
                </div>

                {/* market_deployment_queue */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">market_deployment_queue</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Queue for deploying approved market proposals to the blockchain.
                  </p>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline"><Key className="w-3 h-3 mr-1" />id (uuid, PK)</Badge>
                      <Badge variant="secondary">proposal_id (uuid, FK→market_proposals)</Badge>
                      <Badge variant="secondary">deployment_status ('pending'|'deploying'|'deployed')</Badge>
                      <Badge variant="secondary">smart_contract_address (text)</Badge>
                      <Badge variant="secondary">yes_token_id (text)</Badge>
                      <Badge variant="secondary">no_token_id (text)</Badge>
                      <Badge variant="secondary">deployment_attempts (integer)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Key Relationships
                </CardTitle>
                <CardDescription>
                  Important foreign key relationships and data flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Market Flow</h4>
                    <div className="text-sm space-y-1">
                      <div>market_proposals → event_markets</div>
                      <div>event_markets → market_options</div>
                      <div>event_markets → clob_orders</div>
                      <div>clob_orders → clob_trades</div>
                      <div>clob_trades → clob_positions</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">User Flow</h4>
                    <div className="text-sm space-y-1">
                      <div>auth.users → profiles</div>
                      <div>profiles → hedera_wallets</div>
                      <div>profiles → user_token_balances</div>
                      <div>profiles → staking_positions</div>
                      <div>profiles → proposal_votes</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Policies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Row-Level Security (RLS)
                </CardTitle>
                <CardDescription>
                  Security policies protecting user data and system integrity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Public Read Access</h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>Market data, CLOB data, governance proposals, and categories allow public read access for transparency.</p>
                      <p className="mt-1">Tables: event_markets, clob_*, market_*, governance_settings, hcs_topics</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">User-Scoped Access</h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>User-specific data is protected by policies checking auth.uid() = user_id.</p>
                      <p className="mt-1">Tables: profiles, hedera_wallets, user_token_balances, staking_positions, proposal_votes</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Service Role Access</h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>System tables require service role privileges for backend operations.</p>
                      <p className="mt-1">Tables: secrets, topic_creation_jobs, settlement_transactions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDesignDocument;