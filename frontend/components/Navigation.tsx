"use client";

import { useRouter } from "next/navigation";

type NavigationProps = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { label: "Home", href: "/studio" },
  { label: "My Art", href: "/my-art" },
  { label: "features", href: "/features" },
];

export function Navigation({ open, onClose }: NavigationProps) {
  const router = useRouter();

  const move = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className={`nav-menu${open ? " active" : ""}`}>
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                move(item.href);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}

        <li>
          <a href="" onClick={(event) => event.preventDefault()} />
        </li>
      </ul>
    </div>
  );
}
