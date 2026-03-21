import Link from "next/link";

type SimpleNavProps = {
  items: Array<{ href: string; label: string }>;
};

export function SimpleNav({ items }: SimpleNavProps) {
  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        padding: 16,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

