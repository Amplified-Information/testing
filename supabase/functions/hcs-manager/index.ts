import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topicType, marketId, requestId } = await req.json()

    switch (action) {
      case 'create_topic': {
        const newRequestId = crypto.randomUUID()

        const { error } = await supabase.from('topic_creation_jobs').insert({
          request_id: newRequestId,
          topic_type: topicType,
          market_id: marketId,
          status: 'pending'
        })

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            requestId: newRequestId,
            message: 'Topic creation enqueued. Poll status with action=topic_status.'
          }),
          { headers: corsHeaders, status: 202 }
        )
      }

      case 'topic_status': {
        const { data, error } = await supabase
          .from('topic_creation_jobs')
          .select('*')
          .eq('request_id', requestId)
          .single()

        if (error || !data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Job not found' }),
            { headers: corsHeaders, status: 404 }
          )
        }

        return new Response(JSON.stringify(data), {
          headers: corsHeaders,
          status: 200
        })
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: corsHeaders, status: 400 }
        )
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: corsHeaders, status: 500 }
    )
  }
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