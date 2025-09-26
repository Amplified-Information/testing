import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const marketId = url.searchParams.get('marketId');

    if (!marketId) {
      return new Response(
        JSON.stringify({ error: 'Market ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch comments with reaction counts and user profiles
    const { data: comments, error } = await supabaseClient
      .from('market_comments')
      .select(`
        *,
        profiles:user_id(id, username, first_name, last_name),
        reactions:comment_reactions(reaction_type),
        replies:market_comments!parent_comment_id(
          *,
          profiles:user_id(id, username, first_name, last_name),
          reactions:comment_reactions(reaction_type)
        )
      `)
      .eq('market_id', marketId)
      .eq('is_active', true)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch comments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data to match the expected format
    const transformedComments = comments?.map(comment => ({
      id: comment.id,
      author: comment.profiles?.username || 
              `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() ||
              comment.wallet_id || 'Anonymous',
      content: comment.content,
      timestamp: new Date(comment.created_at),
      likes: comment.reactions?.filter((r: any) => r.reaction_type === 'like').length || 0,
      dislikes: comment.reactions?.filter((r: any) => r.reaction_type === 'dislike').length || 0,
      position: comment.position,
      replies: comment.replies?.map((reply: any) => ({
        id: reply.id,
        author: reply.profiles?.username || 
                `${reply.profiles?.first_name || ''} ${reply.profiles?.last_name || ''}`.trim() ||
                reply.wallet_id || 'Anonymous',
        content: reply.content,
        timestamp: new Date(reply.created_at),
        likes: reply.reactions?.filter((r: any) => r.reaction_type === 'like').length || 0,
        dislikes: reply.reactions?.filter((r: any) => r.reaction_type === 'dislike').length || 0,
        position: reply.position
      })) || []
    })) || [];

    return new Response(
      JSON.stringify({ comments: transformedComments }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});