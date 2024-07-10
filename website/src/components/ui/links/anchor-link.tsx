import type { LinkProps } from 'next/link';
import NextLink from 'next/link';

const AnchorLink: React.FC<
  LinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
> = ({ href, ...props }) => {
  return (
    <NextLink legacyBehavior href={href}>
      <a {...props} />
    </NextLink>
  );
};

export default AnchorLink;
