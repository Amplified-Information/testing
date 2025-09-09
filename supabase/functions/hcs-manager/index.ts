import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { getSystemHederaClientFromSecrets, twoTierConnectionTest } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Background job processing function
async function processTopicCreationJob(requestId: string, supabase: any, log: any) {
  const startTime = Date.now()
  
  try {
    log.info(requestId, "Starting background topic creation")
    
    // Get job details
    const { data: job, error: fetchError } = await supabase
      .from("topic_creation_jobs")
      .select("*")
      .eq("request_id", requestId)
      .single()

    if (fetchError || !job) {
      throw new Error(`Job not found: ${fetchError?.message}`)
    }

    const { topic_type, market_id } = job

    // Update status to processing
    await supabase.from("topic_creation_jobs")
      .update({ status: "processing" })
      .eq("request_id", requestId)

    // Create the topic
    const { client, privateKey } = await getSystemHederaClientFromSecrets(supabase)
    const topicId = await createCLOBTopic(client, topic_type as 'orders' | 'batches' | 'oracle' | 'disputes', market_id, privateKey)
    
    // Store the topic in hcs_topics table
    const { error: hcsError } = await supabase
      .from('hcs_topics')
      .insert({
        topic_id: topicId,
        topic_type: topic_type,
        market_id: market_id,
        description: `CLOB ${topic_type} topic${market_id ? ` for market ${market_id}` : ''}`
      })

    if (hcsError) {
      log.error(requestId, "Failed to store topic in hcs_topics", hcsError)
    }

    const duration = Date.now() - startTime
    log.info(requestId, `✅ Topic created: ${topicId} in ${duration}ms`)

    // Update job with success
    await supabase.from("topic_creation_jobs")
      .update({
        status: "success",
        topic_id: topicId,
        duration,
        completed_at: new Date().toISOString()
      })
      .eq("request_id", requestId)

  } catch (error) {
    log.error(requestId, "❌ Topic creation failed", error)

    // Update job with failure
    await supabase.from("topic_creation_jobs")
      .update({
        status: "failed",
        error: error.message,
        completed_at: new Date().toISOString()
      })
      .eq("request_id", requestId)
  }
}

// Constants
const REQUEST_TIMEOUT = 30000 // 30 seconds
const VALID_TOPIC_TYPES = ['orders', 'batches', 'oracle', 'disputes'] as const
type ValidTopicType = typeof VALID_TOPIC_TYPES[number]

