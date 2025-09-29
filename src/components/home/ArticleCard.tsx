import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticleCardProps {
  title: string;
  summary: string;
  date: string;
  url: string;
}

const ArticleCard = ({ title, summary, date, url }: ArticleCardProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <a 
      href={url} 
      onClick={handleClick}
      className="block"
      aria-label={`Read article: ${title}`}
    >
      <Card className="h-full transition-all hover:shadow-glow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
          <p className="mt-3 text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </a>
  );
};

export default ArticleCard;
