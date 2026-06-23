type PageStyleProps = {
  href: string;
};

export function PageStyle({ href }: PageStyleProps) {
  return <link rel="stylesheet" href={href} />;
}
