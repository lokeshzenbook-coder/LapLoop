export function BrandLogo({ brand, size = 10 }: { brand: string; size?: number }) {
  const style = { width: `${size * 4}px`, height: `${size * 4}px` };
  return (
    <span
      style={style}
      className="inline-flex items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-800"
    >
      {brand.charAt(0).toUpperCase()}
    </span>
  );
}