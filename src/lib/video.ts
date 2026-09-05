export function formatVideoEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube watch URL: youtube.com/watch?v=ID
  const ytWatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytWatch && ytWatch[1]) {
    return `https://www.youtube.com/embed/${ytWatch[1]}`;
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Loom: loom.com/share/ID -> loom.com/embed/ID
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch && loomMatch[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  return trimmed;
}

export function detectVideoProvider(url?: string | null): "youtube" | "vimeo" | "loom" | "direct" | "external" {
  if (!url) return "external";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.includes("loom.com")) return "loom";
  if (url.match(/\.(mp4|webm|ogg)$/i)) return "direct";
  return "external";
}
