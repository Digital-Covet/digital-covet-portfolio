export interface NavLink {
  href: string;
  label: string;
  isActive?: boolean;
}

export interface Stat {
  target: number;
  label: string[];
  textColor: string;
  borderColor: string;
  colSpan: string;
  delay?: number;
  customClass?: string;
  marginTop?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  colSpan: string;
  rowSpan: string;
  delay: number;
}

export interface Feature {
  number: string;
  title: string;
  description: string;
  delay: number;
}

export interface TeamMember {
  avatar: string;
  alt: string;
  delay: number;
}
