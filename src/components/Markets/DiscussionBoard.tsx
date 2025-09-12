import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  dislikes: number;
  replies?: Comment[];
  position?: 'YES' | 'NO' | null;
}

interface DiscussionBoardProps {
  marketId: string;
}

const DiscussionBoard = ({ marketId }: DiscussionBoardProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Mock data - in real app this would come from API
  const [comments] = useState<Comment[]>([
    {
      id: "1",
      author: "PredictionMaster",
      content: "Looking at the latest polling data, I think YES is undervalued here. The fundamentals are strong and there's been positive momentum in recent weeks.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12,
      dislikes: 3,
      position: 'YES',
      replies: [
        {
          id: "1-1",
          author: "SkepticalTrader",
          content: "I disagree. The polls can be misleading and there are several risk factors not being priced in properly.",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          likes: 8,
          dislikes: 1,
          position: 'NO'
        }
      ]
    },
    {
      id: "2",
      author: "DataAnalyst99",
      content: "Has anyone done a proper technical analysis on the price movement? I'm seeing some interesting patterns in the volume data.",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likes: 6,
      dislikes: 0,
      position: null
    },
    {
      id: "3",
      author: "MarketMover",
      content: "Just placed a large YES position. The risk/reward here is excellent given the current odds.",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      likes: 15,
      dislikes: 7,
      position: 'YES'
    }
  ]);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    // In real app, this would submit to API
    console.log("Submitting comment:", newComment);
    setNewComment("");
    setReplyingTo(null);
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
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ThumbsUp className="h-3 w-3" />
              {comment.likes}
            </button>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
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
                <Button size="sm" onClick={handleSubmitComment}>
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
              <Button variant="outline" size="sm">
                <Badge variant="default" className="mr-1">YES</Badge>
                Position
              </Button>
              <Button variant="outline" size="sm">
                <Badge variant="destructive" className="mr-1">NO</Badge>
                Position
              </Button>
            </div>
            <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </div>
        
        {/* Comments List */}
        <div className="space-y-4">
          {comments.map(comment => renderComment(comment))}
        </div>
        
        {comments.length === 0 && (
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