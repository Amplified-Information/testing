import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSystemHederaClientFromSecrets, twoTierConnectionTest } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client at module level for performance
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Valid topic types for validation
const VALID_TOPIC_TYPES = ['orders', 'batches', 'oracle', 'disputes'] as const
type ValidTopicType = typeof VALID_TOPIC_TYPES[number]

// Request timeout optimized for Supabase edge function limits (60s gateway timeout)
// Individual topics: 60s, Multiple operations: 120s to stay under gateway limit  
const REQUEST_TIMEOUT = 120000
const TOPIC_CREATION_TIMEOUT = 60000
const CONNECTION_TEST_TIMEOUT = 5000

// Generate request ID for logging
const generateRequestId = () => crypto.randomUUID().substring(0, 8)

// Timing utility for SDK operations
const withTiming = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
  const start = Date.now()
  try {
    const result = await operation()
    console.log(`${label} completed in ${Date.now() - start}ms`)
    return result
  } catch (error) {
    console.log(`${label} failed after ${Date.now() - start}ms:`, error)
    throw error
  }
}

// Retry with exponential backoff for testnet
const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 2, 
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Logging helper with consistent format
const log = {
  info: (requestId: string, message: string, data?: any) => {
    console.log(`[HCS Manager] [${requestId}] ${message}`, data || '')
  },
  error: (requestId: string, message: string, error?: any) => {
    console.error(`[HCS Manager] [${requestId}] ${message}`, error || '')
  },
  warn: (requestId: string, message: string, data?: any) => {
    console.warn(`[HCS Manager] [${requestId}] ${message}`, data || '')
  }
}

