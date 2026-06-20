// @ts-nocheck
'use client'

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { Clock, User, Globe, Zap, Star, Signal, X, BookOpen, Download, Share2, Calendar, FileText, Mail, MessageCircle, Copy, CheckCircle, ArrowLeft, Printer, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { createClient } from '@/lib/supabase/client';
import { COURSE_PUBLIC_SELECT, toEdutoCourse, edutoCategoriesFromCourses, type PublicCourseRow } from '@/lib/courses/public';

// ----------------------------------------------------------------------
// 1. Types & Global Declarations
// ----------------------------------------------------------------------
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hu-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { featured?: boolean | string }, HTMLElement>;
      'hu-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { variant?: string, disabled?: boolean | string, onClick?: any }, HTMLElement>;
      'hu-grid': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { columns?: string, gap?: string }, HTMLElement>;
      'hu-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'hu-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { value?: string, active?: boolean | string, onClick?: any, onKeyDown?: any, tabIndex?: number }, HTMLElement>;
      'hu-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { variant?: string, color?: string }, HTMLElement>;
      'hu-text': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { variant?: string, weight?: string, color?: string, size?: string, strikethrough?: boolean | string, align?: string, 'margin-bottom'?: string, 'margin-top'?: string }, HTMLElement>;
      'hu-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { id?: string, type?: string, label?: string, placeholder?: string, error?: boolean | string, onInput?: any }, HTMLElement>;
      'hu-empty': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'hu-box': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { padding?: string, 'margin-bottom'?: string, 'margin-top'?: string, 'border-bottom'?: string, 'border-top'?: string, surface?: boolean | string }, HTMLElement>;
      'hu-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'current-step'?: string }, HTMLElement>;
      'hu-drawer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { open?: boolean | string, onClose?: any }, HTMLElement>;
    }
  }
}

type Course = {
  id: string;
  title: string;
  category: string;
  duration: string;
  origPrice: number | null;
  price: number;
  rating: string;
  mentor: string;
  feature?: string;
  level: string;
  description: string;
  shortDescription: string;
  image: string;
};

type FormData = { name: string; email: string; phone: string; city: string };

type EnrollmentRecord = {
  paymentId: string;
  course: Course;
  student: FormData;
  date: string;
};

