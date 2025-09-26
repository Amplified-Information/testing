import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Flag, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMarketComments, Comment } from "@/hooks/useMarketComments";

interface DiscussionBoardProps {
  marketId: string;
}

const DiscussionBoard = ({ marketId }: DiscussionBoardProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'YES' | 'NO' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { comments, loading, error, addComment, toggleReaction } = useMarketComments(marketId);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await addComment(newComment, selectedPosition, replyingTo);
      setNewComment("");
      setReplyingTo(null);
      setSelectedPosition(null);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, reactionType: 'like' | 'dislike') => {
    await toggleReaction(commentId, reactionType);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex gap-3 p-4 rounded-lg border bg-card">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.author.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author}</span>
            {comment.position && (
              <Badge 
                variant={comment.position === 'YES' ? 'default' : 'destructive'}
                className="text-xs px-2 py-0"
              >
                {comment.position}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(comment.timestamp)} ago
            </span>
          </div>
          
          <p className="text-sm leading-relaxed">{comment.content}</p>
          
          <div className="flex items-center gap-4 pt-1">
            <button 
              onClick={() => handleReaction(comment.id, 'like')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ThumbsUp className="h-3 w-3" />
              {comment.likes}
            </button>
            <button 
              onClick={() => handleReaction(comment.id, 'dislike')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <ThumbsDown className="h-3 w-3" />
              {comment.dislikes}
            </button>
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <Flag className="h-3 w-3" />
              Report
            </button>
          </div>
          
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Post Reply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion
          </CardTitle>
          <Badge variant="secondary">{comments.length} comments</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
          <Textarea
            placeholder="Share your thoughts, analysis, or ask questions about this market..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={selectedPosition === 'YES' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPosition(selectedPosition === 'YES' ? null : 'YES')}
              >
                <Badge variant="default" className="mr-1">YES</Badge>
                Position
              </Button>
              <Button 
                variant={selectedPosition === 'NO' ? "destructive" : "outline"} 
                size="sm"
                onClick={() => setSelectedPosition(selectedPosition === 'NO' ? null : 'NO')}
              >
                <Badge variant="destructive" className="mr-1">NO</Badge>
                Position
              </Button>
            </div>
            <Button 
              onClick={handleSubmitComment} 
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Post Comment
            </Button>
          </div>
        </div>
        
        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading comments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{error}</p>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to start the discussion!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscussionBoard;