import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getSystemHederaClientFromSecrets } from '../_shared/hederaClient.ts'
import { createCLOBTopic } from '../_shared/topicService.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client at module level for performance
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Valid topic types for validation
const VALID_TOPIC_TYPES = ['orders', 'batches', 'oracle', 'disputes'] as const
type ValidTopicType = typeof VALID_TOPIC_TYPES[number]

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000

// Generate request ID for logging
const generateRequestId = () => crypto.randomUUID().substring(0, 8)

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
              const client = await getSystemHederaClientFromSecrets(supabase)
              log.info(requestId, 'Hedera client obtained successfully')
              
              // Create the topic using our existing logic with timeout wrapper
              const topicCreationPromise = createCLOBTopic(client, topicType as ValidTopicType, marketId)
              const topicTimeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Topic creation timeout')), 25000) // 25s timeout
              })
              
              const topicId = await Promise.race([topicCreationPromise, topicTimeoutPromise])
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
          
          default:
            log.warn(requestId, 'Unsupported action:', action)
            return new Response(
              JSON.stringify({ 
                error: 'Unsupported action',
                provided: action,
                supportedActions: ['create_topic'],
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