// Logging utility with request ID
const log = {
  info: (requestId: string, ...args: any[]) => console.log(`[HCS Manager] [${requestId}]`, ...args),
  warn: (requestId: string, ...args: any[]) => console.warn(`[HCS Manager] [${requestId}]`, ...args),
  error: (requestId: string, ...args: any[]) => console.error(`[HCS Manager] [${requestId}]`, ...args),
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to create consistent JSON responses
function createJSONResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8)
  const startTime = Date.now()
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      log.info(requestId, 'Received OPTIONS request')
      return new Response(null, { headers: corsHeaders })
    }

    // Timeout promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
    })

    const handleRequest = async (): Promise<Response> => {
      try {
        // Handle GET requests - fetch active HCS topics
        if (req.method === 'GET') {
          log.info(requestId, 'Processing GET request for HCS topics')
          
          try {
            const { data: topics, error } = await supabase
              .from('hcs_topics')
              .select('*')
              .eq('is_active', true)

            if (error) {
              log.error(requestId, 'Database error fetching topics:', error)
              return createJSONResponse({ 
                error: 'Failed to fetch topics', 
                details: error.message,
                requestId
              }, 500)
            }

            const activeTopics = topics || []
            log.info(requestId, `Retrieved ${activeTopics.length} active topics`)
            return createJSONResponse(activeTopics)
          } catch (error) {
            log.error(requestId, 'Error fetching topics:', error)
            return createJSONResponse({ 
              error: 'Failed to fetch active topics',
              details: error.message,
              requestId
            }, 500)
          }
        }

        // Handle POST requests
        if (req.method === 'POST') {
          log.info(requestId, 'Received POST request')
          log.info(requestId, 'Processing POST request')

          let requestBody
          try {
            const bodyText = await req.text()
            if (!bodyText.trim()) {
              log.warn(requestId, 'Empty request body')
              return createJSONResponse({ 
                error: 'Request body is empty',
                requestId
              }, 400)
            }
            requestBody = JSON.parse(bodyText)
          } catch (error) {
            log.error(requestId, 'Failed to parse request body:', error)
            return createJSONResponse({ 
              error: 'Invalid JSON in request body',
              requestId
            }, 400)
          }

          const { action, topicType, marketId } = requestBody
          
          // Validate required fields
          if (!action) {
            log.warn(requestId, 'Missing action in request')
            return createJSONResponse({ 
              error: "Missing 'action' in request body",
              requestId
            }, 400)
          }

          log.info(requestId, 'Request details:', {
            action,
            topicType,
            marketId
          })

          // Get Hedera client
          let hederaClient, operatorPrivateKey
          try {
            log.info(requestId, 'Getting Hedera client from secrets...')
            const result = await getSystemHederaClientFromSecrets(supabase)
            hederaClient = result.client
            operatorPrivateKey = result.privateKey
            log.info(requestId, 'Hedera client obtained successfully')
          } catch (error) {
            log.error(requestId, 'Failed to get Hedera client:', error)
            return createJSONResponse({ 
              error: 'Failed to initialize Hedera client', 
              details: error.message,
              requestId
            }, 500)
          }

          switch (action) {
            case 'create_topic': {
              if (!topicType) {
                return createJSONResponse({ 
                  error: "Missing 'topicType' for create_topic action",
                  requestId
                }, 400)
              }

              if (!VALID_TOPIC_TYPES.includes(topicType as ValidTopicType)) {
                return createJSONResponse({ 
                  error: 'Invalid topic type',
                  provided: topicType,
                  validTypes: VALID_TOPIC_TYPES,
                  requestId
                }, 400)
              }

              const asyncRequestId = crypto.randomUUID()
              
              try {
                log.info(requestId, "Enqueuing async topic creation request", { topicType, marketId, asyncRequestId })

                // Save a pending job in DB
                const { error: dbError } = await supabase.from("topic_creation_jobs").insert({
                  request_id: asyncRequestId,
                  topic_type: topicType,
                  market_id: marketId,
                  status: "pending"
                })

                if (dbError) {
                  log.error(requestId, "Failed to enqueue topic creation", dbError)
                  throw new Error(`Database error: ${dbError.message}`)
                }

                // Start background processing
                EdgeRuntime.waitUntil(processTopicCreationJob(asyncRequestId, supabase, log))

                // Respond immediately (don't wait for Hedera)
                return createJSONResponse({
                  success: true,
                  requestId: asyncRequestId,
                  message: "Topic creation started. Poll status with topic_status action.",
                  status: "pending",
                  topicType,
                  marketId: marketId || null
                }, 202)
              } catch (error) {
                log.error(requestId, "Failed to enqueue topic creation", error)
                return createJSONResponse({
                  success: false,
                  requestId: asyncRequestId,
                  error: error.message
                }, 500)
              }
            }

            case 'topic_status': {
              const { requestId: jobRequestId } = requestBody
              
              if (!jobRequestId) {
                return createJSONResponse({
                  success: false,
                  error: "requestId is required for topic_status action",
                  requestId
                }, 400)
              }

              try {
                const { data, error } = await supabase
                  .from("topic_creation_jobs")
                  .select("*")
                  .eq("request_id", jobRequestId)
                  .single()

                if (error || !data) {
                  return createJSONResponse({
                    success: false,
                    error: "Job not found",
                    requestId: jobRequestId
                  }, 404)
                }

                return createJSONResponse({
                  success: true,
                  job: data,
                  requestId: jobRequestId
                })
              } catch (error) {
                log.error(requestId, "Failed to fetch job status", error)
                return createJSONResponse({
                  success: false,
                  error: error.message,
                  requestId: jobRequestId
                }, 500)
              }
            }

            case 'setup_market_topics': {
              if (!marketId) {
                return createJSONResponse({ 
                  error: "Missing 'marketId' for setup_market_topics action",
                  requestId
                }, 400)
              }

              log.info(requestId, 'Setting up market topics:', { marketId })

              try {
                const results = []
                const errors = []

                // Create orders topic
                log.info(requestId, `Creating orders topic for market ${marketId}`)
                try {
                  const ordersTopicId = await createCLOBTopic(
                    hederaClient,
                    'orders',
                    marketId,
                    operatorPrivateKey
                  )
                  results.push({ type: 'orders', topicId: ordersTopicId })
                  log.info(requestId, `✅ Orders topic created: ${ordersTopicId}`)
                } catch (error) {
                  log.error(requestId, 'Orders topic creation failed:', error)
                  errors.push({ type: 'orders', error: error.message })
                }

                // Create batches topic
                log.info(requestId, `Creating batches topic for market ${marketId}`)
                try {
                  const batchesTopicId = await createCLOBTopic(
                    hederaClient,
                    'batches',
                    marketId,
                    operatorPrivateKey
                  )
                  results.push({ type: 'batches', topicId: batchesTopicId })
                  log.info(requestId, `✅ Batches topic created: ${batchesTopicId}`)
                } catch (error) {
                  log.error(requestId, 'Batches topic creation failed:', error)
                  errors.push({ type: 'batches', error: error.message })
                }

                const duration = Date.now() - startTime
                
                if (errors.length === 0) {
                  log.info(requestId, `Market topics setup completed after ${duration}ms`)
                  return createJSONResponse({
                    success: true,
                    marketId,
                    topics: results,
                    requestId,
                    timing: { duration }
                  })
                } else {
                  log.error(requestId, `Market topics setup partially failed after ${duration}ms`)
                  return createJSONResponse({
                    success: results.length > 0,
                    marketId,
                    topics: results,
                    errors,
                    requestId,
                    timing: { failedAfter: duration }
                  }, results.length > 0 ? 207 : 500) // 207 = Multi-Status
                }
              } catch (error) {
                const errorDuration = Date.now() - startTime
                log.error(requestId, `Market topics setup failed after ${errorDuration}ms:`, error)
                return createJSONResponse({
                  error: 'Market topics setup failed',
                  details: error.message,
                  marketId,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }, 500)
              }
            }

            case 'initialize_all_markets': {
              log.info(requestId, 'Initializing topics for all markets')

              try {
                // Fetch all active markets
                const { data: markets, error: marketError } = await supabase
                  .from('event_markets')
                  .select('id, title')
                  .eq('is_active', true)

                if (marketError) {
                  log.error(requestId, 'Error fetching markets:', marketError)
                  return createJSONResponse({
                    error: 'Failed to fetch active markets',
                    details: marketError.message,
                    requestId
                  }, 500)
                }

                if (!markets || markets.length === 0) {
                  log.info(requestId, 'No active markets found')
                  return createJSONResponse({
                    success: true,
                    message: 'No active markets found',
                    marketCount: 0,
                    requestId
                  })
                }

                log.info(requestId, `Found ${markets.length} active markets`)
                
                const results = []
                const errors = []

                // Process each market
                for (const market of markets) {
                  log.info(requestId, `Processing market: ${market.title} (${market.id})`)
                  
                  try {
                    // Create orders topic
                    const ordersTopicId = await createCLOBTopic(
                      hederaClient,
                      'orders',
                      market.id,
                      operatorPrivateKey
                    )
                    
                    // Create batches topic
                    const batchesTopicId = await createCLOBTopic(
                      hederaClient,
                      'batches',
                      market.id,
                      operatorPrivateKey
                    )

                    results.push({
                      marketId: market.id,
                      marketTitle: market.title,
                      topics: {
                        orders: ordersTopicId,
                        batches: batchesTopicId
                      }
                    })

                    log.info(requestId, `✅ Completed market ${market.title}`)
                  } catch (error) {
                    log.error(requestId, `❌ Failed market ${market.title}:`, error)
                    errors.push({
                      marketId: market.id,
                      marketTitle: market.title,
                      error: error.message
                    })
                  }
                }

                const duration = Date.now() - startTime
                
                log.info(requestId, `Markets initialization completed after ${duration}ms`)
                
                return createJSONResponse({
                  success: results.length > 0,
                  processedMarkets: results.length,
                  failedMarkets: errors.length,
                  totalMarkets: markets.length,
                  results,
                  errors: errors.length > 0 ? errors : undefined,
                  requestId,
                  timing: { duration }
                }, errors.length > 0 && results.length === 0 ? 500 : 200)
              } catch (error) {
                const errorDuration = Date.now() - startTime
                log.error(requestId, `Markets initialization failed after ${errorDuration}ms:`, error)
                return createJSONResponse({
                  error: 'Markets initialization failed',
                  details: error.message,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }, 500)
              }
            }

            case 'connection_test': {
              log.info(requestId, 'Performing Hedera connection test')

              try {
                const testResult = await twoTierConnectionTest(
                  hederaClient,
                  hederaClient.operatorAccountId?.toString() || ''
                )

                const duration = Date.now() - startTime
                log.info(requestId, `Connection test completed after ${duration}ms`)

                return createJSONResponse({
                  success: true,
                  connectionTest: testResult,
                  requestId,
                  timing: { duration }
                })
              } catch (error) {
                const errorDuration = Date.now() - startTime
                log.error(requestId, `Connection test failed after ${errorDuration}ms:`, error)
                return createJSONResponse({
                  error: 'Connection test failed',
                  details: error.message,
                  requestId,
                  timing: { failedAfter: errorDuration }
                }, 500)
              }
            }
            
            default: {
              log.warn(requestId, 'Unsupported action:', action)
              return createJSONResponse({ 
                error: 'Unsupported action',
                provided: action,
                supportedActions: ['create_topic', 'topic_status', 'setup_market_topics', 'initialize_all_markets', 'connection_test'],
                requestId
              }, 400)
            }
          }
        }

        // Method not allowed
        log.warn(requestId, `Method not allowed: ${req.method}`)
        return createJSONResponse({ 
          error: 'Method not allowed',
          method: req.method,
          allowedMethods: ['GET', 'POST', 'OPTIONS'],
          requestId
        }, 405)

      } catch (error) {
        const errorDuration = Date.now() - startTime
        log.error(requestId, `Unexpected error after ${errorDuration}ms:`, error)
        
        return createJSONResponse({ 
          error: 'Internal server error', 
          details: error.message,
          requestId,
          timing: { failedAfter: errorDuration }
        }, 500)
      }
    }

    // Execute with timeout
    return await Promise.race([handleRequest(), timeoutPromise])
  } catch (timeoutError) {
    log.error(requestId, 'Request timed out after 30s')
    return createJSONResponse({ 
      error: 'Request timeout',
      details: 'Request exceeded 30 second limit',
      requestId,
      timing: { timeout: REQUEST_TIMEOUT }
    }, 504)
  }
})