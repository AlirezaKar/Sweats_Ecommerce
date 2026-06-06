type Props = {
  url: string;
  title: string;
  className?: string;
};

export function VideoPlayer({ url, title, className = "" }: Props) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl bg-black ${className}`}>
      <iframe
        src={url}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
