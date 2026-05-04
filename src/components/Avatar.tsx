type Props = {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name, size = 40, className = "" }: Props) {
  const initial = (name || "?").trim().slice(0, 1).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blush-300 to-lilac-300 text-white font-bold flex items-center justify-center ring-2 ring-white shadow-sm ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