const FALLBACK_COURSES: Course[] = [
  { id: 'C01', title: 'React Masterclass', category: 'Frontend', duration: '8 Weeks', origPrice: 6000, price: 4000, rating: '5.0', mentor: 'Sarah J.', feature: 'Flash Sale', level: 'Intermediate', description: 'Master React by building scalable web applications. Learn hooks, state management, and modern component architecture.', shortDescription: 'Master React from scratch and build scalable web apps.', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80' },
  { id: 'C02', title: 'Node.js Backend', category: 'Backend', duration: '6 Weeks', origPrice: 5000, price: 3500, rating: '4.8', mentor: 'Mike R.', feature: 'Trending', level: 'Intermediate', description: 'Build robust backend architectures with Node.js and Express. Focus on REST APIs, databases, and authentication.', shortDescription: 'Build robust backend architectures with Node.js.', image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=800&q=80' },
  { id: 'C03', title: 'Kubernetes Deep Dive', category: 'DevOps', duration: '4 Weeks', origPrice: 8000, price: 5000, rating: '5.0', mentor: 'Alex W.', feature: 'New', level: 'Advanced', description: 'Master container orchestration and scaling. Learn to deploy, manage, and optimize enterprise-level clusters.', shortDescription: 'Master container orchestration and scaling.', image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80' },
  { id: 'C04', title: 'UI/UX Fundamentals', category: 'Design', duration: '5 Weeks', origPrice: null, price: 3000, rating: '4.5', mentor: 'Elena P.', level: 'Beginner', description: 'Design engaging digital products. Learn user research, wireframing, and interactive prototyping techniques.', shortDescription: 'Design engaging digital products from scratch.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80' },
  { id: 'C05', title: 'Data Science with Python', category: 'Data Science', duration: '10 Weeks', origPrice: 10000, price: 7500, rating: '5.0', mentor: 'Dr. Alan T.', level: 'Intermediate', description: 'Unlock the power of data. Learn Pandas, NumPy, and predictive modeling for real-world applications.', shortDescription: 'Unlock the power of data using Python.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
  { id: 'C06', title: 'React Native Pro', category: 'Mobile', duration: '8 Weeks', origPrice: 7000, price: 4500, rating: '4.6', mentor: 'Sarah J.', level: 'Advanced', description: 'Build cross-platform mobile apps using React Native. Master animations, native modules, and deployment.', shortDescription: 'Build cross-platform mobile apps with React Native.', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80' },
  { id: 'C07', title: 'Advanced CSS Animations', category: 'Frontend', duration: '4 Weeks', origPrice: null, price: 2500, rating: '5.0', mentor: 'Chris C.', level: 'Advanced', description: 'Create stunning visual experiences. Master keyframes, transitions, and hardware-accelerated animations.', shortDescription: 'Create stunning visual experiences with CSS.', image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=800&q=80' },
  { id: 'C08', title: 'Go Microservices', category: 'Backend', duration: '8 Weeks', origPrice: 9000, price: 6500, rating: '4.7', mentor: 'Rob P.', level: 'Intermediate', description: 'Build fast, concurrent backend services in Go. Learn gRPC, message queues, and distributed tracing.', shortDescription: 'Build fast, concurrent backend services in Go.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' },
  { id: 'C09', title: 'AWS Cloud Architect', category: 'DevOps', duration: '12 Weeks', origPrice: 12000, price: 8500, rating: '5.0', mentor: 'Jeff B.', level: 'Advanced', description: 'Design highly available cloud infrastructure. Learn EC2, S3, Lambda, and advanced networking.', shortDescription: 'Design highly available cloud infrastructure.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
  { id: 'C10', title: 'Figma for Enterprise', category: 'Design', duration: '6 Weeks', origPrice: null, price: 4000, rating: '4.8', mentor: 'Elena P.', level: 'Intermediate', description: 'Scale your design systems. Learn advanced auto-layout, variables, and cross-team collaboration.', shortDescription: 'Scale your design systems in Figma.', image: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?auto=format&fit=crop&w=800&q=80' },
  { id: 'C11', title: 'Machine Learning A-Z', category: 'Data Science', duration: '14 Weeks', origPrice: 15000, price: 9500, rating: '5.0', mentor: 'Dr. Alan T.', level: 'Advanced', description: 'Comprehensive guide to ML algorithms. Build neural networks and deploy models to production.', shortDescription: 'Comprehensive guide to ML algorithms and neural nets.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80' },
  { id: 'C12', title: 'SwiftUI Essentials', category: 'Mobile', duration: '6 Weeks', origPrice: 6000, price: 4000, rating: '4.7', mentor: 'Craig F.', level: 'Beginner', description: 'Build beautiful iOS apps using SwiftUI. Learn declarative UI, state management, and modern native design.', shortDescription: 'Build beautiful iOS apps using SwiftUI.', image: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?auto=format&fit=crop&w=800&q=80' },
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80'
];

const DEFAULT_CATEGORIES = ['All', 'Frontend', 'Backend', 'DevOps', 'Design', 'Data Science', 'Mobile'];

function EdutoCardPrice({ price, showDiscount }: { price: number; showDiscount: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginTop: '14px',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 'clamp(1.35rem, 2.2vw, 1.625rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          color: 'var(--text1, var(--text-primary, inherit))',
        }}
      >
        PKR {price.toLocaleString('en-PK')}
      </span>
      {showDiscount && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9375rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #fb7185 0%, #ef4444 45%, #dc2626 100%)',
            padding: '9px 18px',
            borderRadius: '999px',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            lineHeight: 1,
            minHeight: '38px',
          }}
        >
          30% OFF
        </span>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. Main Component
// ----------------------------------------------------------------------
export default function EdutoPage() {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modalCourse, setModalCourse] = useState<Course | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', city: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [currentPaymentId, setCurrentPaymentId] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfFallback, setPdfFallback] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>(FALLBACK_COURSES);
  const [categoryList, setCategoryList] = useState<string[]>(DEFAULT_CATEGORIES);
  const pathwayRef = useRef<HTMLDivElement>(null);

  const featuredCourses = courses.filter(c => c.feature).slice(0, 4);
  const filteredCourses = category === 'All' ? courses : courses.filter(c => c.category === category);
  
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('courses')
        .select(COURSE_PUBLIC_SELECT)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('featured_sort_order', { ascending: true })
        .order('enrolled_count', { ascending: false });
      if (cancelled || error || !data?.length) return;
      const mapped = (data as PublicCourseRow[]).map(toEdutoCourse);
      setCourses(mapped);
      setCategoryList(edutoCategoriesFromCourses(mapped));
    }
    void loadCourses();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Initialize components and theme
  useEffect(() => {
    // Define Huashu Components (only once)
    if (!customElements.get('hu-card')) {
      class HuComponent extends HTMLElement {
        constructor() { super(); this.attachShadow({ mode: 'open' }); }
        getStyles() {
          return `
            :host {
                display: block;
                --primary: var(--eduto-primary, #00b4d8);
                --bg: var(--eduto-bg, #0f172a);
                --surface: var(--eduto-surface, #1e293b);
                --text: var(--eduto-text, #f8fafc);
                --text-muted: var(--eduto-text-muted, #94a3b8);
                --border: var(--eduto-border, #334155);
                --radius: 0px;
                --font: var(--eduto-font, sans-serif);
                font-family: var(--font);
            }
            * { box-sizing: border-box; }
          `;
        }
        render(template: string) {
          if (this.shadowRoot) this.shadowRoot.innerHTML = `<style>${this.getStyles()}</style>${template}`;
        }
      }

      class HuCard extends HuComponent {
        connectedCallback() {
          const featured = this.hasAttribute('featured');
          this.render(`
            <style>
                .card {
                    background: var(--surface);
                    border: 2px solid var(--border);
                    border-radius: var(--radius);
                    padding: 24px;
                    box-shadow: 4px 4px 0 var(--border);
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, background-color 0.25s ease, border-color 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    height: 100%;
                    position: relative;
                    will-change: transform;
                }
                .card:hover {
                    transform: translate(-4px, -4px);
                    box-shadow: 8px 8px 0 var(--border);
                }
                /* Removed custom featured card styles to ensure 100% uniformity with standard cards */
            </style>
            <div class="card ${featured ? 'featured' : ''}"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-card', HuCard);

      class HuButton extends HuComponent {
        connectedCallback() {
          const variant = this.getAttribute('variant') || 'outline';
          this.render(`
            <style>
                button {
                    font-family: var(--font);
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 1px;
                    padding: 12px 24px;
                    border-radius: var(--radius);
                    cursor: pointer;
                    transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    position: relative;
                }
                .primary { background: var(--button-bg, var(--primary)); color: var(--button-text, #fff); border: 2px solid var(--button-border, var(--primary)); box-shadow: 4px 4px 0 var(--border); }
                .primary:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--border); }
                .primary:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--border); }
                .outline { 
                    background: var(--surface); 
                    color: var(--text); 
                    border: 2px solid var(--border); 
                    transform: translate(-3px, -3px);
                    box-shadow: 3px 3px 0px var(--border);
                    transition: transform 0.05s steps(2), box-shadow 0.05s steps(2);
                }
                .outline:hover { 
                    transform: translate(-1px, -1px); 
                    box-shadow: 1px 1px 0px var(--border); 
                }
                .outline:active { 
                    transform: translate(0px, 0px); 
                    box-shadow: 0px 0px 0px var(--border); 
                }
                .ghost { background: transparent; color: var(--text); border: 2px solid transparent; box-shadow: none; }
                .ghost:hover { border-color: var(--border); box-shadow: 2px 2px 0 var(--border); }
                .ghost:active { background: var(--surface); }
                button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; pointer-events: none; }
            </style>
            <button class="${variant}" ${this.hasAttribute('disabled') ? 'disabled' : ''}><slot></slot></button>
          `);
        }
      }
      customElements.define('hu-button', HuButton);

      class HuGrid extends HuComponent {
        connectedCallback() {
          const cols = this.getAttribute('columns') || 'auto';
          const gapMap: Record<string,string> = { sm: '12px', md: '24px', lg: '32px' };
          const gap = gapMap[this.getAttribute('gap') || 'md'];
          const gridTemplate = cols === 'auto' ? 'repeat(auto-fill, minmax(280px, 1fr))' : `repeat(${cols}, 1fr)`;
          this.render(`
            <style>
                .grid { display: grid; gap: ${gap}; grid-template-columns: ${gridTemplate}; align-items: stretch; }
                @media (max-width: 1024px) { 
                    .grid { grid-template-columns: ${cols === 'auto' ? 'repeat(auto-fill, minmax(280px, 1fr))' : `repeat(min(${cols}, 2), 1fr)`}; } 
                }
                @media (max-width: 600px) { 
                    .grid { grid-template-columns: 1fr; gap: 16px; } 
                }
            </style>
            <div class="grid"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-grid', HuGrid);

      class HuTabs extends HuComponent {
        connectedCallback() {
          this.render(`
            <style>
                .tabs { display: inline-flex; gap: 0; border: 2px solid var(--border); background: var(--surface); padding: 4px; overflow-x: auto; }
                .tabs::-webkit-scrollbar { display: none; }
                .tabs { -ms-overflow-style: none; scrollbar-width: none; }
            </style>
            <div class="tabs" role="tablist"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-tabs', HuTabs);

      class HuTab extends HuComponent {
        static get observedAttributes() { return ['active']; }
        attributeChangedCallback() { this.updateStyle(); }
        connectedCallback() { this.updateStyle(); }
        updateStyle() {
          const isActive = this.hasAttribute('active');
          this.render(`
            <style>
                :host { outline: none; flex-shrink: 0; }
                .tab { padding: 10px 24px; font-weight: 600; color: ${isActive ? 'var(--bg)' : 'var(--text)'}; border: 2px solid transparent; background: ${isActive ? 'var(--text)' : 'transparent'}; cursor: pointer; transition: none; white-space: nowrap; outline: none; }
                .tab:hover { background: ${isActive ? 'var(--text)' : 'var(--border)'}; color: ${isActive ? 'var(--bg)' : 'var(--text)'}; }
                .tab:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
            </style>
            <div class="tab" tabindex="0" role="tab" aria-selected="${isActive}"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-tab', HuTab);

      class HuBadge extends HuComponent {
        connectedCallback() {
          const variant = this.getAttribute('variant') || 'filled';
          const colorAttr = this.getAttribute('color') || 'primary';
          const colorMap: Record<string,string> = { primary: 'var(--primary)', red: '#ef4444', green: '#22c55e', orange: '#f97316', blue: 'var(--primary)', purple: '#a855f7' };
          const actualColor = colorMap[colorAttr] || colorAttr;
          this.render(`
            <style>
                :host { display: inline-block; width: max-content; }
                .badge { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; padding: 4px 8px; border: 2px solid var(--badge-border, ${actualColor}); background: var(--badge-bg, ${variant === 'filled' ? actualColor : 'transparent'}); color: var(--badge-text, ${variant === 'filled' ? '#fff' : actualColor}); box-shadow: 2px 2px 0 var(--badge-border, ${actualColor}); letter-spacing: 0.5px; }
            </style>
            <div class="badge"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-badge', HuBadge);

      class HuText extends HuComponent {
        connectedCallback() {
          const variant = this.getAttribute('variant') || 'body';
          const weight = this.getAttribute('weight') || 'normal';
          const color = this.getAttribute('color') || 'default';
          const size = this.getAttribute('size') || 'md';
          const strikethrough = this.hasAttribute('strikethrough');
          const align = this.getAttribute('align') || 'left';
          const marginTop = this.getAttribute('margin-top') || 'none';
          const customMarginBottom = this.getAttribute('margin-bottom');
          
          let tag = 'p'; let fontSize = '1rem'; let mb = '0.5rem';
          
          if (variant === 'h1') { tag = 'h1'; fontSize = '3.5rem'; mb = '1rem'; }
          if (variant === 'h2') { tag = 'h2'; fontSize = '2.5rem'; mb = '1rem'; }
          if (variant === 'h3') { tag = 'h3'; fontSize = '1.5rem'; mb = '0.75rem'; }
          if (variant === 'subtitle') { tag = 'p'; fontSize = '1.25rem'; }
          
          if (size === 'sm') fontSize = '0.875rem';
          if (size === 'lg') fontSize = '1.25rem';
          if (size === 'xl') fontSize = '1.5rem';
          
          let textColor = 'var(--text)';
          if (color === 'muted') textColor = 'var(--text-muted)';
          if (color === 'primary') textColor = 'var(--primary)';
          if (color === 'orange') textColor = '#f97316';
          if (color === 'green') textColor = '#22c55e';
          if (color === 'red') textColor = '#ef4444';
          
          if (customMarginBottom) {
            const mbMap: Record<string,string> = { none: '0', sm: '0.5rem', md: '1rem', lg: '2rem', xl: '3rem' };
            mb = mbMap[customMarginBottom] || mb;
          }
          let mt = '0';
          if (marginTop !== 'none') {
            const mtMap: Record<string,string> = { sm: '0.5rem', md: '1rem', lg: '2rem', xl: '3rem' };
            mt = mtMap[marginTop] || '0';
          }
          const textDecoration = strikethrough ? 'line-through' : 'none';
          const fontWeight = weight === 'bold' ? '800' : weight === 'medium' ? '500' : '600';

          this.render(`
            <style>
                .text { font-size: ${fontSize}; font-weight: ${fontWeight}; color: ${textColor}; text-decoration: ${textDecoration}; margin: ${mt} 0 ${mb} 0; text-align: ${align}; line-height: 1.3; letter-spacing: ${variant.startsWith('h') ? '-0.03em' : 'normal'}; transition: color 0.2s ease; }
                @media (max-width: 768px) {
                  h1.text { font-size: 2.5rem; }
                  h2.text { font-size: 2rem; }
                }
            </style>
            <${tag} class="text"><slot></slot></${tag}>
          `);
        }
      }
      customElements.define('hu-text', HuText);

      class HuInput extends HuComponent {
        static get observedAttributes() { return ['error']; } // Don't observe 'value' to prevent re-render loss of focus
        
        get value() {
          return this.getAttribute('value') || '';
        }
        
        set value(val) {
          this.setAttribute('value', val);
          const inputEl = this.shadowRoot?.querySelector('input');
          if (inputEl && inputEl.value !== val) {
            inputEl.value = val;
          }
        }

        attributeChangedCallback(name, oldVal, newVal) { 
          if (oldVal !== newVal) this.updateStyle(); 
        }
        
        connectedCallback() { this.updateStyle(); }
        
        updateStyle() {
          const label = this.getAttribute('label') || '';
          const type = this.getAttribute('type') || 'text';
          const placeholder = this.getAttribute('placeholder') || '';
          const id = this.getAttribute('id') || 'input-' + Math.random().toString(36).substr(2, 9);
          const hasError = this.hasAttribute('error');
          const borderColor = hasError ? '#ef4444' : 'var(--border)';
          const value = this.getAttribute('value') || '';

          const textprefix = this.getAttribute('textprefix') || '';

          this.render(`
            <style>
                .wrapper { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
                label { font-weight: 800; font-size: 0.875rem; color: var(--text); text-transform: uppercase; letter-spacing: 0.5px; }
                .input-container { 
                  display: flex; 
                  align-items: center; 
                  border: 2px solid ${borderColor}; 
                  background: var(--bg); 
                  box-shadow: 4px 4px 0 ${borderColor}; 
                  transition: all 0.2s; 
                }
                .input-container:focus-within { 
                  border-color: var(--primary); 
                  box-shadow: 6px 6px 0 var(--primary); 
                  transform: translate(-2px, -2px); 
                }
                .prefix { 
                  padding: 14px 0 14px 16px; 
                  color: var(--text); 
                  font-family: var(--font); 
                  font-size: 1rem; 
                  font-weight: 600; 
                  white-space: pre;
                  background: var(--bg);
                }
                input { 
                  padding: 14px 16px; 
                  border: none; 
                  background: transparent; 
                  color: var(--text); 
                  font-family: var(--font); 
                  font-size: 1rem; 
                  outline: none; 
                  border-radius: 0; 
                  width: 100%; 
                  flex: 1;
                }
                .error-msg { color: #ef4444; font-size: 0.875rem; display: ${hasError ? 'block' : 'none'}; font-weight: bold; margin-top: 4px; }
            </style>
            <div class="wrapper">
                ${label ? `<label for="${id}">${label}</label>` : ''}
                <div class="input-container">
                    ${textprefix ? `<div class="prefix">${textprefix}</div>` : ''}
                    <input id="${id}" type="${type}" placeholder="${placeholder}" value="${value}">
                </div>
                <div class="error-msg"><slot name="error"></slot></div>
            </div>
          `);

          const inputEl = this.shadowRoot?.querySelector('input');
          if (inputEl) {
            // Restore actual value if it got overwritten by render
            inputEl.value = this.value;
            
            inputEl.addEventListener('input', (e: any) => {
              // Only dispatch, let React handle updating the prop, but also update our internal attribute
              this.setAttribute('value', e.target.value);
              this.dispatchEvent(new Event('input', { bubbles: true }));
            });
          }
        }
      }
      customElements.define('hu-input', HuInput);

      class HuEmpty extends HuComponent {
        connectedCallback() {
          this.render(`
            <style>
                .empty { padding: 64px 24px; border: 2px dashed var(--border); text-align: center; background: var(--surface); color: var(--text-muted); font-weight: 800; font-size: 1.25rem; letter-spacing: 1px; text-transform: uppercase; }
            </style>
            <div class="empty"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-empty', HuEmpty);

      class HuBox extends HuComponent {
        connectedCallback() {
          const padMap: Record<string,string> = { sm: '16px', md: '24px', lg: '32px', xl: '48px' };
          const marginMap: Record<string,string> = { sm: '16px', md: '24px', lg: '32px', xl: '48px' };
          const padding = padMap[this.getAttribute('padding') || ''] || '0';
          const mb = marginMap[this.getAttribute('margin-bottom') || ''] || '0';
          const mt = marginMap[this.getAttribute('margin-top') || ''] || '0';
          const bb = this.getAttribute('border-bottom');
          const bt = this.getAttribute('border-top');
          
          let borderBottom = 'none';
          if (bb === 'heavy') borderBottom = '4px solid var(--border)';
          if (bb === 'solid') borderBottom = '2px solid var(--border)';
          let borderTop = 'none';
          if (bt === 'heavy') borderTop = '4px solid var(--border)';
          if (bt === 'solid') borderTop = '2px solid var(--border)';

          this.render(`
            <style>
                :host { display: block; }
                .box { padding: ${padding}; margin-bottom: ${mb}; margin-top: ${mt}; border-bottom: ${borderBottom}; border-top: ${borderTop}; background: ${this.hasAttribute('surface') ? 'var(--surface)' : 'transparent'}; }
            </style>
            <div class="box"><slot></slot></div>
          `);
        }
      }
      customElements.define('hu-box', HuBox);

      class HuProgress extends HuComponent {
        static get observedAttributes() { return ['current-step']; }
        attributeChangedCallback() { this.updateStyle(); }
        connectedCallback() { this.updateStyle(); }
        updateStyle() {
          const step = parseInt(this.getAttribute('current-step') || '1', 10);
          this.render(`
            <style>
                .progress { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; position: relative; padding: 0 16px; }
                .progress::before { content: ''; position: absolute; top: 50%; left: 16px; right: 16px; height: 4px; background: var(--border); z-index: 0; transform: translateY(-50%); }
                .step { position: relative; z-index: 1; width: 48px; height: 48px; border-radius: 0; background: var(--surface); border: 4px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--text-muted); transition: all 0.3s; font-size: 1.25rem; }
                .step.active { border-color: var(--primary); background: var(--primary); color: #fff; box-shadow: 4px 4px 0 var(--border); transform: scale(1.1) rotate(-5deg); }
                .step.done { border-color: var(--primary); color: var(--primary); }
            </style>
            <div class="progress">
                <div class="step ${step >= 1 ? (step === 1 ? 'active' : 'done') : ''}">1</div>
                <div class="step ${step >= 2 ? (step === 2 ? 'active' : 'done') : ''}">2</div>
                <div class="step ${step >= 3 ? (step === 3 ? 'active' : 'done') : ''}">3</div>
            </div>
          `);
        }
      }
      customElements.define('hu-progress', HuProgress);

      class HuDrawer extends HuComponent {
        static get observedAttributes() { return ['open']; }
        attributeChangedCallback() { this.updateStyle(); }
        connectedCallback() { this.updateStyle(); }
        updateStyle() {
          const isOpen = this.hasAttribute('open');
          this.render(`
            <style>
                .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999; opacity: ${isOpen ? '1' : '0'}; visibility: ${isOpen ? 'visible' : 'hidden'}; transition: all 0.3s; }
                .drawer { position: fixed; top: 0; right: ${isOpen ? '0' : '-450px'}; width: 400px; max-width: 100vw; height: 100vh; background: var(--bg); border-left: 4px solid var(--primary); box-shadow: -8px 0 0 var(--border); z-index: 1000; transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1); padding: 32px 24px; overflow-y: auto; }
                .close-btn { position: absolute; top: 24px; right: 24px; background: transparent; border: 2px solid var(--border); color: var(--text); width: 40px; height: 40px; cursor: pointer; font-weight: bold; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .close-btn:hover { background: var(--surface); box-shadow: 4px 4px 0 var(--border); transform: translate(-2px, -2px); }
                .close-btn:active { box-shadow: 0 0 0 var(--border); transform: translate(2px, 2px); }
            </style>
            <div class="overlay" id="overlay"></div>
            <div class="drawer">
                <button class="close-btn" id="close">✕</button>
                <slot></slot>
            </div>
          `);
          this.shadowRoot?.getElementById('overlay')?.addEventListener('click', () => {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
          });
          this.shadowRoot?.getElementById('close')?.addEventListener('click', () => {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
          });
        }
      }
      customElements.define('hu-drawer', HuDrawer);
    }

    // Handle Theme injection
    function updateEdutoTheme() {
      const rootStyle = getComputedStyle(document.body);
      const primaryColor = rootStyle.getPropertyValue('--blue').trim() || '#00b4d8';
      const bgColor = rootStyle.getPropertyValue('--bg').trim() || '#0f172a';
      const surfaceColor = rootStyle.getPropertyValue('--card-glass').trim() || '#1e293b';
      const textPrimary = rootStyle.getPropertyValue('--text1').trim() || '#f8fafc';
      const isDark = document.documentElement.classList.contains('dark') || document.body.getAttribute('data-theme') === 'dark';
      
      const textMuted = isDark ? '#cbd5e1' : '#475569';
      const surfaceHoverColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
      const borderColor = rootStyle.getPropertyValue('--border').trim() || '#334155';
      const fontFamily = rootStyle.getPropertyValue('--font-poppins').trim() || "'Inter', sans-serif";

      let styleEl = document.getElementById('eduto-theme-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'eduto-theme-styles';
        document.head.appendChild(styleEl);
      }
      
      
      styleEl.textContent = `
        #eduto-root {
            --eduto-primary: ${primaryColor};
            --eduto-bg: ${bgColor};
            --eduto-surface: ${surfaceColor};
            --eduto-surface-hover: ${surfaceHoverColor};
            --eduto-text: ${textPrimary};
            --eduto-text-muted: ${textMuted};
            --eduto-border: ${borderColor};
            --eduto-font: ${fontFamily};
            background-color: var(--eduto-bg);
            color: var(--eduto-text);
            font-family: var(--eduto-font);
            min-height: 100vh;
            padding: 24px;
            position: relative;
            overflow-x: hidden;
        }
        @media (max-width: 600px) {
            #eduto-root { padding: 12px; }
        }
        #eduto-root * { box-sizing: border-box; }
        
        @keyframes bounce-scale {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-scale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .slide-down-enter {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.5s ease-out, opacity 0.5s ease-out;
        }
        .slide-down-enter-active {
          max-height: 1500px;
          opacity: 1;
        }
        .fade-enter {
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .fade-enter-active {
          opacity: 1;
        }

        .eduto-card-desc-wrapper {
          height: 40px; /* Reserves exactly enough space for 2 lines */
          position: relative;
          z-index: 5;
        }
        .eduto-card-desc {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Removed white text forcing so cards adapt to light/dark themes */
        
        .featured-hover-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--eduto-primary);
          opacity: 0;
          z-index: 1;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }

        @media (min-width: 769px) {
          .eduto-card {
            transition: background-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
          }
          .eduto-card:hover {
            --eduto-surface: var(--eduto-primary);
            --eduto-text: #ffffff;
            --eduto-text-muted: rgba(255, 255, 255, 0.9);
            --button-bg: #ffffff;
            --button-text: var(--eduto-primary);
            --button-border: #ffffff;
            --badge-bg: #ffffff;
            --badge-text: var(--eduto-primary);
            --badge-border: #ffffff;
          }
          .eduto-card:hover .eduto-card-desc {
            -webkit-line-clamp: unset;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            background-color: var(--eduto-primary);
            padding-bottom: 8px; /* Breathing room */
            z-index: 10;
          }
          
          /* For featured cards, the background is an image. 
             Instead of making the description dark, we show the blue overlay over the whole card! */
          hu-card[featured]:hover .featured-hover-overlay {
            opacity: 1; /* Fully opaque blue effect to prioritize the hover animation */
          }
          hu-card[featured]:hover .eduto-card-desc {
            background-color: transparent; /* Overlay handles the blue background */
          }
          
          .eduto-card-fade-out {
            transition: opacity 0.25s ease;
            opacity: 1;
          }
          .eduto-card:hover .eduto-card-fade-out {
            opacity: 0;
            pointer-events: none;
          }
        }
        @media (max-width: 768px) {
          #eduto-root {
            padding: 16px 12px;
            width: 100vw;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          /* Single Column Grids */
          #eduto-root hu-grid,
          #eduto-root hu-grid[columns="4"],
          #eduto-root hu-grid[columns="2"],
          #eduto-root hu-grid[columns="3"] {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          #eduto-root hu-grid > * {
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Card layout overrides */
          .eduto-card-desc-wrapper { height: auto !important; }
          .eduto-card-desc { -webkit-line-clamp: unset !important; }
          .eduto-card:hover { transform: none !important; box-shadow: none !important; }
          .featured-hover-overlay { display: none !important; }
          .eduto-card-fade-out { opacity: 1 !important; pointer-events: auto !important; }

          /* Form & Buttons */
          .eduto-form-row {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .eduto-form-row > * {
            width: 100% !important;
          }
          #eduto-root hu-button {
            width: 100% !important;
          }
          .eduto-action-buttons {
            display: flex !important;
            flex-direction: column-reverse !important; /* Stack with primary action on top */
            gap: 16px !important;
            width: 100% !important;
            align-items: stretch !important;
          }
          .eduto-action-buttons button {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px !important;
          }
          
          /* History Panel Fullscreen Overlay */
          .history-panel-container.open {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
            z-index: 9999 !important;
            max-height: 100vh !important;
            margin: 0 !important; padding: 0 !important;
            overflow-y: auto !important;
            background: var(--eduto-surface) !important;
          }
          .history-panel-container:not(.open) {
            display: none !important;
          }
          .history-panel-inner {
            min-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
            padding: 24px 16px !important;
            background: var(--eduto-surface) !important;
          }
          .history-card { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .history-actions { width: 100% !important; flex-wrap: wrap !important; }
          .history-actions > button { flex: 1 !important; justify-content: center !important; }

          /* Category Tabs Mobile Dropdown */
          .eduto-desktop-categories {
            display: none !important;
          }
          .eduto-mobile-categories {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            position: relative !important;
          }
          .eduto-category-tabs-container {
            justify-content: center !important;
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
            overflow-x: visible !important;
            width: 100% !important;
          }

          /* Pagination Wrapping & Sizing */
          .eduto-pagination-container {
            flex-wrap: wrap !important;
            gap: 12px !important;
            justify-content: center !important;
          }
          .eduto-pagination-container hu-button {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 100px !important;
          }
          .eduto-pagination-container button {
            width: 44px !important;
            height: 44px !important;
            flex-shrink: 0 !important;
          }
        }
      `;
    }

    updateEdutoTheme();
    const observer = new MutationObserver(() => updateEdutoTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', updateEdutoTheme);

    try {
      const raw = localStorage.getItem('eduto_enrollments');
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        // keep only those within 7 days, and sort descending
        const valid = parsed
          .filter((e: any) => e.timestamp && (now - e.timestamp) <= 7 * 24 * 60 * 60 * 1000)
          .sort((a: any, b: any) => b.timestamp - a.timestamp);
        
        setEnrollments(valid);
        if (valid.length !== parsed.length) {
          localStorage.setItem('eduto_enrollments', JSON.stringify(valid));
        }
      }
    } catch {}

    setMounted(true);
    return () => {
      observer.disconnect();
      mq.removeEventListener('change', updateEdutoTheme);
    };
  }, []);

  useEffect(() => {
    if (selectedCourse && pathwayRef.current) {
      setTimeout(() => {
        pathwayRef.current?.classList.add('slide-down-enter-active');
        pathwayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 10);
    }
  }, [selectedCourse]);

  if (!mounted) return null;

  // Enrollment Logic
  const handleEnrollClick = (course: Course) => {
    setModalCourse(course);
  };

  const proceedToEnrollment = (course: Course) => {
    setModalCourse(null);
    setSelectedCourse(course);
    setStep(1);
    setFormData({ name: '', email: '', phone: '', city: '' });
    setErrors({});
  };

  const submitForm = () => {
    const errs: Record<string, string> = {};
    const name = formData.name || '';
    const email = formData.email || '';
    const phone = formData.phone || '';
    const city = formData.city || '';

    if (!name.trim()) errs.name = 'Name is required';
    
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email format';
    }
    
    if (!phone.trim()) {
      errs.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      errs.phone = 'Phone must be 10 digits';
    }
    
    if (!city.trim()) errs.city = 'City is required';
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    const paymentId = `EDU-${Date.now()}-${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase()}`;
    setCurrentPaymentId(paymentId);
    
    const enr = {
      paymentId,
      course: selectedCourse!,
      student: formData,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    const next = [...enrollments, enr];
    setEnrollments(next);
    try {
      localStorage.setItem('eduto_enrollments', JSON.stringify(next));
    } catch {
      console.warn("localStorage full or unavailable. In-memory array used.");
    }
    setStep(3);
  };

  const generatePDF = async (enrollment: EnrollmentRecord) => {
    setPdfBusy(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const W = 210;
      const dateStr = new Date(enrollment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

      // Load SVG Logo robustly using exact known bounds so it doesn't crop in canvas
      let logoData: string | null = null;
      let logoWidth = 0;
      let logoHeight = 0;
      
      // We will render it with a width of 45mm (large, not extra large)
      const TARGET_LOGO_W = 45; 
      
      try {
        logoData = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          // Force explicit dimensions matching the new pre-cropped viewBox
          img.width = 1500;
          img.height = 382;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const svgW = 1500;
            const svgH = 382;
            
            const scale = 3;
            canvas.width = svgW * scale;
            canvas.height = svgH * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas context null')); return; }
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw image fully as it's already cropped
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const aspect = svgW / svgH;
            logoWidth = TARGET_LOGO_W;
            logoHeight = logoWidth / aspect;
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = '/icons/eduto-logo-light-cropped.svg';
        });
      } catch (err) {
        console.warn('Logo capture failed, using text fallback.', err);
      }

      let y = 15;

      // Header — logo top-left
      if (logoData) {
        doc.addImage(logoData, 'PNG', 20, y, logoWidth, logoHeight);
        y += logoHeight + 8; // Adjust spacing below the larger logo
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(26, 26, 26);
        doc.text('EDUTO \u2014 Institute of Codemo Teams', 20, y + 5);
        y += 14;
      }

      // Divider
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, y, W - 20, y);
      y += 8;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ENROLLMENT INVOICE', 20, y);
      y += 8;

      // Course details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Course: ${enrollment.course.title}`, 20, y); y += 6;
      doc.text(`Duration: ${enrollment.course.duration}`, 20, y); y += 6;
      doc.text(`Fee: PKR ${enrollment.course.price}`, 20, y); y += 6;
      doc.text(`Mentor: ${enrollment.course.mentor}`, 20, y); y += 8;

      // Divider
      doc.setLineWidth(0.2);
      doc.line(20, y, W - 20, y);
      y += 8;

      // Student details
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT DETAILS', 20, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${enrollment.student.name}`, 20, y); y += 6;
      doc.text(`Email: ${enrollment.student.email}`, 20, y); y += 6;
      doc.text(`Phone: +92 ${enrollment.student.phone}`, 20, y); y += 6;
      doc.text(`City: ${enrollment.student.city}`, 20, y); y += 8;

      // Divider
      doc.line(20, y, W - 20, y);
      y += 8;

      // Payment ID Box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(20, y, W - 40, 24);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('PAYMENT ID:', 25, y + 8);
      
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text(enrollment.paymentId, 25, y + 18);
      y += 34;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Date: ${dateStr}`, 20, y);
      y += 8;

      // Divider
      doc.line(20, y, W - 20, y);
      y += 8;

      // Footer Instructions
      doc.setFont('helvetica', 'bold');
      doc.text('To reserve your seat:', 20, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('1. Share this PDF on WhatsApp at +92-327-7631920', 25, y); y += 6;
      doc.text('2. Our team will confirm via WhatsApp with payment details', 25, y); y += 10;

      doc.text('feedback@codemoteams.org', 20, y);

      const courseName = enrollment.course.title.replace(/[^a-zA-Z0-9]/g, '-');
      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`Eduto-Enrollment-${courseName}-${fileDate}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
      setPdfFallback(true);
    } finally {
      setPdfBusy(false);
    }
  };

  const copyId = async (id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(id);
      } else {
        const ta = document.createElement('textarea');
        ta.value = id;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy your Payment ID:', id);
    }
  };

  const shareWA = (id: string, courseName: string, studentName: string) => {
    const text = `Hello Eduto Team, I am enrolling in ${courseName}. My Payment ID: ${id}. Name: ${studentName}. Please reserve my seat and confirm. I will share the enrollment PDF separately.`;
    window.open(`https://wa.me/923277631920?text=${encodeURIComponent(text)}`, '_blank');
  };

  const deleteEnrollment = (id: string) => {
    const next = enrollments.filter(e => e.paymentId !== id);
    setEnrollments(next);
    localStorage.setItem('eduto_enrollments', JSON.stringify(next));
  };

  const handleTabKey = (e: any, cat: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setCategory(cat);
    }
  };

  return (
    <>
      <div id="eduto-root">
        {/* OLD DRAWER REMOVED */}

        {/* HERO SECTION */}
        {!selectedCourse && (
          <hu-box border-bottom="heavy" margin-bottom="lg" style={{ marginTop: 40, position: 'relative', overflow: 'hidden' }}>
          {/* SLIDER BACKGROUNDS (Mocked for admin panel dynamic integration) */}
          {HERO_IMAGES.map((img, idx) => (
            <div 
              key={idx}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url('${img}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: currentSlide === idx ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: 0
              }}
            />
          ))}
          {/* BLACK FADE OVERLAY */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)',
            zIndex: 1
          }} />

          {/* ENROLLMENTS BUTTON (Only shows if connected & data fetched > 0) */}
          {enrollments.length > 0 && (
            <button 
              style={{ 
                position: 'absolute', 
                top: '24px', 
                right: '24px', 
                zIndex: 10,
                background: 'var(--eduto-surface, #1e293b)',
                border: '2px solid var(--eduto-border, #334155)',
                boxShadow: '4px 4px 0 var(--eduto-border, #334155)',
                color: 'var(--eduto-text, #f8fafc)',
                padding: '8px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translate(4px, 4px)';
                e.currentTarget.style.boxShadow = '0px 0px 0 var(--eduto-border, #334155)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '4px 4px 0 var(--eduto-border, #334155)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '4px 4px 0 var(--eduto-border, #334155)';
              }}
              onClick={() => setDrawerOpen(!drawerOpen)}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <BookOpen size={24} strokeWidth={1.5} />
                <span style={{ 
                  position: 'absolute', 
                  top: '-6px', 
                  right: '-10px', 
                  background: '#ef4444', 
                  color: '#fff', 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid var(--eduto-surface, #1e293b)'
                }}>
                  {enrollments.length}
                </span>
              </div>
              <span style={{ fontWeight: 'normal', fontSize: '12px', letterSpacing: '0.5px' }}>History</span>
            </button>
          )}

          {/* CONTENT */}
          <div style={{ position: 'relative', zIndex: 2, padding: '80px 48px' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-0.03em', margin: 0 }}>
              Learn Real-World Skills.<br/>Online. Professional.
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#cbd5e1', margin: 0, marginTop: '16px' }}>
              Join 5,000+ learners at Eduto Institute.
            </p>
          </div>
        </hu-box>
        )}

        {/* CATEGORY TABS */}
        {!selectedCourse && (
        <hu-box margin-bottom="lg" margin-top="lg">
          <div className="eduto-category-tabs-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative' }}>
            
            {/* Desktop Categories */}
            <div className="eduto-desktop-categories" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
              <hu-tabs>
                {categoryList.map(cat => (
                  <hu-tab 
                    key={cat} 
                    active={category === cat ? true : undefined}
                    onClick={() => { setCategory(cat); setCurrentPage(1); }}
                    onKeyDown={(e: any) => handleTabKey(e, cat)}
                  >
                    {cat}
                  </hu-tab>
                ))}
              </hu-tabs>
            </div>

            {/* Mobile Categories Dropdown */}
            <div className="eduto-mobile-categories" style={{ display: 'none', width: '100%' }}>
              <hu-tabs>
                <hu-tab 
                  active={category === 'All' ? true : undefined}
                  onClick={() => { setCategory('All'); setCurrentPage(1); setMobileCatOpen(false); }}
                >
                  All
                </hu-tab>
                <hu-tab 
                  active={category !== 'All' ? true : undefined}
                  onClick={() => setMobileCatOpen(!mobileCatOpen)}
                >
                  {category !== 'All' ? category : 'Categories'}
                </hu-tab>
              </hu-tabs>

              {mobileCatOpen && (
                <>
                  {/* Invisible Backdrop to close dropdown on outside tap */}
                  <div 
                    onClick={() => setMobileCatOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 19 }}
                  />
                  <div className="animate-bounce-in" style={{
                    width: '100%',
                    maxWidth: '320px',
                    marginTop: '8px',
                    background: 'var(--eduto-surface)',
                    border: '1px solid var(--eduto-border)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 20,
                    boxShadow: 'var(--eduto-shadow-sm, 0 4px 12px rgba(0,0,0,0.1))'
                  }}>
                    {categoryList.filter(c => c !== 'All').map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setCurrentPage(1);
                          setMobileCatOpen(false);
                        }}
                        style={{
                          background: category === cat ? 'var(--eduto-primary)' : 'transparent',
                          color: category === cat ? '#fff' : 'var(--eduto-text)',
                          border: 'none',
                          padding: '14px 20px',
                          borderRadius: '10px',
                          textAlign: 'center',
                          fontWeight: category === cat ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '15px',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </hu-box>
        )}

        {/* INLINE HISTORY PANEL */}
        {!selectedCourse && (
          <div className={`history-panel-container ${drawerOpen ? 'open' : ''}`} style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            overflow: 'hidden',
            maxHeight: drawerOpen ? '2000px' : '0px',
            opacity: drawerOpen ? 1 : 0,
            transition: 'max-height 0.5s ease-in-out, opacity 0.3s ease-in-out, margin 0.3s',
            marginBottom: drawerOpen ? '48px' : '0px'
          }}>
            <div className="history-panel-inner" style={{
              background: 'var(--eduto-surface)',
              border: '2px solid var(--eduto-border)',
              padding: '24px',
              position: 'relative',
              borderRadius: '8px'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={24} color="var(--eduto-primary)" />
                  <hu-text variant="h3" weight="bold" margin-bottom="none" style={{ margin: 0 }}>History</hu-text>
                </div>
                <button 
                  className="mobile-close-btn"
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--eduto-text-muted)', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={24} />
                </button>
              </div>

              {enrollments.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6 }}>
                  <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <hu-text>No recent enrollments. Enroll in a course to see your history here.</hu-text>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {enrollments.map(enr => (
                    <div className="history-card" key={enr.paymentId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      border: '1px solid var(--eduto-border)',
                      background: 'var(--eduto-bg)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <hu-text weight="bold" margin-bottom="none">{enr.course.title}</hu-text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--eduto-text-muted)' }}>
                            <Calendar size={14} /> {new Date(enr.date).toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--eduto-text-muted)', fontFamily: 'monospace' }}>
                            <FileText size={14} /> {enr.paymentId}
                          </span>
                        </div>
                      </div>

                      <div className="history-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => generatePDF(enr)}
                          style={{ background: 'var(--eduto-surface)', border: '1px solid var(--eduto-border)', color: 'var(--eduto-text)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Download size={14} /> PDF
                        </button>
                        <button 
                          onClick={() => shareWA(enr.paymentId, enr.course.title, enr.student.name)}
                          style={{ background: 'var(--eduto-primary)', border: '1px solid var(--eduto-primary)', color: '#fff', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Share2 size={14} /> Share
                        </button>
                        <button 
                          onClick={() => deleteEnrollment(enr.paymentId)}
                          title="Remove from history"
                          style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEATURED GRID — Horizontal split layout, visually unique */}
        {!selectedCourse && category === 'All' && (
          <hu-box margin-bottom="xl" className="fade-enter fade-enter-active">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <hu-text variant="h2" weight="bold" margin-bottom="none">Featured</hu-text>
              <hu-badge color="primary" variant="filled">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} fill="currentColor" /> Top Picks</span>
              </hu-badge>
            </div>
            <hu-grid columns="4" gap="md">
              {featuredCourses.map(course => (
                <hu-card featured key={course.id} className="eduto-card" style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Course Background Image with Dark Overlay */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url(${course.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    zIndex: 0
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'var(--eduto-surface)',
                    opacity: 0.96,
                    zIndex: 1
                  }} />
                  <div className="featured-hover-overlay" />
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
                  {/* Feature Badge - Top */}
                  {course.feature ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <hu-badge color="primary" variant="filled">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {course.feature === 'Flash Sale' && <Zap size={12} />}
                          {course.feature === 'Trending' && <Star size={12} />}
                          {course.feature}
                        </span>
                      </hu-badge>
                    </div>
                  ) : null}

                  {/* Title */}
                  <hu-text variant="h3" weight="bold" margin-bottom="none" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</hu-text>

                  {/* Description - Expands on hover */}
                  <div className="eduto-card-desc-wrapper">
                    <hu-text color="muted" size="sm" margin-bottom="none" className="eduto-card-desc">{course.description}</hu-text>
                  </div>

                  <div className="eduto-card-fade-out">
                    {/* Meta Row */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <hu-text color="muted" size="sm" margin-bottom="none">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {course.duration}</span>
                      </hu-text>
                      <hu-text color="muted" size="sm" margin-bottom="none">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={14} fill="currentColor" /> {course.rating}</span>
                      </hu-text>
                      <hu-text color="muted" size="sm" margin-bottom="none">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {course.mentor}</span>
                      </hu-text>
                    </div>

                    {/* Price */}
                    <EdutoCardPrice price={course.price} showDiscount={!!course.origPrice} />
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop: 'auto', paddingTop: '8px' }} className="eduto-card-cta">
                    <hu-button variant="primary" onClick={() => handleEnrollClick(course)}>Enroll Now</hu-button>
                  </div>
                  </div>{/* end z-2 wrapper */}
                </hu-card>
              ))}
            </hu-grid>
          </hu-box>
        )}

        {/* COURSE LIBRARY GRID */}
        {!selectedCourse && (
          <hu-box margin-bottom="xl" className="fade-enter fade-enter-active">
            <hu-text variant="h2" weight="bold" margin-bottom="md">Course Library</hu-text>
            {filteredCourses.length === 0 ? (
              <hu-empty>No courses in this category.</hu-empty>
            ) : (
              <>
                <hu-grid columns="4" gap="md">
                  {paginatedCourses.map(course => (
                    <hu-card key={course.id} className="eduto-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Title - 1 line max */}
                    <hu-text variant="h3" weight="bold" margin-bottom="none" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{course.title}</hu-text>

                    {/* Description - Expands on hover */}
                    <div className="eduto-card-desc-wrapper">
                      <hu-text color="muted" size="sm" margin-bottom="none" className="eduto-card-desc">{course.description}</hu-text>
                    </div>

                    <div className="eduto-card-fade-out">
                      {/* Meta Row */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <hu-text color="muted" size="sm" margin-bottom="none">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {course.duration}</span>
                        </hu-text>
                        <hu-text color="muted" size="sm" margin-bottom="none">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={14} fill="currentColor" /> {course.rating}</span>
                        </hu-text>
                        <hu-text color="muted" size="sm" margin-bottom="none">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {course.mentor}</span>
                        </hu-text>
                      </div>

                      {/* Price */}
                      <EdutoCardPrice price={course.price} showDiscount={!!course.origPrice} />
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: 'auto', paddingTop: '8px' }} className="eduto-card-cta">
                      <hu-button variant="primary" onClick={() => handleEnrollClick(course)}>Enroll Now</hu-button>
                    </div>
                  </hu-card>
                ))}
                </hu-grid>
                
                {totalPages > 1 && (
                  <div className="eduto-pagination-container" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                    <hu-button 
                      variant={currentPage === 1 ? 'outline' : 'primary'} 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{ width: 'auto', padding: '12px 16px' }}
                    >
                      Prev
                    </hu-button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          background: currentPage === pageNum ? 'var(--eduto-primary)' : 'var(--eduto-surface)',
                          color: currentPage === pageNum ? '#ffffff' : 'var(--eduto-text)',
                          border: '2px solid',
                          borderColor: currentPage === pageNum ? 'var(--eduto-primary)' : 'var(--eduto-border)',
                          fontWeight: 'bold',
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: currentPage === pageNum ? '4px 4px 0 var(--eduto-border)' : 'none',
                          transform: currentPage === pageNum ? 'translate(-2px, -2px)' : 'none'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <hu-button 
                      variant={currentPage === totalPages ? 'outline' : 'primary'} 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      style={{ width: 'auto', padding: '12px 16px' }}
                    >
                      Next
                    </hu-button>
                  </div>
                )}
              </>
            )}
          </hu-box>
        )}

        {/* ENROLLMENT PATHWAY */}
        {selectedCourse && (
          <div ref={pathwayRef} className="slide-down-enter" style={{ maxWidth: '900px', margin: '40px auto 0 auto', width: '100%' }}>
            <hu-box style={{ width: '100%' }} margin-bottom="xl">
              <hu-progress current-step={step.toString()}></hu-progress>
              
              <div className="fade-enter fade-enter-active" key={`step-${step}`}>
                {step === 1 && (
                  <hu-card style={{ overflow: 'hidden', position: 'relative' }}>
                    {/* Entire Card Background Image */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundImage: `url(${selectedCourse.image})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      zIndex: 0
                    }} />
                    {/* Adapting Theme Overlay */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'var(--eduto-surface)',
                      opacity: 0.96,
                      zIndex: 1
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ marginBottom: '24px' }}>
                        <hu-text variant="h2" weight="bold" margin-bottom="none">{selectedCourse.title}</hu-text>
                        <hu-text size="sm" color="muted" margin-bottom="none" style={{ marginTop: '4px' }}>{selectedCourse.shortDescription}</hu-text>
                      </div>
                    <hu-box padding="md" margin-bottom="md" surface>
                      <hu-grid columns="2" gap="sm">
                        <div>
                          <hu-text color="muted" size="sm">Course</hu-text>
                          <hu-text weight="bold">{selectedCourse.title}</hu-text>
                          <hu-text color="muted" size="sm" margin-top="sm">Language</hu-text>
                          <hu-text weight="bold">Urdu</hu-text>
                        </div>
                        <div>
                          <hu-text color="muted" size="sm">Duration</hu-text>
                          <hu-text weight="bold">{selectedCourse.duration}</hu-text>
                          <hu-text color="muted" size="sm" margin-top="sm">Instructor</hu-text>
                          <hu-text weight="bold">{selectedCourse.mentor}</hu-text>
                        </div>
                      </hu-grid>
                    </hu-box>
                    
                    <hu-box padding="md" margin-bottom="md" surface>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <hu-text>Course Fee</hu-text>
                        <hu-text>PKR {selectedCourse.origPrice || selectedCourse.price}</hu-text>
                      </div>
                      {selectedCourse.origPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <hu-text color="green">Discount</hu-text>
                          <hu-text color="green">- PKR {selectedCourse.origPrice - selectedCourse.price}</hu-text>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed var(--border)' }}>
                        <hu-text weight="bold">Total Payable</hu-text>
                        <hu-text weight="bold" size="lg">PKR {selectedCourse.price}</hu-text>
                      </div>
                    </hu-box>
                    
                    <div className="eduto-action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 8 }}>
                      <hu-button variant="ghost" style={{ width: 'auto' }} onClick={() => setSelectedCourse(null)}>Cancel</hu-button>
                      <hu-button variant="primary" style={{ width: 'auto' }} onClick={() => setStep(2)}>Next: Details</hu-button>
                    </div>
                    </div> {/* End relative zIndex 2 wrapper */}
                  </hu-card>
                )}

                {step === 2 && (
                  <hu-card>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <hu-text variant="h2" weight="bold">Student Details</hu-text>
                      <hu-text color="muted" size="sm">Please provide your personal information for enrollment.</hu-text>
                    </div>

                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                      <div className="eduto-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <hu-input label="Full Name *" placeholder="Ahmed Khan" value={formData.name} onInput={(e: any) => setFormData({...formData, name: e.target.value})} error={errors.name ? true : undefined}>
                          {errors.name && <span slot="error">{errors.name}</span>}
                        </hu-input>
                        <hu-input type="tel" label="Phone *" placeholder="300 1234567" textprefix="+92 " value={formData.phone} onInput={(e: any) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({...formData, phone: val});
                        }} error={errors.phone ? true : undefined}>
                          {errors.phone && <span slot="error">{errors.phone}</span>}
                        </hu-input>
                      </div>
                      
                      <hu-input type="email" label="Email *" placeholder="you@email.com" value={formData.email} onInput={(e: any) => setFormData({...formData, email: e.target.value})} error={errors.email ? true : undefined}>
                        {errors.email && <span slot="error">{errors.email}</span>}
                      </hu-input>
                      
                      <hu-input label="City *" placeholder="Karachi" value={formData.city} onInput={(e: any) => setFormData({...formData, city: e.target.value})} error={errors.city ? true : undefined}>
                        {errors.city && <span slot="error">{errors.city}</span>}
                      </hu-input>

                      <div className="eduto-action-buttons" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--eduto-border)' }}>
                        <button
                          onClick={() => setStep(1)}
                          style={{
                            background: 'transparent', border: 'none', color: 'var(--eduto-text)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer', padding: 0
                          }}
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                        <hu-button variant="primary" style={{ width: 'auto' }} onClick={submitForm}>Submit & Generate Enrollment</hu-button>
                      </div>
                    </div>
                  </hu-card>
                )}

                {step === 3 && (
                  <hu-card style={{ padding: '40px 20px' }}>
                    {/* Animated Check Header */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <style>{`
                        @keyframes scaleInCheck {
                          0% { transform: scale(0); opacity: 0; }
                          60% { transform: scale(1.15); opacity: 1; }
                          100% { transform: scale(1); opacity: 1; }
                        }
                      `}</style>
                      <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto',
                        animation: 'scaleInCheck 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                      }}>
                        <CheckCircle size={40} color="#22c55e" strokeWidth={2.5} />
                      </div>
                      <hu-text variant="h2" weight="bold" align="center" margin-bottom="sm">Enrollment Generated!</hu-text>
                      <hu-text color="muted" size="md" align="center">Your details have been securely saved.</hu-text>
                    </div>

                    <div style={{ maxWidth: '460px', margin: '0 auto' }}>
                      {/* Modern Payment ID Box */}
                      <div style={{
                        border: '1px dashed var(--eduto-border)',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        marginBottom: '32px',
                        background: 'var(--eduto-surface)'
                      }}>
                        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--eduto-text-muted)', display: 'block', marginBottom: '12px', fontWeight: 600 }}>Your Payment ID</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: 'var(--eduto-primary)', letterSpacing: '2px', wordBreak: 'break-all' }}>{currentPaymentId}</span>
                          <button
                            onClick={() => copyId(currentPaymentId)}
                            title="Copy ID"
                            style={{
                              background: copied ? '#22c55e' : 'var(--eduto-bg)', border: copied ? '1px solid #22c55e' : '1px solid var(--eduto-border)',
                              color: copied ? '#fff' : 'var(--eduto-text)', width: '40px', height: '40px', borderRadius: '8px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                        <hu-button
                          variant="primary"
                          onClick={() => shareWA(currentPaymentId, selectedCourse!.title, formData.name || '')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            Proceed to Payment <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                          </div>
                        </hu-button>

                        {!pdfFallback ? (
                          <hu-button
                            variant="outline"
                            onClick={() => {
                              const rec = enrollments.find(e => e.paymentId === currentPaymentId);
                              if (rec) generatePDF(rec);
                            }}
                            disabled={pdfBusy}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <Download size={18} /> {pdfBusy ? 'Generating...' : 'Download PDF Receipt'}
                            </div>
                          </hu-button>
                        ) : (
                          <hu-button
                            variant="outline"
                            onClick={() => window.print()}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <Printer size={18} /> Print Receipt
                            </div>
                          </hu-button>
                        )}
                      </div>

                      {/* Back to courses */}
                      <div style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => { setSelectedCourse(null); setStep(1); setPdfFallback(false); setCopied(false); }}
                          style={{
                            background: 'transparent', border: 'none', color: 'var(--eduto-text-muted)',
                            padding: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '8px'
                          }}
                        >
                          <ArrowLeft size={16} /> Enroll in Another Course
                        </button>
                      </div>
                    </div>
                  </hu-card>
                )}
              </div>
            </hu-box>
          </div>
        )}

        {/* FOOTER */}
        <hu-box border-top="solid" padding="xl" style={{ marginTop: 64, backgroundColor: 'var(--eduto-surface)' }}>
          <div className="footer-container" style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '48px',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px 0',
            color: 'var(--eduto-text-muted)'
          }}>
            {/* WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MessageCircle size={24} strokeWidth={1.5} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>WhatsApp</span>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--eduto-text)' }}>+92 327 7631920</span>
              </div>
            </div>
            
            <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--eduto-border)' }} className="footer-divider" />

            {/* Official Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={24} strokeWidth={1.5} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Official Eduto Email</span>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--eduto-text)' }}>eduto@codemoteams.org</span>
              </div>
            </div>

            <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--eduto-border)' }} className="footer-divider" />

            {/* Complaints */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={24} strokeWidth={1.5} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Complaint Email</span>
                <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--eduto-text)' }}>feedback@codemoteams.org</span>
              </div>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .footer-divider { display: none !important; }
              .footer-container { flex-direction: column !important; align-items: flex-start !important; gap: 32px !important; }
            }
            @media print {
              body, #eduto-root { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
              nav, footer, .footer-container, button, hu-button { display: none !important; }
              #eduto-root * { color: black !important; border-color: black !important; border-radius: 0 !important; box-shadow: none !important; text-shadow: none !important; }
              .animate-scale-in-check, svg { stroke: black !important; color: black !important; }
              body > *:not(main) { display: none !important; }
            }
          `}} />
        </hu-box>

        {/* COURSE MODAL */}
        {modalCourse && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px'
          }} onClick={() => setModalCourse(null)}>
            <div className="animate-bounce-in" style={{
              background: 'var(--eduto-surface, #1e293b)',
              border: '2px solid var(--eduto-border, #334155)',
              boxShadow: '8px 8px 0 var(--eduto-border, #334155)',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setModalCourse(null)} style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'transparent', border: 'none', color: 'var(--eduto-text-muted)', cursor: 'pointer'
              }}>
                <X size={24} />
              </button>

              <hu-text variant="h2" weight="bold" margin-bottom="sm">{modalCourse.title}</hu-text>
              <hu-text color="muted" size="md" margin-bottom="md">{modalCourse.description}</hu-text>
              
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px', borderBottom: '2px solid var(--eduto-border, #334155)', paddingBottom: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Signal size={16} /> {modalCourse.level}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {modalCourse.duration}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} /> Urdu</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}><Star size={16} fill="currentColor" /> {modalCourse.rating}</span>
              </div>

              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <hu-text variant="h3" weight="bold" margin-bottom="sm">Course Outline</hu-text>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '12px', border: '1px solid var(--eduto-border, #334155)', padding: '16px', background: 'var(--eduto-bg, #0f172a)' }}>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--eduto-text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 1:</strong> Introduction to concepts and fundamentals.</li>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 2:</strong> Environment setup and tooling.</li>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 3:</strong> Deep dive into practical use-cases.</li>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 4:</strong> Real-world project building and best practices.</li>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 5:</strong> Advanced techniques and optimization.</li>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 6:</strong> Deployment and scaling.</li>
                      <li><strong style={{ color: 'var(--eduto-text, #f8fafc)' }}>Module 7:</strong> Final certification project.</li>
                    </ol>
                  </div>
                </div>

                <div style={{ flex: '1 1 250px' }}>
                  <hu-text variant="h3" weight="bold" margin-bottom="sm">Instructor</hu-text>
                  <div style={{ background: 'var(--eduto-bg, #0f172a)', padding: '16px', border: '2px solid var(--eduto-border, #334155)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--eduto-border, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        <User size={32} color="var(--eduto-text-muted, #94a3b8)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{modalCourse.mentor}</div>
                        <div style={{ color: 'var(--eduto-text-muted, #94a3b8)', fontSize: '0.9rem' }}>Senior Industry Expert</div>
                      </div>
                    </div>
                    <p style={{ color: 'var(--eduto-text-muted, #94a3b8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                      With over 10 years of experience in the industry, {modalCourse.mentor} brings real-world knowledge directly into the classroom.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid var(--eduto-border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <hu-text weight="bold" size="xl" margin-bottom="none">PKR {modalCourse.price}</hu-text>
                  {modalCourse.origPrice && <hu-text strikethrough color="red" size="md" margin-bottom="none">PKR {modalCourse.origPrice}</hu-text>}
                </div>
                <hu-button variant="primary" onClick={() => proceedToEnrollment(modalCourse)}>
                  Proceed to Enrollment
                </hu-button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
