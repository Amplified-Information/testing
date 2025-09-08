import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  Client, 
  TopicCreateTransaction, 
  AccountId, 
  PrivateKey 
} from 'npm:@hashgraph/sdk@2.72.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const systemAccountId = Deno.env.get('CLOB_SYSTEM_ACCOUNT_ID')!
const systemAccountPrivateKey = Deno.env.get('CLOB_SYSTEM_ACCOUNT_PRIVATE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (req.method === 'POST') {
      const { action, topicType, marketId, description } = await req.json()
      
      if (action === 'create_topic') {
        console.log('Creating HCS topic:', { topicType, marketId })
        
        // Initialize Hedera client
        const client = Client.forTestnet()
        const operatorAccountId = AccountId.fromString(systemAccountId)
        const operatorPrivateKey = PrivateKey.fromString(systemAccountPrivateKey)
        client.setOperator(operatorAccountId, operatorPrivateKey)

        // Create HCS topic
        const transaction = new TopicCreateTransaction()
          .setTopicMemo(`CLOB-${topicType}${marketId ? `-${marketId}` : ''}`)
          .setAdminKey(operatorPrivateKey.publicKey)
          .setSubmitKey(operatorPrivateKey.publicKey)

        const txResponse = await transaction.execute(client)
        const receipt = await txResponse.getReceipt(client)
        const topicId = receipt.topicId?.toString()

        if (!topicId) {
          throw new Error('Failed to create HCS topic')
        }

        // Store topic in database
        const { data: topic, error } = await supabase
          .from('hcs_topics')
          .insert({
            topic_id: topicId,
            topic_type: topicType,
            market_id: marketId || null,
            description: description || `CLOB ${topicType} topic${marketId ? ` for market ${marketId}` : ''}`,
            is_active: true
          })
          .select()
          .single()

        if (error) {
          console.error('Failed to store topic in database:', error)
          throw new Error('Failed to store topic in database')
        }

        console.log('HCS topic created successfully:', { topicId, topicType, marketId })

        return new Response(
          JSON.stringify({ 
            success: true, 
            topicId, 
            topic 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'setup_market_topics') {
        // Create topics for a specific market
        const topics = []
        
        for (const type of ['orders', 'batches'] as const) {
          console.log(`Creating ${type} topic for market ${marketId}`)
          
          const client = Client.forTestnet()
          const operatorAccountId = AccountId.fromString(systemAccountId)
          const operatorPrivateKey = PrivateKey.fromString(systemAccountPrivateKey)
          client.setOperator(operatorAccountId, operatorPrivateKey)

          const transaction = new TopicCreateTransaction()
            .setTopicMemo(`CLOB-${type}-${marketId}`)
            .setAdminKey(operatorPrivateKey.publicKey)
            .setSubmitKey(operatorPrivateKey.publicKey)

          const txResponse = await transaction.execute(client)
          const receipt = await txResponse.getReceipt(client)
          const topicId = receipt.topicId?.toString()

          if (!topicId) {
            throw new Error(`Failed to create ${type} topic`)
          }

          const { data: topic, error } = await supabase
            .from('hcs_topics')
            .insert({
              topic_id: topicId,
              topic_type: type,
              market_id: marketId,
              description: `CLOB ${type} topic for market ${marketId}`,
              is_active: true
            })
            .select()
            .single()

          if (error) {
            console.error(`Failed to store ${type} topic:`, error)
            throw new Error(`Failed to store ${type} topic`)
          }

          topics.push(topic)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            marketId,
            topics 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'initialize_all_markets') {
        // Create topics for all active markets that don't have them
        const { data: markets, error: marketsError } = await supabase
          .from('event_markets')
          .select('id, name')
          .eq('is_active', true)

        if (marketsError) {
          throw new Error('Failed to fetch markets')
        }

        const results = []

        for (const market of markets || []) {
          // Check if market already has topics
          const { data: existingTopics } = await supabase
            .from('hcs_topics')
            .select('topic_type')
            .eq('market_id', market.id)
            .eq('is_active', true)

          const hasOrders = existingTopics?.some(t => t.topic_type === 'orders')
          const hasBatches = existingTopics?.some(t => t.topic_type === 'batches')

          if (hasOrders && hasBatches) {
            console.log(`Market ${market.id} already has all topics`)
            continue
          }

          console.log(`Setting up topics for market: ${market.name} (${market.id})`)
          
          const marketTopics = []
          
          for (const type of ['orders', 'batches'] as const) {
            if (type === 'orders' && hasOrders) continue
            if (type === 'batches' && hasBatches) continue
            
            const client = Client.forTestnet()
            const operatorAccountId = AccountId.fromString(systemAccountId)
            const operatorPrivateKey = PrivateKey.fromString(systemAccountPrivateKey)
            client.setOperator(operatorAccountId, operatorPrivateKey)

            const transaction = new TopicCreateTransaction()
              .setTopicMemo(`CLOB-${type}-${market.id}`)
              .setAdminKey(operatorPrivateKey.publicKey)
              .setSubmitKey(operatorPrivateKey.publicKey)

            const txResponse = await transaction.execute(client)
            const receipt = await txResponse.getReceipt(client)
            const topicId = receipt.topicId?.toString()

            if (!topicId) {
              throw new Error(`Failed to create ${type} topic for market ${market.id}`)
            }

            const { data: topic, error } = await supabase
              .from('hcs_topics')
              .insert({
                topic_id: topicId,
                topic_type: type,
                market_id: market.id,
                description: `CLOB ${type} topic for ${market.name}`,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              console.error(`Failed to store ${type} topic for market ${market.id}:`, error)
              throw new Error(`Failed to store ${type} topic`)
            }

            marketTopics.push(topic)
          }

          results.push({
            marketId: market.id,
            marketName: market.name,
            topics: marketTopics
          })
        }

        console.log(`Initialized ${results.length} markets with HCS topics`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            initialized: results.length,
            results 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (req.method === 'GET') {
      // Get HCS topics
      const url = new URL(req.url)
      const marketId = url.searchParams.get('marketId')
      const topicType = url.searchParams.get('topicType')

      let query = supabase
        .from('hcs_topics')
        .select('*')
        .eq('is_active', true)

      if (marketId) {
        query = query.eq('market_id', marketId)
      }

      if (topicType) {
        query = query.eq('topic_type', topicType)
      }

      const { data: topics, error } = await query

      if (error) {
        throw new Error('Failed to fetch topics')
      }

      return new Response(
        JSON.stringify({ topics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('HCS Manager error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})