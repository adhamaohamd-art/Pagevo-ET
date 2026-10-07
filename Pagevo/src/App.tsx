import { useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Code2, Compass, ExternalLink, Filter, Globe2, Grid2X2,
  ShoppingBag, Leaf, Menu, Minus, Plus, Search, Send, Sparkles, Star, X, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number;
  rental: number;
  tags: string[];
  demo: string;
  accent: string;
  included: string[];
};

type AddOn = { id: string; name: string; description: string; price: number; icon: typeof Zap };

type CartItem = {
  product: Product;
  plan: 'rental' | 'source';
  addons: string[];
  hosting: boolean;
  quantity: number;
};

const products: Product[] = [
  { id: 'nola', name: 'Nola House', category: 'Restaurants', description: 'A warm, editorial home for your next great table.', image: 'https://images.pexels.com/photos/39268201/pexels-photo-39268201.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: 890, rental: 190, tags: ['Booking ready', 'CMS'], demo: 'https://www.pexels.com', accent: '#e8a291', included: ['Responsive design', 'Menu editor', 'Reservation flow'] },
  { id: 'forma', name: 'Forma Objects', category: 'E-commerce', description: 'A tactile storefront for objects worth keeping.', image: 'https://images.pexels.com/photos/8015777/pexels-photo-8015777.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: 1200, rental: 240, tags: ['Shop ready', 'Product CMS'], demo: 'https://www.pexels.com', accent: '#d2d5c3', included: ['Product catalog', 'Cart experience', 'Collection filters'] },
  { id: 'atelier', name: 'Atelier No. 8', category: 'Portfolio', description: 'A quiet, confident canvas for a creative practice.', image: 'https://images.pexels.com/photos/28865179/pexels-photo-28865179.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: 740, rental: 160, tags: ['Portfolio', 'Journal'], demo: 'https://www.pexels.com', accent: '#c9d8df', included: ['Project archive', 'Journal pages', 'Contact form'] },
  { id: 'north', name: 'Northstar', category: 'SaaS', description: 'An intelligent launchpad for products with ambition.', image: 'https://images.pexels.com/photos/7670694/pexels-photo-7670694.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: 1500, rental: 320, tags: ['Conversion ready', 'Waitlist'], demo: 'https://www.pexels.com', accent: '#b4c5d1', included: ['Pricing blocks', 'Waitlist capture', 'Feature pages'] },
  { id: 'morrow', name: 'Morrow Skin', category: 'Beauty', description: 'A soft-spoken commerce experience for modern rituals.', image: 'https://images.pexels.com/photos/6767763/pexels-photo-6767763.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: 980, rental: 210, tags: ['Shop ready', 'Editorial'], demo: 'https://www.pexels.com', accent: '#e5c7bb', included: ['Product storytelling', 'Routine builder', 'Reviews'] },
  { id: 'casa', name: 'Casa Forma', category: 'Real Estate', description: 'A considered digital address for places and people.', image: 'https://images.pexels.com/photos/2387675/pexels-photo-2387675.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', price: 1100, rental: 230, tags: ['Listings', 'Map ready'], demo: 'https://www.pexels.com', accent: '#d9c8b1', included: ['Property listings', 'Map integration', 'Inquiry flow'] },
];

const addOns: AddOn[] = [
  { id: 'booking', name: 'Online booking', description: 'Let visitors reserve a time or table.', price: 80, icon: Clock3 },
  { id: 'whatsapp', name: 'WhatsApp integration', description: 'Turn questions into quick conversations.', price: 30, icon: Send },
  { id: 'payments', name: 'Payment gateway', description: 'Accept deposits or full payments online.', price: 120, icon: ShoppingBag },
  { id: 'language', name: 'Multi-language', description: 'Give your audience a more local experience.', price: 90, icon: Globe2 },
  { id: 'blog', name: 'Journal / blog', description: 'Share ideas, news, and stories with a CMS.', price: 70, icon: Leaf },
  { id: 'analytics', name: 'Analytics setup', description: 'Understand what your visitors do next.', price: 45, icon: Compass },
];

const categories = ['All', 'Restaurants', 'E-commerce', 'Portfolio', 'SaaS', 'Beauty', 'Real Estate'];
const formatPrice = (price: number) => `$${price.toLocaleString('en-US')}`;

function App() {
  const [view, setView] = useState<'home' | 'websites' | 'detail' | 'cart' | 'request' | 'success'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [plan, setPlan] = useState<'rental' | 'source'>('rental');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [hosting, setHosting] = useState(true);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [requestId, setRequestId] = useState('');

  const filteredProducts = useMemo(() => products.filter((product) => {
    const categoryMatch = category === 'All' || product.category === category;
    const searchMatch = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [category, search]);

  const configuredTotal = useMemo(() => {
    const base = plan === 'rental' ? selectedProduct.rental : selectedProduct.price;
    const customization = plan === 'rental' ? 180 : 260;
    const hostingPrice = hosting ? 120 : 0;
    const addonTotal = selectedAddons.reduce((sum, id) => sum + (addOns.find((addon) => addon.id === id)?.price ?? 0), 0);
    return base + customization + hostingPrice + addonTotal;
  }, [hosting, plan, selectedAddons, selectedProduct]);

  const cartTotal = cart.reduce((sum, item) => {
    const base = item.plan === 'rental' ? item.product.rental : item.product.price;
    const addonsTotal = item.addons.reduce((addonSum, id) => addonSum + (addOns.find((addon) => addon.id === id)?.price ?? 0), 0);
    return sum + (base + (item.plan === 'rental' ? 180 : 260) + (item.hosting ? 120 : 0) + addonsTotal) * item.quantity;
  }, 0);

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedAddons([]);
    setPlan('rental');
    setHosting(true);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = () => {
    setCart((items) => [...items, { product: selectedProduct, plan, addons: selectedAddons, hosting, quantity: 1 }]);
    setView('cart');
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('sending');
    const formData = new FormData(event.currentTarget);
    const newId = `PAGEVO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const payload = {
      customer_name: formData.get('name'), phone: formData.get('phone'), email: formData.get('email'),
      brand_name: formData.get('brand'), country: formData.get('country'), contact_method: formData.get('contact'),
      description: formData.get('description'), selected_website: selectedProduct.name, website_id: selectedProduct.id,
      purchase_type: plan, addons: selectedAddons, hosting, customization: plan === 'rental' ? 180 : 260,
      estimated_price: cart.length ? cartTotal : configuredTotal, status: 'New', request_code: newId,
    };
    if (supabase) {
      const { error } = await supabase.from('requests').insert(payload);
      if (error) { setSubmitState('error'); return; }
    }
    setRequestId(newId);
    setSubmitState('idle');
    setView('success');
    setCart([]);
  };

  const navigate = (next: typeof view) => { setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grain" />
      <header className="topbar">
        <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <button onClick={() => navigate('websites')}>Websites</button><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>Services</button><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button><button onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })}>Work</button><button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
        </nav>
        <button className="brand" onClick={() => navigate('home')}>PAGEVO<span className="brand-dot">.</span></button>
        <button className="cart-button" onClick={() => navigate('cart')} aria-label="Open cart"><ShoppingBag size={19} strokeWidth={1.8} /><span>{cart.length}</span></button>
      </header>

      {view === 'home' && <Home navigate={navigate} openProduct={openProduct} />}
      {view === 'websites' && <Websites products={filteredProducts} category={category} setCategory={setCategory} search={search} setSearch={setSearch} openProduct={openProduct} />}
      {view === 'detail' && <Detail product={selectedProduct} plan={plan} setPlan={setPlan} selectedAddons={selectedAddons} setSelectedAddons={setSelectedAddons} hosting={hosting} setHosting={setHosting} total={configuredTotal} addToCart={addToCart} navigate={navigate} />}
      {view === 'cart' && <Cart cart={cart} total={cartTotal} setCart={setCart} navigate={navigate} openProduct={openProduct} />}
      {view === 'request' && <RequestForm submitRequest={submitRequest} submitState={submitState} total={cart.length ? cartTotal : configuredTotal} product={selectedProduct} plan={plan} />}
      {view === 'success' && <Success requestId={requestId} navigate={navigate} />}

      <footer className="footer" id="contact">
        <div><div className="footer-brand">PAGEVO<span className="brand-dot">.</span></div><p>Websites built for brands<br />that want to stand out.</p></div>
        <div className="footer-links"><div><span>Explore</span><button onClick={() => navigate('websites')}>Websites</button><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button></div><div><span>Say hello</span><a href="mailto:hello@pagevo.studio">hello@pagevo.studio</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a><a href="https://wa.me" target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14} /></a></div></div>
        <div className="footer-bottom"><span>© 2026 Pagevo Studio</span><span>Made for the web, with intention.</span></div>
      </footer>
    </div>
  );
}

function Home({ navigate, openProduct }: { navigate: (view: 'home' | 'websites' | 'detail' | 'cart' | 'request' | 'success') => void; openProduct: (product: Product) => void }) {
  return <main>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">Build <span>— the shortcut to better</span></p><h1>WEBSITES<br /><em>with a point of view.</em></h1><p className="hero-sub">Ready-to-launch websites, built to fit your brand. Choose a starting point, make it yours, and go live with confidence.</p><div className="hero-actions"><button className="button button-dark" onClick={() => navigate('websites')}>Explore websites <ArrowRight size={17} /></button><button className="text-button" onClick={() => document.getElementById('custom')?.scrollIntoView({ behavior: 'smooth' })}>Build something custom <ArrowUpRight size={16} /></button></div></div>
      <div className="browser-mockup"><div className="browser-bar"><div className="browser-dots"><i /><i /><i /></div><span>pagevo.studio / nola-house</span><ExternalLink size={13} /></div><div className="mockup-content"><div className="mockup-kicker">NOLA HOUSE <span>Est. 2017</span></div><div className="mockup-title">Good food<br /><i>good mood.</i></div><div className="mockup-bottom"><span>Explore the menu</span><span>New Orleans, LA ↗</span></div></div></div>
    </section>
    <section className="marquee"><div>CHOOSE <span>·</span> CUSTOMIZE <span>·</span> LAUNCH <span>·</span> CHOOSE <span>·</span> CUSTOMIZE <span>·</span> LAUNCH <span>·</span></div></section>
    <section className="section featured" id="work"><div className="section-heading"><div><p className="eyebrow">The collection <span>— a few good places to start</span></p><h2>Find your<br /><i>starting point.</i></h2></div><button className="text-button" onClick={() => navigate('websites')}>View all websites <ArrowUpRight size={16} /></button></div><div className="product-grid featured-grid">{products.slice(0, 3).map((product, index) => <ProductCard key={product.id} product={product} openProduct={openProduct} index={index} />)}</div></section>
    <section className="section process" id="services"><div className="section-heading"><div><p className="eyebrow">The Pagevo way <span>— no blank canvas required</span></p><h2>From idea to<br /><i>in motion.</i></h2></div><p className="section-note">The best websites don't start from scratch.<br />They start from a strong point of view.</p></div><div className="steps"><div><span>01</span><Sparkles /><h3>Choose a website</h3><p>Start with a considered foundation, made for a real kind of business.</p></div><div><span>02</span><Zap /><h3>Make it yours</h3><p>Add your content, visual identity, and only the features you actually need.</p></div><div><span>03</span><Send /><h3>Request your project</h3><p>We’ll turn your selection into a polished, live website that works hard.</p></div></div></section>
    <section className="split-section" id="pricing"><div className="split-copy"><p className="eyebrow">Two ways in <span>— your call</span></p><h2>Rent it.<br /><i>Own it.</i></h2><p>Whether you want a beautifully finished site without the long commitment, or the full source to take wherever you go, Pagevo meets you there.</p><button className="text-button" onClick={() => navigate('websites')}>Compare options <ArrowRight size={16} /></button></div><div className="compare"><div><span className="compare-label">Rent for 1 year</span><strong>From $160<span>/mo</span></strong><p>A lower initial cost, hosting options, and a little room to evolve.</p><ul><li><Check size={14} /> Customization included</li><li><Check size={14} /> Support when you need it</li><li><Check size={14} /> Live in weeks, not months</li></ul></div><div className="compare-buy"><span className="compare-label">Buy the source</span><strong>From $740</strong><p>Full customization, full source code, and a website that is yours to keep.</p><ul><li><Check size={14} /> Full source code ownership</li><li><Check size={14} /> Deploy anywhere</li><li><Check size={14} /> Optional ongoing care</li></ul></div></div></section>
    <section className="custom-banner" id="custom"><div><p className="eyebrow">The custom route <span>— for the ones with a different brief</span></p><h2>Something else<br /><i>in mind?</i></h2></div><div><p>Tell us where you’re going. We’ll help you find the right way to get there.</p><button className="button button-light" onClick={() => navigate('request')}>Request a project <ArrowRight size={17} /></button></div></section>
    <section className="section why"><div className="why-mark">P<span>.</span></div><div><p className="eyebrow">Why Pagevo <span>— considered from the first click</span></p><h2>More than a<br /><i>template.</i></h2><p className="large-note">A strong beginning changes everything. Pagevo gives you the point of view, structure, and momentum to make a website people remember.</p></div></section>
  </main>;
}

function ProductCard({ product, openProduct, index }: { product: Product; openProduct: (product: Product) => void; index: number }) {
  return <article className="product-card" onClick={() => openProduct(product)}><div className="product-image" style={{ backgroundColor: product.accent }}><img src={product.image} alt={product.name} loading="lazy" /><span className="product-index">0{index + 1}</span><button className="round-arrow" aria-label={`View ${product.name}`}><ArrowUpRight size={17} /></button></div><div className="product-meta"><div><p>{product.category}</p><h3>{product.name}</h3></div><span>From {formatPrice(product.rental)}<small>/mo</small></span></div><p className="product-description">{product.description}</p></article>;
}

function Websites({ products: visibleProducts, category, setCategory, search, setSearch, openProduct }: { products: Product[]; category: string; setCategory: (value: string) => void; search: string; setSearch: (value: string) => void; openProduct: (product: Product) => void }) {
  return <main className="listing-page"><div className="listing-intro"><p className="eyebrow">The collection <span>— pick a strong beginning</span></p><h1>Websites<br /><i>with direction.</i></h1><p>Real websites for real businesses. Start with the one that feels like you, then make it yours.</p></div><div className="filter-row"><div className="category-scroll">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search collection" /></label></div>{visibleProducts.length ? <div className="product-grid listing-grid">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} openProduct={openProduct} index={index} />)}</div> : <div className="empty-state"><Filter size={24} /><h3>No websites found</h3><p>Try a different category or search term.</p></div>}</main>;
}

function Detail({ product, plan, setPlan, selectedAddons, setSelectedAddons, hosting, setHosting, total, addToCart, navigate }: { product: Product; plan: 'rental' | 'source'; setPlan: (value: 'rental' | 'source') => void; selectedAddons: string[]; setSelectedAddons: React.Dispatch<React.SetStateAction<string[]>>; hosting: boolean; setHosting: (value: boolean) => void; total: number; addToCart: () => void; navigate: (view: 'home' | 'websites' | 'detail' | 'cart' | 'request' | 'success') => void }) {
  const toggleAddon = (id: string) => setSelectedAddons((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return <main className="detail-page"><button className="back-button" onClick={() => navigate('websites')}><ChevronLeft size={17} /> Back to websites</button><div className="detail-hero"><div className="detail-image" style={{ backgroundColor: product.accent }}><img src={product.image} alt={product.name} /><div className="live-pill"><span /> Live preview <a href={product.demo} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a></div></div><div className="detail-copy"><p className="eyebrow">{product.category} <span>— ready for your next chapter</span></p><h1>{product.name}</h1><p className="detail-description">{product.description} Built with the details that turn browsing into belonging.</p><div className="tag-list">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="included"><p>Included with every Pagevo website</p>{product.included.map((item) => <span key={item}><Check size={14} /> {item}</span>)}</div></div></div><div className="configure"><div className="configure-main"><p className="eyebrow">Make it yours <span>— choose a route</span></p><h2>Configure your<br /><i>website.</i></h2><div className="plan-switch"><button className={plan === 'rental' ? 'selected' : ''} onClick={() => setPlan('rental')}><span>Rent for 1 year</span><strong>{formatPrice(product.rental)}<small>/mo</small></strong><em>Includes customization</em></button><button className={plan === 'source' ? 'selected' : ''} onClick={() => setPlan('source')}><span>Buy source code</span><strong>{formatPrice(product.price)}</strong><em>Full ownership & deployment</em></button></div><div className="addons"><div className="subheading"><h3>Add the extras</h3><span>{selectedAddons.length} selected</span></div>{addOns.map((addon) => { const Icon = addon.icon; const active = selectedAddons.includes(addon.id); return <button className={`addon-row ${active ? 'addon-active' : ''}`} key={addon.id} onClick={() => toggleAddon(addon.id)}><span className="addon-icon"><Icon size={17} /></span><span className="addon-copy"><strong>{addon.name}</strong><small>{addon.description}</small></span><b>+{formatPrice(addon.price)}</b><span className="check-circle">{active && <Check size={14} />}</span></button> })}</div><button className="hosting-row" onClick={() => setHosting(!hosting)}><span><Globe2 size={18} /><span><strong>1 year of hosting</strong><small>Fast, secure, and looked after.</small></span></span><b>{hosting ? '+$120' : 'Add'} <span className={`toggle ${hosting ? 'on' : ''}`}><i /></span></b></button></div><aside className="order-summary"><p className="eyebrow">Your estimate <span>— no payment today</span></p><h3>{product.name}</h3><div className="summary-line"><span>{plan === 'rental' ? '1-year rental' : 'Source code'} <small>+ customization</small></span><b>{formatPrice((plan === 'rental' ? product.rental : product.price) + (plan === 'rental' ? 180 : 260))}</b></div>{hosting && <div className="summary-line"><span>Hosting <small>1 year</small></span><b>$120</b></div>}{selectedAddons.map((id) => { const addon = addOns.find((item) => item.id === id)!; return <div className="summary-line" key={id}><span>{addon.name}</span><b>{formatPrice(addon.price)}</b></div>})}<div className="summary-total"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div><button className="button button-dark full" onClick={addToCart}>Add to request <ArrowRight size={17} /></button><p className="summary-foot"><CircleHelp size={14} /> Final scope and quote confirmed with our team.</p></aside></div></main>;
}

function Cart({ cart, total, setCart, navigate, openProduct }: { cart: CartItem[]; total: number; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; navigate: (view: 'home' | 'websites' | 'detail' | 'cart' | 'request' | 'success') => void; openProduct: (product: Product) => void }) {
  return <main className="cart-page"><div className="listing-intro cart-intro"><p className="eyebrow">Your shortlist <span>— a good place to begin</span></p><h1>Ready when<br /><i>you are.</i></h1></div>{cart.length === 0 ? <div className="empty-state cart-empty"><ShoppingBag size={28} /><h3>Your request is empty</h3><p>Save a website you like and configure it here.</p><button className="button button-dark" onClick={() => navigate('websites')}>Explore websites <ArrowRight size={17} /></button></div> : <div className="cart-layout"><div className="cart-items">{cart.map((item, index) => <div className="cart-item" key={`${item.product.id}-${index}`}><img src={item.product.image} alt={item.product.name} /><div className="cart-item-copy"><p>{item.product.category}</p><h3>{item.product.name}</h3><span>{item.plan === 'rental' ? '1-year rental' : 'Source code'} · {item.addons.length} add-ons</span><button onClick={() => openProduct(item.product)}>Edit configuration <ArrowUpRight size={14} /></button></div><strong>{formatPrice(total)}</strong><button className="remove" onClick={() => setCart((items) => items.filter((_, itemIndex) => itemIndex !== index))}><X size={17} /></button></div>)}<button className="continue-button" onClick={() => navigate('websites')}><ChevronLeft size={16} /> Continue browsing</button></div><aside className="order-summary cart-summary"><p className="eyebrow">Request summary <span>— no payment today</span></p><div className="summary-total"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div><p className="summary-explainer">Submit your selection and a Pagevo team member will contact you to confirm scope, timing, and a final quote.</p><button className="button button-dark full" onClick={() => navigate('request')}>Request / reserve <ArrowRight size={17} /></button></aside></div>}</main>;
}

function RequestForm({ submitRequest, submitState, total, product, plan }: { submitRequest: (event: React.FormEvent<HTMLFormElement>) => void; submitState: 'idle' | 'sending' | 'error'; total: number; product: Product; plan: string }) {
  return <main className="request-page"><div className="request-heading"><p className="eyebrow">One last thing <span>— then we’ll take it from here</span></p><h1>Let’s make it<br /><i>yours.</i></h1><p>Share a few details so our team can understand where you’re going. This is a request, not a payment.</p></div><form className="request-layout" onSubmit={submitRequest}><div className="request-fields"><div className="field-grid"><label>Full name<input name="name" required placeholder="Your name" /></label><label>Phone number<input name="phone" required placeholder="+1 555 000 0000" /></label></div><div className="field-grid"><label>Email address<input type="email" name="email" required placeholder="you@brand.com" /></label><label>Brand / business name<input name="brand" required placeholder="Your brand" /></label></div><div className="field-grid"><label>Country<input name="country" required placeholder="Where are you based?" /></label><label>Preferred contact<select name="contact" defaultValue="Email"><option>Email</option><option>WhatsApp</option><option>Phone call</option></select></label></div><label>Tell us about the project<textarea name="description" required placeholder="What are you building, and what should it feel like?" rows={5} /></label><button className="button button-dark" type="submit" disabled={submitState === 'sending'}>{submitState === 'sending' ? 'Sending request...' : 'Submit request'} <Send size={16} /></button>{submitState === 'error' && <p className="form-error">We couldn’t save your request. Please try again.</p>}</div><aside className="order-summary request-summary"><p className="eyebrow">Your selection <span>— held for review</span></p><div className="request-product"><img src={product.image} alt={product.name} /><div><strong>{product.name}</strong><span>{plan === 'rental' ? '1-year rental' : 'Source code'}</span></div></div><div className="summary-total"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div><p className="summary-explainer">Your estimate is a starting point. We’ll confirm the final scope and quote together.</p></aside></form></main>;
}

function Success({ requestId, navigate }: { requestId: string; navigate: (view: 'home' | 'websites' | 'detail' | 'cart' | 'request' | 'success') => void }) {
  return <main className="success-page"><div className="success-icon"><Check size={30} /></div><p className="eyebrow">All set <span>— we’ve got it from here</span></p><h1>Your request<br /><i>has landed.</i></h1><p>Thank you for choosing Pagevo. A member of our team will be in touch shortly to talk through your project and next steps.</p><div className="request-code"><span>Request ID</span><strong>{requestId}</strong></div><div className="hero-actions"><button className="button button-dark" onClick={() => navigate('websites')}>Back to websites <ArrowRight size={17} /></button><button className="text-button" onClick={() => navigate('home')}>Return home <ArrowUpRight size={16} /></button></div></main>;
}

export default App;
