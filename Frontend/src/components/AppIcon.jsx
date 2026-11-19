const iconPaths = {
  overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><path d="M17 14v7M13.5 17.5h7" /></>,
  suppliers: <><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /><path d="M6 10h5M6 13h3" /></>,
  fruits: <><path d="M12 8c-5.8-3.1-9 1.2-8 6.5.8 4 3.5 6.5 8 6.5s7.2-2.5 8-6.5c1-5.3-2.2-9.6-8-6.5Z" /><path d="M12 8c-.2-3.5 2-5 5-5-1 3-2.4 4.5-5 5ZM12 10v9" /></>,
  stock: <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" /></>,
  vendors: <><circle cx="9" cy="8" r="3.5" /><path d="M2.8 20c.5-3.4 2.6-5.2 6.2-5.2s5.7 1.8 6.2 5.2M16 5.5a3.5 3.5 0 0 1 0 6.8M17 15c2.5.5 3.9 2.1 4.2 5" /></>,
  purchases: <><path d="M4 8.5h16v12H4zM3 4h18M12 3v11M8.5 10.5 12 14l3.5-3.5" /></>,
  sales: <><path d="M4 15.5h16v5H4zM12 17V4M8.5 7.5 12 4l3.5 3.5" /><path d="M7 12H4V8h4" /></>,
  payments: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M7 15h4M16 3H6" /></>,
  reports: <><path d="M4 20V11M10 20V5M16 20v-8M22 20H2" /><path d="m3.5 8 6-4 5 5 6-6" /></>,
}

export default function AppIcon({ name, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {iconPaths[name] ?? iconPaths.overview}
    </svg>
  )
}