serve(async (req) => {
  const requestId = generateRequestId()
  const startTime = Date.now()
  
  log.info(requestId, `Received ${req.method} request`)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Wrap entire request in timeout
  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
  })

  const handleRequest = async (): Promise<Response> => {
    try {
      // Handle GET requests
      if (req.method === 'GET') {
        log.info(requestId, 'Processing GET request for HCS topics')
        
        const { data: topics, error } = await supabase
          .from('hcs_topics')
          .select('*')
          .eq('is_active', true)

        if (error) {
          log.error(requestId, 'Database error fetching topics:', error)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch topics', 
              details: error.message,
              requestId 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        log.info(requestId, `Found ${topics?.length || 0} HCS topics`)
        return new Response(
          JSON.stringify({ 
            topics,
            requestId,
            timing: { duration: Date.now() - startTime }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Handle POST requests
      if (req.method === 'POST') {
        log.info(requestId, 'Processing POST request')
        
        // Parse and validate request body
        let requestBody: any
        try {
          requestBody = await req.json()
        } catch (parseError) {
          log.error(requestId, 'JSON parsing failed:', parseError)
          return new Response(
            JSON.stringify({ 
              error: 'Invalid JSON in request body',
              details: parseError.message,
              requestId
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const { action, topicType, marketId } = requestBody
        
        // Validate required fields
        if (!action) {
          log.warn(requestId, 'Missing action in request')
          return new Response(
            JSON.stringify({ 
              error: "Missing 'action' in request body",
              requestId
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        log.info(requestId, 'Request details:', { action, topicType, marketId })
        
        switch (action) {
          case 'create_topic': {
            // Validate topicType for create_topic action
            if (!topicType) {
              log.warn(requestId, 'Missing topicType for create_topic action')
              return new Response(
                JSON.stringify({ 
                  error: "Missing 'topicType' for create_topic action",
                  requestId
                }),
                { 
                  status: 400, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }

            if (!VALID_TOPIC_TYPES.includes(topicType as ValidTopicType)) {
              log.warn(requestId, 'Invalid topicType:', topicType)
              return new Response(
                JSON.stringify({ 
                  error: `Invalid topicType. Must be one of: ${VALID_TOPIC_TYPES.join(', ')}`,
                  provided: topicType,
                  requestId
                }),
                { 
                  status: 422, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }

            try {
              log.info(requestId, 'Creating HCS topic:', { topicType, marketId })
              const topicStartTime = Date.now()
              
              // Get Hedera client with system credentials
              const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)
              log.info(requestId, 'Hedera client obtained successfully')
              
              // Create the topic using our existing logic with timeout wrapper
              // Create topic with built-in timeout and retry logic
              const topicId = await createCLOBTopic(client, topicType as ValidTopicType, marketId, privateKey)
              const topicDuration = Date.now() - topicStartTime
              
              log.info(requestId, `Successfully created topic: ${topicId} in ${topicDuration}ms`)
              
              // Store in database with ID return
              const { data: dbData, error: dbError } = await supabase
                .from('hcs_topics')
                .insert({
                  topic_id: topicId,
                  topic_type: topicType,
                  market_id: marketId || null,
                  description: `CLOB ${topicType} topic${marketId ? ` for market ${marketId}` : ''}`,
                  is_active: true
                })
                .select('id')
                .single()
              
              if (dbError) {
                log.error(requestId, 'Database insertion failed:', dbError)
                return new Response(
                  JSON.stringify({ 
                    success: false,
                    error: 'Database error',
                    details: dbError.message,
                    topicId, // Include topicId even if DB failed
                    requestId
                  }),
                  { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                )
              }
              
              const totalDuration = Date.now() - startTime
              log.info(requestId, `Request completed successfully in ${totalDuration}ms`)
              
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  topicId,
                  topicType,
                  marketId: marketId || null,
                  dbId: dbData?.id,
                  message: `Successfully created ${topicType} topic`,
                  requestId,
                  timing: {
                    totalDuration,
                    topicCreationDuration: topicDuration
                  }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
              
            } catch (error) {
              const errorDuration = Date.now() - startTime
              log.error(requestId, `Topic creation failed after ${errorDuration}ms:`, error)
              
              // Categorize error types
              let errorCategory = 'unknown'
              let statusCode = 500
              
              if (error.message?.includes('timeout')) {
                errorCategory = 'timeout'
                statusCode = 504
              } else if (error.message?.includes('network') || error.message?.includes('connection')) {
                errorCategory = 'network'
                statusCode = 502
              } else if (error.message?.includes('credentials') || error.message?.includes('unauthorized')) {
                errorCategory = 'auth'
                statusCode = 401
              }
              
              return new Response(
                JSON.stringify({ 
                  success: false,
                  error: error.message,
                  errorCategory,
                  topicType,
                  marketId: marketId || null,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }),
                { 
                  status: statusCode, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          }

          case 'setup_market_topics': {
            // Create both orders and batches topics for a specific market
            if (!marketId) {
              log.warn(requestId, 'Missing marketId for setup_market_topics action')
              return new Response(
                JSON.stringify({ 
                  error: "Missing 'marketId' for setup_market_topics action",
                  requestId
                }),
                { 
                  status: 400, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }

            try {
              log.info(requestId, 'Setting up market topics:', { marketId })
              const setupStartTime = Date.now()
              
              // Get Hedera client
              const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)
              log.info(requestId, 'Hedera client obtained successfully')
              
              // Create both topics concurrently with built-in timeout and retry
              const [ordersTopicId, batchesTopicId] = await Promise.all([
                createCLOBTopic(client, 'orders', marketId, privateKey),
                createCLOBTopic(client, 'batches', marketId, privateKey)
              ])
              
              log.info(requestId, `Created market topics:`, { ordersTopicId, batchesTopicId })
              
              // Store both topics in database
              const insertPromises = [
                supabase.from('hcs_topics').insert({
                  topic_id: ordersTopicId,
                  topic_type: 'orders',
                  market_id: marketId,
                  description: `CLOB orders topic for market ${marketId}`,
                  is_active: true
                }),
                supabase.from('hcs_topics').insert({
                  topic_id: batchesTopicId,
                  topic_type: 'batches',
                  market_id: marketId,
                  description: `CLOB batches topic for market ${marketId}`,
                  is_active: true
                })
              ]
              
              const [ordersResult, batchesResult] = await Promise.all(insertPromises)
              
              if (ordersResult.error || batchesResult.error) {
                log.error(requestId, 'Database insertion failed:', { 
                  ordersError: ordersResult.error, 
                  batchesError: batchesResult.error 
                })
                return new Response(
                  JSON.stringify({ 
                    success: false,
                    error: 'Database error during topic storage',
                    ordersTopicId,
                    batchesTopicId,
                    requestId
                  }),
                  { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                )
              }
              
              const totalDuration = Date.now() - setupStartTime
              log.info(requestId, `Market topics setup completed in ${totalDuration}ms`)
              
              return new Response(
                JSON.stringify({ 
                  success: true,
                  ordersTopicId,
                  batchesTopicId,
                  marketId,
                  message: `Successfully created market topics for ${marketId}`,
                  requestId,
                  timing: { totalDuration }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
              
            } catch (error) {
              const errorDuration = Date.now() - startTime
              log.error(requestId, `Market topics setup failed after ${errorDuration}ms:`, error)
              
              return new Response(
                JSON.stringify({ 
                  success: false,
                  error: error.message,
                  marketId,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }),
                { 
                  status: 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          }

          case 'initialize_all_markets': {
            try {
              log.info(requestId, 'Initializing all markets with HCS topics')
              const initStartTime = Date.now()
              
              // Get active markets from database
              const { data: markets, error: marketsError } = await supabase
                .from('event_markets')
                .select('id, name')
                .eq('is_active', true)
                .limit(10) // Limit to prevent timeout
              
              if (marketsError) {
                log.error(requestId, 'Failed to fetch markets:', marketsError)
                return new Response(
                  JSON.stringify({ 
                    success: false,
                    error: 'Failed to fetch active markets',
                    details: marketsError.message,
                    requestId
                  }),
                  { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                )
              }

              if (!markets || markets.length === 0) {
                log.warn(requestId, 'No active markets found')
                return new Response(
                  JSON.stringify({ 
                    success: true,
                    message: 'No active markets found to initialize',
                    marketsProcessed: 0,
                    requestId
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              }

              // Get Hedera client
              const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)
              log.info(requestId, `Processing ${markets.length} markets`)
              
              const results = []
              let successCount = 0
              let errorCount = 0
              
              // Process markets sequentially to avoid overwhelming Hedera
              // Add small delay between markets to respect Hedera rate limits
              for (const market of markets) {
                try {
                  log.info(requestId, `Processing market: ${market.name} (${market.id})`)
                  
                  // Create topics with built-in timeout and retry logic
                  const [ordersTopicId, batchesTopicId] = await Promise.all([
                    createCLOBTopic(client, 'orders', market.id, privateKey),
                    createCLOBTopic(client, 'batches', market.id, privateKey)
                  ])
                  
                  // Store both topics in database concurrently
                  await Promise.all([
                    supabase.from('hcs_topics').insert({
                      topic_id: ordersTopicId,
                      topic_type: 'orders',
                      market_id: market.id,
                      description: `CLOB orders topic for market ${market.name}`,
                      is_active: true
                    }),
                    supabase.from('hcs_topics').insert({
                      topic_id: batchesTopicId,
                      topic_type: 'batches',
                      market_id: market.id,
                      description: `CLOB batches topic for market ${market.name}`,
                      is_active: true
                    })
                  ])
                  
                  results.push({
                    marketId: market.id,
                    marketName: market.name,
                    success: true,
                    ordersTopicId,
                    batchesTopicId
                  })
                  
                  successCount++
                  log.info(requestId, `Market ${market.name} processed successfully`)
                  
                } catch (error) {
                  log.error(requestId, `Failed to process market ${market.name}:`, error)
                  results.push({
                    marketId: market.id,
                    marketName: market.name,
                    success: false,
                    error: error.message
                  })
                  errorCount++
                }
              }
              
              const totalDuration = Date.now() - initStartTime
              log.info(requestId, `Initialization completed: ${successCount} success, ${errorCount} errors in ${totalDuration}ms`)
              
              return new Response(
                JSON.stringify({ 
                  success: true,
                  message: `Processed ${markets.length} markets`,
                  marketsProcessed: markets.length,
                  successCount,
                  errorCount,
                  results,
                  requestId,
                  timing: { totalDuration }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
              
            } catch (error) {
              const errorDuration = Date.now() - startTime
              log.error(requestId, `Market initialization failed after ${errorDuration}ms:`, error)
              
              return new Response(
                JSON.stringify({ 
                  success: false,
                  error: error.message,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }),
                { 
                  status: 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          }

          case 'connection_test': {
            try {
              log.info(requestId, 'Running two-tier connection test')
              const testStartTime = Date.now()
              
              // Get Hedera client and account ID
              const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)
              
              // Extract operator account ID from secrets for the test
              const { data: secrets, error: secretsError } = await supabase
                .from('secrets')
                .select('name, value')
                .eq('name', 'CLOB_SYSTEM_ACCOUNT_ID')
                .single()

              if (secretsError || !secrets) {
                log.error(requestId, 'Failed to get operator account ID:', secretsError)
                return new Response(
                  JSON.stringify({ 
                    success: false,
                    error: 'Failed to retrieve operator account ID',
                    requestId
                  }),
                  { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  }
                )
              }

              // Run two-tier connection test
              const testResult = await twoTierConnectionTest(client, secrets.value)
              const testDuration = Date.now() - testStartTime
              
              log.info(requestId, `Connection test completed in ${testDuration}ms:`, testResult.summary)
              
              return new Response(
                JSON.stringify({ 
                  ...testResult,
                  requestId,
                  timing: { totalDuration: testDuration }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
              
            } catch (error) {
              const errorDuration = Date.now() - startTime
              log.error(requestId, `Connection test failed after ${errorDuration}ms:`, error)
              
              return new Response(
                JSON.stringify({ 
                  success: false,
                  phase: "Connection Test Error",
                  error: error.message,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }),
                { 
                  status: 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          }
          
          default:
            log.warn(requestId, 'Unsupported action:', action)
            return new Response(
              JSON.stringify({ 
                error: 'Unsupported action',
                provided: action,
                supportedActions: ['create_topic', 'setup_market_topics', 'initialize_all_markets', 'connection_test'],
                requestId
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
        }
      }

      // Method not allowed
      log.warn(requestId, `Method not allowed: ${req.method}`)
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          method: req.method,
          allowedMethods: ['GET', 'POST', 'OPTIONS'],
          requestId
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      const errorDuration = Date.now() - startTime
      log.error(requestId, `Unexpected error after ${errorDuration}ms:`, error)
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          details: error.message,
          requestId,
          timing: { failedAfter: errorDuration }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  }

  try {
    return await Promise.race([handleRequest(), timeoutPromise])
  } catch (timeoutError) {
    log.error(requestId, 'Request timed out after 30s')
    return new Response(
      JSON.stringify({ 
        error: 'Request timeout',
        details: 'Request exceeded 30 second limit',
        requestId,
        timing: { timeout: REQUEST_TIMEOUT }
      }),
      { 
        status: 504, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})