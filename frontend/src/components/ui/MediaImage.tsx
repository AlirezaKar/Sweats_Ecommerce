import Image, { type ImageProps } from "next/image";
import { resolveMediaUrl } from "@/lib/utils/mediaUrl";

type Props = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
};

/** Product/blog media from Django — bypass optimizer to avoid dev remote fetch issues. */
export function MediaImage({ src, alt, ...props }: Props) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return null;

  return <Image {...props} src={resolved} alt={alt} unoptimized />;
}
