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

    const { marketId, content, position, parentCommentId, walletId } = await req.json();

    if (!marketId || !content) {
      return new Response(
        JSON.stringify({ error: 'Market ID and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Content validation
    if (content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Comment cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (content.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Comment too long (max 2000 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser();

    const commentData: any = {
      market_id: marketId,
      content: content.trim(),
      position: position || null,
      parent_comment_id: parentCommentId || null,
    };

    // Set user_id if authenticated, otherwise use wallet_id
    if (user) {
      commentData.user_id = user.id;
    } else if (walletId) {
      commentData.wallet_id = walletId;
    } else {
      return new Response(
        JSON.stringify({ error: 'Must be authenticated or provide wallet ID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: comment, error } = await supabaseClient
      .from('market_comments')
      .insert(commentData)
      .select(`
        *,
        profiles:user_id(id, username, first_name, last_name)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create comment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the comment to match expected format
    const transformedComment = {
      id: comment.id,
      author: comment.profiles?.username || 
              `${comment.profiles?.first_name || ''} ${comment.profiles?.last_name || ''}`.trim() ||
              comment.wallet_id || 'Anonymous',
      content: comment.content,
      timestamp: new Date(comment.created_at),
      likes: 0,
      dislikes: 0,
      position: comment.position,
      replies: []
    };

    return new Response(
      JSON.stringify({ comment: transformedComment }),
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